import crypto from "node:crypto";
import JWT_SECRET from "../utils/sessionTokens/jwtSecret.js";
import { serverSettingsService } from "./serverSettingsService.js";
import {
  readBooleanEnvironmentValue,
  readIntegerEnvironmentValue,
  type ConfigurationSource,
} from "../config/environmentConfiguration.js";

const SMTP_SETTING_KEYS = {
  host: "smtp_host",
  port: "smtp_port",
  secure: "smtp_secure",
  username: "smtp_username",
  password: "smtp_password",
  fromAddress: "smtp_from_address",
  fromName: "smtp_from_name",
} as const;

const SMTP_ENV_NAMES = {
  host: "KUON_SMTP_HOST",
  port: "KUON_SMTP_PORT",
  secure: "KUON_SMTP_SECURE",
  username: "KUON_SMTP_USERNAME",
  password: "KUON_SMTP_PASSWORD",
  fromAddress: "KUON_SMTP_FROM_ADDRESS",
  fromName: "KUON_SMTP_FROM_NAME",
} as const;

const ENCRYPTION_PREFIX = "enc:v1";

export type SmtpSettings = {
  host: string;
  port: number;
  secure: boolean;
  username: string;
  password: string;
  fromAddress: string;
  fromName: string;
};

export type PublicSmtpSettings = Omit<SmtpSettings, "password"> & {
  passwordConfigured: boolean;
  configured: boolean;
  source: ConfigurationSource;
  readOnly: boolean;
};

export type UpdateSmtpSettingsInput = Omit<SmtpSettings, "password"> & {
  password?: string;
};

const getEncryptionKey = () =>
  crypto
    .createHash("sha256")
    .update(process.env.SMTP_SECRET_ENCRYPTION_KEY || JWT_SECRET)
    .digest();

const encryptSecret = (plainText: string): string => {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", getEncryptionKey(), iv);
  const encrypted = Buffer.concat([
    cipher.update(plainText, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();

  return [
    ENCRYPTION_PREFIX,
    iv.toString("base64url"),
    tag.toString("base64url"),
    encrypted.toString("base64url"),
  ].join(":");
};

const decryptSecret = (value: string): string => {
  if (!value) return "";
  const [prefix, version, ivText, tagText, encryptedText] = value.split(":");
  if (`${prefix}:${version}` !== ENCRYPTION_PREFIX || !ivText || !tagText || !encryptedText) {
    throw new Error("SMTP Passwordの保存形式が不正です");
  }

  const decipher = crypto.createDecipheriv(
    "aes-256-gcm",
    getEncryptionKey(),
    Buffer.from(ivText, "base64url"),
  );
  decipher.setAuthTag(Buffer.from(tagText, "base64url"));
  return Buffer.concat([
    decipher.update(Buffer.from(encryptedText, "base64url")),
    decipher.final(),
  ]).toString("utf8");
};

const normalizePort = (value: string | undefined): number => {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 && parsed <= 65535 ? parsed : 587;
};

export class SmtpSettingsService {
  async get(): Promise<SmtpSettings> {
    const entries = await Promise.all(
      Object.entries(SMTP_SETTING_KEYS).map(async ([name, key]) => [
        name,
        (await serverSettingsService.get(key))?.value ?? "",
      ] as const),
    );
    const dbValues = Object.fromEntries(entries) as Record<
      keyof typeof SMTP_SETTING_KEYS,
      string
    >;

    const environmentPort = readIntegerEnvironmentValue(
      SMTP_ENV_NAMES.port,
      process.env[SMTP_ENV_NAMES.port],
    );
    if (
      environmentPort !== undefined &&
      (environmentPort <= 0 || environmentPort > 65535)
    ) {
      throw new Error(`${SMTP_ENV_NAMES.port} must be between 1 and 65535`);
    }

    const environmentSecure = readBooleanEnvironmentValue(
      SMTP_ENV_NAMES.secure,
      process.env[SMTP_ENV_NAMES.secure],
    );

    return {
      host: process.env[SMTP_ENV_NAMES.host] ?? dbValues.host,
      port: environmentPort ?? normalizePort(dbValues.port),
      secure: environmentSecure ?? dbValues.secure === "true",
      username: process.env[SMTP_ENV_NAMES.username] ?? dbValues.username,
      password:
        process.env[SMTP_ENV_NAMES.password] ??
        (dbValues.password ? decryptSecret(dbValues.password) : ""),
      fromAddress:
        process.env[SMTP_ENV_NAMES.fromAddress] ?? dbValues.fromAddress,
      fromName:
        (process.env[SMTP_ENV_NAMES.fromName] ?? dbValues.fromName) || "Kuon",
    };
  }

  async getPublic(): Promise<PublicSmtpSettings> {
    const settings = await this.get();
    const { password, ...publicSettings } = settings;
    const environmentManaged = this.isEnvironmentManaged();
    return {
      ...publicSettings,
      passwordConfigured: Boolean(password),
      configured: this.isComplete(settings),
      source: environmentManaged ? "environment" : "database",
      readOnly: environmentManaged,
    };
  }

  async update(input: UpdateSmtpSettingsInput): Promise<PublicSmtpSettings> {
    if (this.isEnvironmentManaged()) {
      throw new Error("SMTPは環境変数から設定されているため管理画面から変更できません");
    }

    const host = input.host.trim();
    const username = input.username.trim();
    const fromAddress = input.fromAddress.trim();
    const fromName = input.fromName.trim() || "Kuon";

    if (!host) throw new Error("SMTP Hostを指定してください");
    if (!Number.isInteger(input.port) || input.port <= 0 || input.port > 65535) {
      throw new Error("SMTP Portは1〜65535で指定してください");
    }
    if (!fromAddress) throw new Error("From Addressを指定してください");

    await Promise.all([
      serverSettingsService.set(SMTP_SETTING_KEYS.host, host),
      serverSettingsService.set(SMTP_SETTING_KEYS.port, String(input.port)),
      serverSettingsService.set(SMTP_SETTING_KEYS.secure, String(input.secure)),
      serverSettingsService.set(SMTP_SETTING_KEYS.username, username),
      serverSettingsService.set(SMTP_SETTING_KEYS.fromAddress, fromAddress),
      serverSettingsService.set(SMTP_SETTING_KEYS.fromName, fromName),
    ]);

    if (input.password !== undefined && input.password !== "") {
      await serverSettingsService.set(
        SMTP_SETTING_KEYS.password,
        encryptSecret(input.password),
      );
    }

    return this.getPublic();
  }

  async isConfigured(): Promise<boolean> {
    return this.isComplete(await this.get());
  }

  isEnvironmentManaged(): boolean {
    return Object.values(SMTP_ENV_NAMES).some(
      (name) => process.env[name] !== undefined,
    );
  }

  private isComplete(settings: SmtpSettings): boolean {
    return Boolean(
      settings.host &&
        settings.port &&
        settings.fromAddress &&
        (!settings.username || settings.password),
    );
  }
}

export const smtpSettingsService = new SmtpSettingsService();
