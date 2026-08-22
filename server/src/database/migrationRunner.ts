import { access, readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import prisma from "../prisma/client.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const migrationDirectories = [
  path.resolve(__dirname, "../migration"),
  path.resolve(__dirname, "../../migration"),
];

const MIGRATION_TABLE = "knowledge.kuon_migrations";

const findMigrationDirectory = async () => {
  for (const directory of migrationDirectories) {
    try {
      await access(directory);
      return directory;
    } catch {
      // Try the next candidate.
    }
  }

  return null;
};

const ensureMigrationTable = async () => {
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS ${MIGRATION_TABLE} (
      name TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);
};

const getMigrationFiles = async (directory: string) => {
  const files = await readdir(directory, { withFileTypes: true });

  return files
    .filter((file) => file.isFile() && file.name.endsWith(".sql"))
    .map((file) => file.name)
    .sort();
};

const getAppliedMigrations = async () => {
  const rows = await prisma.$queryRawUnsafe<{ name: string }[]>(
    `SELECT name FROM ${MIGRATION_TABLE}`,
  );

  return new Set(rows.map((row) => row.name));
};

const applyMigration = async (directory: string, name: string) => {
  const filePath = path.join(directory, name);
  const sql = await readFile(filePath, "utf-8");

  if (!sql.trim()) {
    throw new Error(`Migration file is empty: ${name}`);
  }

  await prisma.$transaction(async (tx) => {
    await tx.$executeRawUnsafe(sql);
    await tx.$executeRawUnsafe(
      `INSERT INTO ${MIGRATION_TABLE} (name) VALUES ($1)`,
      name,
    );
  });

  console.log(`✅ Migration applied: ${name}`);
};

export const runMigrations = async () => {
  await ensureMigrationTable();

  const migrationDirectory = await findMigrationDirectory();
  if (!migrationDirectory) {
    console.log("📦 No migration directory found");
    return;
  }

  const migrationFiles = await getMigrationFiles(migrationDirectory);
  const appliedMigrations = await getAppliedMigrations();
  const pendingMigrations = migrationFiles.filter(
    (name) => !appliedMigrations.has(name),
  );

  if (pendingMigrations.length === 0) {
    console.log("📦 Database migrations are up to date");
    return;
  }

  console.log(`📦 Applying ${pendingMigrations.length} database migration(s)`);

  for (const migration of pendingMigrations) {
    await applyMigration(migrationDirectory, migration);
  }
};
