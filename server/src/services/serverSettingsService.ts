import { ServerSettingsRepository } from "../repositories/serverSettingsRepository.js";
import { ServerSettingKey } from "../constants/serverSettings.js";
import type { ConfigurationSource } from "../config/environmentConfiguration.js";

export type ServerSetting = {
  key: string;
  value: string;
  updatedAt: Date | null;
  source: ConfigurationSource;
  readOnly: boolean;
};

export type EmailVerificationPolicy = "disabled" | "required";

export type ServerSettings = {
  allowApiKey: boolean;
  allowLocalAccountRegistration: boolean;
  emailVerificationPolicy: EmailVerificationPolicy;
  requireTotpForExternalIdp: boolean;
  requireAuthentication: boolean;
  maintenanceMode: boolean;
  webhooksEnabled: boolean;
  allowUserWebhooks: boolean;
  notificationsEnabled: boolean;
};

const defaultSettings: ServerSettings = {
  allowApiKey: false,
  allowLocalAccountRegistration: true,
  emailVerificationPolicy: "disabled",
  requireTotpForExternalIdp: false,
  requireAuthentication: false,
  maintenanceMode: false,
  webhooksEnabled: false,
  allowUserWebhooks: false,
  notificationsEnabled: true,
};

const SENSITIVE_SETTING_KEY_PATTERN = /(?:password|secret|token|credential)$/i;

const ENV_SETTING_NAMES: Record<ServerSettingKey, string> = {
  [ServerSettingKey.AllowApiKey]: "KUON_SETTING_ALLOW_API_KEY",
  [ServerSettingKey.AllowLocalAccountRegistration]:
    "KUON_SETTING_ALLOW_LOCAL_ACCOUNT_REGISTRATION",
  [ServerSettingKey.EmailVerificationPolicy]:
    "KUON_SETTING_EMAIL_VERIFICATION_POLICY",
  [ServerSettingKey.RequireTotpForExternalIdp]:
    "KUON_SETTING_REQUIRE_TOTP_FOR_EXTERNAL_IDP",
  [ServerSettingKey.RequireAuthentication]:
    "KUON_SETTING_REQUIRE_AUTHENTICATION",
  [ServerSettingKey.MaintenanceMode]: "KUON_SETTING_MAINTENANCE_MODE",
  [ServerSettingKey.WebhooksEnabled]: "KUON_SETTING_WEBHOOKS_ENABLED",
  [ServerSettingKey.AllowUserWebhooks]: "KUON_SETTING_ALLOW_USER_WEBHOOKS",
  [ServerSettingKey.NotificationsEnabled]:
    "KUON_SETTING_NOTIFICATIONS_ENABLED",
};

const isServerSettingKey = (key: string): key is ServerSettingKey =>
  Object.values(ServerSettingKey).includes(key as ServerSettingKey);

export class ServerSettingsService {
  private settings: ServerSettings = { ...defaultSettings };
  private environmentOverrides = new Map<string, string>();

  constructor(private repo: ServerSettingsRepository) {}

  async initialize(): Promise<void> {
    const settings = await this.repo.findAll();
    this.settings = { ...defaultSettings };
    this.environmentOverrides = this.readEnvironmentOverrides();

    for (const setting of settings) {
      if (!this.environmentOverrides.has(setting.key)) {
        this.applySetting(setting.key, setting.value);
      }
    }

    for (const [key, value] of this.environmentOverrides) {
      this.applySetting(key, value);
    }
  }

  getSettings(): ServerSettings {
    return { ...this.settings };
  }

  getEmailVerificationPolicy(): EmailVerificationPolicy {
    return this.settings.emailVerificationPolicy;
  }

  isEnabled(key: ServerSettingKey): boolean {
    switch (key) {
      case ServerSettingKey.AllowApiKey:
        return this.settings.allowApiKey;
      case ServerSettingKey.AllowLocalAccountRegistration:
        return this.settings.allowLocalAccountRegistration;
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
      case ServerSettingKey.EmailVerificationPolicy:
        return this.settings.emailVerificationPolicy === "required";
    }
  }

