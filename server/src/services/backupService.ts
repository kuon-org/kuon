import { spawn } from "node:child_process";
import { createWriteStream } from "node:fs";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { pipeline } from "node:stream/promises";
import prisma from "../prisma/client.js";
import { getFileStorage } from "../storage/storageFactory.js";

export interface BackupArchive {
  fileName: string;
  archivePath: string;
  cleanup: () => Promise<void>;
}

interface BackupStorageFile {
  key: string;
  contentType?: string;
  contentLength?: number;
}

interface BackupManifest {
  formatVersion: number;
  createdAt: string;
  kuonVersion: string;
  postgresVersion: string;
  pgDumpVersion: string;
  storage?: {
    formatVersion: number;
    files: BackupStorageFile[];
  };
}

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

    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });

    child.on("error", (error) => reject(error));
    child.on("close", (code) => {
      if (code === 0) return resolve(stdout.trim());
      reject(
        new Error(
          `${command} failed with exit code ${code}: ${stderr.trim() || "unknown error"}`,
        ),
      );
    });
  });

const getPgDumpCommand = () => process.env.PG_DUMP_PATH?.trim() || "pg_dump";

const createPgConnectionUri = () => {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error("DATABASE_URL is not configured");

  const url = new URL(databaseUrl);
  url.searchParams.delete("schema");
  return url.toString();
};

const timestampForFileName = (date: Date) =>
  date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");

const materializeStorage = async (destination: string) => {
  const storage = getFileStorage();
  const files: BackupStorageFile[] = [];
  await mkdir(destination, { recursive: true });

  for await (const file of storage.list()) {
    const target = path.join(destination, ...file.key.split("/"));
    await mkdir(path.dirname(target), { recursive: true });
    const stored = await storage.get(file.key);
    await pipeline(stored.body, createWriteStream(target));
    files.push({
      key: file.key,
      contentType: stored.contentType,
      contentLength: stored.contentLength,
    });
  }

  return files;
};

export class BackupService {
  async createArchive(): Promise<BackupArchive> {
    const createdAt = new Date();
    const tempDirectory = await mkdtemp(path.join(tmpdir(), "kuon-backup-"));
    const databaseDumpPath = path.join(tempDirectory, "database.dump");
    const manifestPath = path.join(tempDirectory, "manifest.json");
    const uploadsPath = path.join(tempDirectory, "uploads");
    const archivePath = path.join(tempDirectory, "backup.tar.gz");
    const fileName = `kuon-backup-${timestampForFileName(createdAt)}.tar.gz`;

    try {
      const pgDump = getPgDumpCommand();
      const databaseUri = createPgConnectionUri();

      await runCommand(pgDump, [
        "--format=custom",
        "--file",
        databaseDumpPath,
        "--dbname",
        databaseUri,
      ]);

      const pgDumpVersion = await runCommand(pgDump, ["--version"]);
      const [postgres] = await prisma.$queryRaw<Array<{ version: string }>>`
        SELECT current_setting('server_version') AS version
      `;

      const storageFiles = await materializeStorage(uploadsPath);
      const manifest: BackupManifest = {
        formatVersion: 1,
        createdAt: createdAt.toISOString(),
        kuonVersion: process.env.KUON_VERSION ?? "unknown",
        postgresVersion: postgres?.version ?? "unknown",
        pgDumpVersion,
        storage: {
          formatVersion: 1,
          files: storageFiles,
        },
      };
      await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");

      await runCommand("tar", [
        "-czf",
        archivePath,
        "-C",
        tempDirectory,
        "manifest.json",
        "database.dump",
        "uploads",
      ]);

      return {
        fileName,
        archivePath,
        cleanup: () => rm(tempDirectory, { recursive: true, force: true }),
      };
    } catch (error) {
      await rm(tempDirectory, { recursive: true, force: true }).catch(() => {});
      throw error;
    }
  }
}

export const backupService = new BackupService();
