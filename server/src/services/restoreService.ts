import { spawn } from "node:child_process";
import { createReadStream, createWriteStream } from "node:fs";
import {
  access,
  lstat,
  mkdir,
  mkdtemp,
  readFile,
  readdir,
  rm,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { pipeline } from "node:stream/promises";
import prisma from "../prisma/client.js";
import { runMigrations } from "../database/migrationRunner.js";
import { ServerSettingKey } from "../constants/serverSettings.js";
import { getFileStorage } from "../storage/storageFactory.js";
import { serverSettingsService } from "./serverSettingsService.js";
import { runtimeMaintenanceService } from "./runtimeMaintenanceService.js";

interface BackupManifest {
  formatVersion: number;
  createdAt: string;
  kuonVersion: string;
  postgresVersion: string;
  pgDumpVersion: string;
}

const SUPPORTED_FORMAT_VERSION = 1;

const runCommand = (
  command: string,
  args: string[],
  options?: { cwd?: string },
): Promise<string> =>
  new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: options?.cwd,
      env: process.env,
      stdio: ["ignore", "pipe", "pipe"],
    });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk) => (stdout += chunk.toString()));
    child.stderr.on("data", (chunk) => (stderr += chunk.toString()));
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) return resolve(stdout.trim());
      reject(new Error(`${command} failed (${code}): ${stderr.trim() || "unknown error"}`));
    });
  });

const createPgConnectionUri = () => {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error("DATABASE_URL is not configured");
  const url = new URL(databaseUrl);
  url.searchParams.delete("schema");
  return url.toString();
};

const getPgDumpCommand = () => process.env.PG_DUMP_PATH?.trim() || "pg_dump";
const getPgRestoreCommand = () => process.env.PG_RESTORE_PATH?.trim() || "pg_restore";

const parseMajor = (value: string) => value.match(/\b(\d+)(?:\.\d+)?/)?.[1] ?? null;

const isBackupManifest = (value: unknown): value is BackupManifest => {
  if (!value || typeof value !== "object") return false;
  const manifest = value as Record<string, unknown>;
  return (
    typeof manifest.formatVersion === "number" &&
    typeof manifest.createdAt === "string" &&
    typeof manifest.kuonVersion === "string" &&
    typeof manifest.postgresVersion === "string" &&
    typeof manifest.pgDumpVersion === "string"
  );
};

const validateEntryName = (entry: string) => {
  const normalized = entry.replace(/\\/g, "/");
  if (!normalized || normalized.startsWith("/") || /^[A-Za-z]:\//.test(normalized)) {
    throw new Error(`Unsafe archive entry: ${entry}`);
  }
  if (normalized.split("/").includes("..")) {
    throw new Error(`Unsafe archive entry: ${entry}`);
  }
  const root = normalized.split("/")[0];
  if (!["manifest.json", "database.dump", "uploads"].includes(root)) {
    throw new Error(`Unexpected archive entry: ${entry}`);
  }
};

const assertNoLinks = async (directory: string): Promise<void> => {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const target = path.join(directory, entry.name);
    const stat = await lstat(target);
    if (stat.isSymbolicLink()) throw new Error("Backup archive must not contain symbolic links");
    if (stat.isDirectory()) await assertNoLinks(target);
  }
};

const materializeStorage = async (destination: string) => {
  const storage = getFileStorage();
  await mkdir(destination, { recursive: true });

  for await (const file of storage.list()) {
    const target = path.join(destination, ...file.key.split("/"));
    await mkdir(path.dirname(target), { recursive: true });
    await pipeline(await storage.get(file.key), createWriteStream(target));
  }
};

const clearStorage = async () => {
  const storage = getFileStorage();
  const keys: string[] = [];
  for await (const file of storage.list()) keys.push(file.key);
  for (const key of keys) await storage.delete(key);
};

const restoreDirectoryToStorage = async (
  directory: string,
  relativePath = "",
): Promise<void> => {
  const storage = getFileStorage();
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const absolutePath = path.join(directory, entry.name);
    const key = relativePath
      ? path.posix.join(relativePath, entry.name)
      : entry.name;

    if (entry.isDirectory()) {
      await restoreDirectoryToStorage(absolutePath, key);
    } else if (entry.isFile()) {
      await storage.put({ key, body: createReadStream(absolutePath) });
    }
  }
};

