import { ServerSettingsRepository } from "../repositories/serverSettingsRepository.js";

export type ServerSetting = {
  key: string;
  value: string;
  updatedAt: Date;
};

export class ServerSettingsService {
  constructor(private repo: ServerSettingsRepository) {}

  async getAll(): Promise<ServerSetting[]> {
    const settings = await this.repo.findAll();
    return settings.map(({ key, value, updated_at }) => ({
      key,
      value,
      updatedAt: updated_at,
    }));
  }

  async get(key: string): Promise<ServerSetting | null> {
    const setting = await this.repo.findByKey(key);
    if (!setting) return null;

    return {
      key: setting.key,
      value: setting.value,
      updatedAt: setting.updated_at,
    };
  }

  async set(key: string, value: string): Promise<ServerSetting> {
    if (!key.trim()) throw new Error("設定キーを指定してください");

    const setting = await this.repo.upsert(key.trim(), value);
    return {
      key: setting.key,
      value: setting.value,
      updatedAt: setting.updated_at,
    };
  }

  async delete(key: string): Promise<void> {
    await this.repo.delete(key);
  }
}
