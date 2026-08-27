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
  webhooksEnabled: boolean;
  allowUserWebhooks: boolean;
  notificationsEnabled: boolean;
};

const defaultSettings: ServerSettings = {
  allowApiKey: false,
  requireTotpForExternalIdp: false,
  requireAuthentication: false,
  maintenanceMode: false,
  webhooksEnabled: false,
  allowUserWebhooks: false,
  notificationsEnabled: true,
};

export class ServerSettingsService {
  private settings: ServerSettings = { ...defaultSettings };

  constructor(private repo: ServerSettingsRepository) {}

  async initialize(): Promise<void> {
    const settings = await this.repo.findAll();
    this.settings = { ...defaultSettings };

    for (const setting of settings) {
      this.applySetting(setting.key, setting.value);
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
      case ServerSettingKey.WebhooksEnabled:
        return this.settings.webhooksEnabled;
      case ServerSettingKey.AllowUserWebhooks:
        return this.settings.allowUserWebhooks;
      case ServerSettingKey.NotificationsEnabled:
        return this.settings.notificationsEnabled;
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
    this.applySetting(normalizedKey, value);

    return {
      key: setting.key,
      value: setting.value,
      updatedAt: setting.updated_at,
    };
  }

  async delete(key: string): Promise<void> {
    await this.repo.delete(key);
    this.resetSetting(key);
  }

  private applySetting(key: string, value: string): void {
    const enabled = value === "true";

    switch (key) {
      case ServerSettingKey.AllowApiKey:
        this.settings.allowApiKey = enabled;
        break;
      case ServerSettingKey.RequireTotpForExternalIdp:
        this.settings.requireTotpForExternalIdp = enabled;
        break;
      case ServerSettingKey.RequireAuthentication:
        this.settings.requireAuthentication = enabled;
        break;
      case ServerSettingKey.MaintenanceMode:
        this.settings.maintenanceMode = enabled;
        break;
      case ServerSettingKey.WebhooksEnabled:
        this.settings.webhooksEnabled = enabled;
        break;
      case ServerSettingKey.AllowUserWebhooks:
        this.settings.allowUserWebhooks = enabled;
        break;
      case ServerSettingKey.NotificationsEnabled:
        this.settings.notificationsEnabled = enabled;
        break;
    }
  }

  private resetSetting(key: string): void {
    switch (key) {
      case ServerSettingKey.AllowApiKey:
        this.settings.allowApiKey = defaultSettings.allowApiKey;
        break;
      case ServerSettingKey.RequireTotpForExternalIdp:
        this.settings.requireTotpForExternalIdp =
          defaultSettings.requireTotpForExternalIdp;
        break;
      case ServerSettingKey.RequireAuthentication:
        this.settings.requireAuthentication = defaultSettings.requireAuthentication;
        break;
      case ServerSettingKey.MaintenanceMode:
        this.settings.maintenanceMode = defaultSettings.maintenanceMode;
        break;
      case ServerSettingKey.WebhooksEnabled:
        this.settings.webhooksEnabled = defaultSettings.webhooksEnabled;
        break;
      case ServerSettingKey.AllowUserWebhooks:
        this.settings.allowUserWebhooks = defaultSettings.allowUserWebhooks;
        break;
      case ServerSettingKey.NotificationsEnabled:
        this.settings.notificationsEnabled = defaultSettings.notificationsEnabled;
        break;
    }
  }
}

export const serverSettingsService = new ServerSettingsService(
  new ServerSettingsRepository(),
);