export class RestoreService {
  async restore(archivePath: string) {
    if (runtimeMaintenanceService.isLocked()) {
      throw new Error("Another restore operation is already running");
    }

    const workDir = await mkdtemp(path.join(tmpdir(), "kuon-restore-"));
    const extractedDir = path.join(workDir, "extracted");
    const safetyDumpPath = path.join(workDir, "pre-restore.dump");
    const safetyUploadsPath = path.join(workDir, "pre-restore-uploads");
    let uploadsRestoreStarted = false;
    let databaseRestoreStarted = false;

    try {
      await mkdir(extractedDir, { recursive: true });

      const entryList = await runCommand("tar", ["-tzf", archivePath]);
      const entries = entryList.split(/\r?\n/).filter(Boolean);
      if (entries.length === 0) throw new Error("Backup archive is empty");
      entries.forEach(validateEntryName);

      const verboseList = await runCommand("tar", ["-tvzf", archivePath]);
      if (verboseList.split(/\r?\n/).some((line) => line.startsWith("l") || line.startsWith("h"))) {
        throw new Error("Backup archive must not contain links");
      }

      await runCommand("tar", ["-xzf", archivePath, "-C", extractedDir]);
      await assertNoLinks(extractedDir);

      const manifestPath = path.join(extractedDir, "manifest.json");
      const databaseDumpPath = path.join(extractedDir, "database.dump");
      const restoredUploadsPath = path.join(extractedDir, "uploads");
      await Promise.all([
        access(manifestPath),
        access(databaseDumpPath),
        access(restoredUploadsPath),
      ]);

      const rawManifest: unknown = JSON.parse(await readFile(manifestPath, "utf8"));
      if (!isBackupManifest(rawManifest)) {
        throw new Error("Invalid backup manifest structure");
      }
      const manifest = rawManifest;
      if (manifest.formatVersion !== SUPPORTED_FORMAT_VERSION) {
        throw new Error(`Unsupported backup formatVersion: ${manifest.formatVersion}`);
      }
      if (!manifest.createdAt || Number.isNaN(Date.parse(manifest.createdAt))) {
        throw new Error("Invalid backup manifest: createdAt");
      }

      await runCommand(getPgRestoreCommand(), ["--list", databaseDumpPath]);

      const [serverVersion] = await prisma.$queryRaw<Array<{ version: string }>>`
        SELECT current_setting('server_version') AS version
      `;
      const backupPgMajor = parseMajor(manifest.postgresVersion);
      const currentPgMajor = parseMajor(serverVersion?.version ?? "");
      if (!backupPgMajor) throw new Error("Invalid backup PostgreSQL version");
      if (!currentPgMajor) throw new Error("Unable to determine current PostgreSQL version");
      if (backupPgMajor !== currentPgMajor) {
        throw new Error(
          `PostgreSQL major version mismatch: backup=${backupPgMajor}, current=${currentPgMajor}`,
        );
      }

      // Snapshot the currently configured provider before entering the destructive phase.
      await materializeStorage(safetyUploadsPath);

      runtimeMaintenanceService.lock("instance-restore");
      const databaseUri = createPgConnectionUri();

      await runCommand(getPgDumpCommand(), [
        "--format=custom",
        "--file",
        safetyDumpPath,
        "--dbname",
        databaseUri,
      ]);

      databaseRestoreStarted = true;
      await runCommand(getPgRestoreCommand(), [
        "--clean",
        "--if-exists",
        "--no-owner",
        "--no-privileges",
        "--exit-on-error",
        "--dbname",
        databaseUri,
        databaseDumpPath,
      ]);

      await runMigrations();

      uploadsRestoreStarted = true;
      await clearStorage();
      await restoreDirectoryToStorage(restoredUploadsPath);

      await prisma.user_sessions.deleteMany();
      await serverSettingsService.initialize();
      await serverSettingsService.set(ServerSettingKey.MaintenanceMode, "false");

      return {
        success: true,
        manifest,
        message: "Restore completed. All sessions were invalidated.",
      };
    } catch (error) {
      if (uploadsRestoreStarted) {
        await clearStorage().catch(() => {});
        await restoreDirectoryToStorage(safetyUploadsPath).catch((rollbackError) => {
          console.error("❌ Uploads rollback failed:", rollbackError);
        });
      }

      if (databaseRestoreStarted) {
        const databaseUri = createPgConnectionUri();
        await runCommand(getPgRestoreCommand(), [
          "--clean",
          "--if-exists",
          "--no-owner",
          "--no-privileges",
          "--exit-on-error",
          "--dbname",
          databaseUri,
          safetyDumpPath,
        ]).catch((rollbackError) => {
          console.error("❌ Restore rollback failed:", rollbackError);
        });
        await serverSettingsService.initialize().catch(() => {});
      }

      throw error;
    } finally {
      runtimeMaintenanceService.unlock();
      await rm(workDir, { recursive: true, force: true }).catch(() => {});
    }
  }
}

export const restoreService = new RestoreService();