  async getAll(): Promise<ServerSetting[]> {
    const dbSettings = await this.repo.findAll();
    const byKey = new Map<string, ServerSetting>();

    for (const { key, value, updated_at } of dbSettings) {
      byKey.set(key, {
        key,
        value: SENSITIVE_SETTING_KEY_PATTERN.test(key) ? "[REDACTED]" : value,
        updatedAt: updated_at,
        source: "database",
        readOnly: false,
      });
    }

    for (const [key, value] of this.environmentOverrides) {
      byKey.set(key, {
        key,
        value: SENSITIVE_SETTING_KEY_PATTERN.test(key) ? "[REDACTED]" : value,
        updatedAt: null,
        source: "environment",
        readOnly: true,
      });
    }

    return [...byKey.values()].sort((a, b) => a.key.localeCompare(b.key));
  }

  async get(key: string): Promise<ServerSetting | null> {
    const environmentValue = this.environmentOverrides.get(key);
    if (environmentValue !== undefined) {
      return {
        key,
        value: SENSITIVE_SETTING_KEY_PATTERN.test(key)
          ? "[REDACTED]"
          : environmentValue,
        updatedAt: null,
        source: "environment",
        readOnly: true,
      };
    }

    const setting = await this.repo.findByKey(key);
    if (!setting) return null;

    return {
      key: setting.key,
      value: SENSITIVE_SETTING_KEY_PATTERN.test(setting.key)
        ? "[REDACTED]"
        : setting.value,
      updatedAt: setting.updated_at,
      source: "database",
      readOnly: false,
    };
  }

  async set(key: string, value: string): Promise<ServerSetting> {
    if (!key.trim()) throw new Error("設定キーを指定してください");

    const normalizedKey = key.trim();
    if (this.environmentOverrides.has(normalizedKey)) {
      throw new Error("環境変数から設定されているため管理画面から変更できません");
    }

    this.validateSettingValue(normalizedKey, value);

    const setting = await this.repo.upsert(normalizedKey, value);
    this.applySetting(normalizedKey, value);

    return {
      key: setting.key,
      value: SENSITIVE_SETTING_KEY_PATTERN.test(setting.key)
        ? "[REDACTED]"
        : setting.value,
      updatedAt: setting.updated_at,
      source: "database",
      readOnly: false,
    };
  }

  async delete(key: string): Promise<void> {
    if (this.environmentOverrides.has(key)) {
      throw new Error("環境変数から設定されているため管理画面から削除できません");
    }
    await this.repo.delete(key);
    this.resetSetting(key);
  }

  isEnvironmentManaged(key: string): boolean {
    return this.environmentOverrides.has(key);
  }

  private readEnvironmentOverrides(): Map<string, string> {
    const overrides = new Map<string, string>();

    for (const [key, envName] of Object.entries(ENV_SETTING_NAMES)) {
      const value = process.env[envName];
      if (value === undefined) continue;
      this.validateSettingValue(key, value);
      overrides.set(key, value);
    }

    return overrides;
  }

  private validateSettingValue(key: string, value: string): void {
    if (
      key === ServerSettingKey.EmailVerificationPolicy &&
      value !== "disabled" &&
      value !== "required"
    ) {
      throw new Error(
        "Email Verification Policyにはdisabledまたはrequiredを指定してください",
      );
    }

    if (isServerSettingKey(key) && key !== ServerSettingKey.EmailVerificationPolicy) {
      if (value !== "true" && value !== "false") {
        throw new Error(`${ENV_SETTING_NAMES[key]} must be true or false`);
      }
    }
  }

  private applySetting(key: string, value: string): void {
    const enabled = value === "true";

    switch (key) {
      case ServerSettingKey.AllowApiKey:
        this.settings.allowApiKey = enabled;
        break;
      case ServerSettingKey.AllowLocalAccountRegistration:
        this.settings.allowLocalAccountRegistration = enabled;
        break;
      case ServerSettingKey.EmailVerificationPolicy:
        this.settings.emailVerificationPolicy =
          value === "required" ? "required" : "disabled";
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
      case ServerSettingKey.AllowLocalAccountRegistration:
        this.settings.allowLocalAccountRegistration =
          defaultSettings.allowLocalAccountRegistration;
        break;
      case ServerSettingKey.EmailVerificationPolicy:
        this.settings.emailVerificationPolicy = defaultSettings.emailVerificationPolicy;
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
