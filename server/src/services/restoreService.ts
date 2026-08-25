import { spawn } from "node:child_process";
import {
  access,
  cp,
  lstat,
  mkdir,
  mkdtemp,
  readFile,
  readdir,
  rm,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import prisma from "../prisma/client.js";
import { runMigrations } from "../database/migrationRunner.js";
import { ServerSettingKey } from "../constants/serverSettings.js";
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

const directoryExists = async (directory: string) => {
  try {
    const stat = await lstat(directory);
    return stat.isDirectory();
  } catch {
    return false;
  }
};

const clearDirectory = async (directory: string) => {
  await mkdir(directory, { recursive: true });
  for (const entry of await readdir(directory)) {
    await rm(path.join(directory, entry), { recursive: true, force: true });
  }
};

const copyDirectoryContents = async (source: string, destination: string) => {
  await mkdir(destination, { recursive: true });
  for (const entry of await readdir(source)) {
    await cp(path.join(source, entry), path.join(destination, entry), {
      recursive: true,
      force: true,
    });
  }
};

export class RestoreService {
  private uploadsPath = path.resolve(process.cwd(), "public/uploads");

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

      // Ensure the custom-format dump is readable before changing the current instance.
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

      // Prepare an uploads rollback copy before entering the destructive phase.
      await mkdir(safetyUploadsPath, { recursive: true });
      if (await directoryExists(this.uploadsPath)) {
        await copyDirectoryContents(this.uploadsPath, safetyUploadsPath);
      }

      runtimeMaintenanceService.lock("instance-restore");
      const databaseUri = createPgConnectionUri();

      // Safety DB snapshot for best-effort rollback if restore fails.
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

      // Replace contents rather than renaming the directory itself because uploads
      // can be a Docker bind/named-volume mount point.
      uploadsRestoreStarted = true;
      await clearDirectory(this.uploadsPath);
      await copyDirectoryContents(restoredUploadsPath, this.uploadsPath);

      // Restored sessions must never remain valid on a new/restored instance.
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
        await clearDirectory(this.uploadsPath).catch(() => {});
        await copyDirectoryContents(safetyUploadsPath, this.uploadsPath).catch((rollbackError) => {
          console.error("❌ Uploads rollback failed:", rollbackError);
        });
      }

      // Best-effort DB rollback using the snapshot made immediately before restore.
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
