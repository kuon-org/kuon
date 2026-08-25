# Instance Backup & Restore

Kuon can export and restore an instance backup from **Admin → Backup & Restore**.

## Backup contents

```text
kuon-backup-YYYYMMDDTHHmmssZ.tar.gz
├─ manifest.json
├─ database.dump
└─ uploads/
```

The archive does **not** contain deployment secrets or infrastructure configuration such as `.env`, `DATABASE_URL`, JWT secrets, Cloudflare Tunnel credentials, Docker Compose configuration, or reverse proxy configuration.

## Moving Kuon to another server

1. Prepare the new Kuon environment and configure its `.env` / database connection.
2. Start the new instance and create or sign in with an administrator account.
3. Open **Admin → Backup & Restore**.
4. Select the backup archive exported from the old instance.
5. Confirm the restore operation.
6. Kuon validates the archive and PostgreSQL major version before changing the instance.
7. During restore, Kuon enables a runtime maintenance lock and blocks data/API access.
8. The database and `uploads` contents are replaced with the backup contents.
9. Pending Kuon database migrations are applied.
10. All restored sessions are invalidated.
11. Server maintenance mode remains enabled after restore. Sign in again, verify the restored instance, then disable maintenance mode from Server Settings.

## Failure handling

Before changing the database, Kuon creates a temporary PostgreSQL dump of the current database and copies the current `uploads` contents. If restore fails after replacement has started, Kuon attempts to restore those temporary copies.

This rollback is best-effort. Keep an external backup before performing a restore on important instances.

## Local development

The Docker runtime includes PostgreSQL 18 client tools, so no additional configuration is required in the container.

When running the server directly on Windows, `pg_dump.exe` and `pg_restore.exe` must be available on `PATH`, or explicitly configured:

```powershell
$env:PG_DUMP_PATH="C:\Program Files\PostgreSQL\18\bin\pg_dump.exe"
$env:PG_RESTORE_PATH="C:\Program Files\PostgreSQL\18\bin\pg_restore.exe"
pnpm dev
```

Restore currently supports backups whose PostgreSQL **major version** matches the target database and whose `manifest.json` uses a supported backup `formatVersion`.
