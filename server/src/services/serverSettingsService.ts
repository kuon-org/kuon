import { ServerSettingsRepository } from "../repositories/serverSettingsRepository.js";
import { ServerSettingKey } from "../constants/serverSettings.js";

export type ServerSetting = {
  key: string;
  value: string;
  updatedAt: Date;
};

export type ServerSettings = {
  allowApiKey: boolean;
};

const defaultSettings: ServerSettings = {
  allowApiKey: false,
};

export class ServerSettingsService {
  private settings: ServerSettings = { ...defaultSettings };

  constructor(private repo: ServerSettingsRepository) {}

  async initialize(): Promise<void> {
    const settings = await this.repo.findAll();
    this.settings = { ...defaultSettings };

    for (const setting of settings) {
      if (setting.key === ServerSettingKey.AllowApiKey) {
        this.settings.allowApiKey = setting.value === "true";
      }
    }
  }

  getSettings(): ServerSettings {
    return { ...this.settings };
  }

  isEnabled(key: ServerSettingKey): boolean {
    switch (key) {
      case ServerSettingKey.AllowApiKey:
        return this.settings.allowApiKey;
    }
  }

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

    const normalizedKey = key.trim();
    const setting = await this.repo.upsert(normalizedKey, value);

    if (normalizedKey === ServerSettingKey.AllowApiKey) {
      this.settings.allowApiKey = value === "true";
    }

    return {
      key: setting.key,
      value: setting.value,
      updatedAt: setting.updated_at,
    };
  }

  async delete(key: string): Promise<void> {
    await this.repo.delete(key);

    if (key === ServerSettingKey.AllowApiKey) {
      this.settings.allowApiKey = defaultSettings.allowApiKey;
    }
  }
}

export const serverSettingsService = new ServerSettingsService(
  new ServerSettingsRepository(),
);
