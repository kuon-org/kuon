import prisma from "../prisma/client.js";

type ServerSettingRow = {
  key: string;
  value: string;
  updated_at: Date;
};

export class ServerSettingsRepository {
  async findAll(): Promise<ServerSettingRow[]> {
    return prisma.$queryRaw<ServerSettingRow[]>`
      SELECT key, value, updated_at
      FROM knowledge.server_settings
      ORDER BY key
    `;
  }

  async findByKey(key: string): Promise<ServerSettingRow | null> {
    const rows = await prisma.$queryRaw<ServerSettingRow[]>`
      SELECT key, value, updated_at
      FROM knowledge.server_settings
      WHERE key = ${key}
      LIMIT 1
    `;
    return rows[0] ?? null;
  }

  async upsert(key: string, value: string): Promise<ServerSettingRow> {
    const rows = await prisma.$queryRaw<ServerSettingRow[]>`
      INSERT INTO knowledge.server_settings (key, value)
      VALUES (${key}, ${value})
      ON CONFLICT (key)
      DO UPDATE SET
        value = EXCLUDED.value,
        updated_at = CURRENT_TIMESTAMP
      RETURNING key, value, updated_at
    `;

    return rows[0];
  }

  async delete(key: string): Promise<void> {
    await prisma.$executeRaw`
      DELETE FROM knowledge.server_settings
      WHERE key = ${key}
    `;
  }
}
