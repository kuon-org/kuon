import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import prisma from "../prisma/client.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const migrationDirectory = path.resolve(__dirname, "../../migration");

const MIGRATION_TABLE = "kuon_migrations";

const ensureMigrationTable = async () => {
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS ${MIGRATION_TABLE} (
      name TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);
};

const getMigrationFiles = async () => {
  try {
    const files = await readdir(migrationDirectory, { withFileTypes: true });

    return files
      .filter((file) => file.isFile() && file.name.endsWith(".sql"))
      .map((file) => file.name)
      .sort();
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return [];
    }

    throw error;
  }
};

const getAppliedMigrations = async () => {
  const rows = await prisma.$queryRawUnsafe<{ name: string }[]>(
    `SELECT name FROM ${MIGRATION_TABLE}`,
  );

  return new Set(rows.map((row) => row.name));
};

const applyMigration = async (name: string) => {
  const filePath = path.join(migrationDirectory, name);
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

  const migrationFiles = await getMigrationFiles();
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
    await applyMigration(migration);
  }
};
