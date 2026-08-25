import { ServerSettingsRepository } from "../repositories/serverSettingsRepository.js";
import { ServerSettingKey } from "../constants/serverSettings.js";

export type ServerSetting = {
  key: string;
  value: string;
  updatedAt: Date;
};

export type ServerSettings = {
  allowApiKey: boolean;
  requireTotpForExternalIdp: boolean;
  requireAuthentication: boolean;
  maintenanceMode: boolean;
};

const defaultSettings: ServerSettings = {
  allowApiKey: false,
  requireTotpForExternalIdp: false,
  requireAuthentication: false,
  maintenanceMode: false,
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
      if (setting.key === ServerSettingKey.RequireTotpForExternalIdp) {
        this.settings.requireTotpForExternalIdp = setting.value === "true";
      }
      if (setting.key === ServerSettingKey.RequireAuthentication) {
        this.settings.requireAuthentication = setting.value === "true";
      }
      if (setting.key === ServerSettingKey.MaintenanceMode) {
        this.settings.maintenanceMode = setting.value === "true";
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
      case ServerSettingKey.RequireTotpForExternalIdp:
        return this.settings.requireTotpForExternalIdp;
      case ServerSettingKey.RequireAuthentication:
        return this.settings.requireAuthentication;
      case ServerSettingKey.MaintenanceMode:
        return this.settings.maintenanceMode;
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
    if (normalizedKey === ServerSettingKey.RequireTotpForExternalIdp) {
      this.settings.requireTotpForExternalIdp = value === "true";
    }
    if (normalizedKey === ServerSettingKey.RequireAuthentication) {
      this.settings.requireAuthentication = value === "true";
    }
    if (normalizedKey === ServerSettingKey.MaintenanceMode) {
      this.settings.maintenanceMode = value === "true";
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
    if (key === ServerSettingKey.RequireTotpForExternalIdp) {
      this.settings.requireTotpForExternalIdp =
        defaultSettings.requireTotpForExternalIdp;
    }
    if (key === ServerSettingKey.RequireAuthentication) {
      this.settings.requireAuthentication = defaultSettings.requireAuthentication;
    }
    if (key === ServerSettingKey.MaintenanceMode) {
      this.settings.maintenanceMode = defaultSettings.maintenanceMode;
    }
  }
}

export const serverSettingsService = new ServerSettingsService(
  new ServerSettingsRepository(),
);
