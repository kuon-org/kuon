import crypto from "node:crypto";
import JWT_SECRET from "../utils/sessionTokens/jwtSecret.js";
import { serverSettingsService } from "./serverSettingsService.js";

const SMTP_SETTING_KEYS = {
  host: "smtp_host",
  port: "smtp_port",
  secure: "smtp_secure",
  username: "smtp_username",
  password: "smtp_password",
  fromAddress: "smtp_from_address",
  fromName: "smtp_from_name",
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
    const values = Object.fromEntries(entries) as Record<keyof typeof SMTP_SETTING_KEYS, string>;

    return {
      host: values.host,
      port: normalizePort(values.port),
      secure: values.secure === "true",
      username: values.username,
      password: values.password ? decryptSecret(values.password) : "",
      fromAddress: values.fromAddress,
      fromName: values.fromName || "Kuon",
    };
  }

  async getPublic(): Promise<PublicSmtpSettings> {
    const settings = await this.get();
    const { password, ...publicSettings } = settings;
    return {
      ...publicSettings,
      passwordConfigured: Boolean(password),
      configured: this.isComplete(settings),
    };
  }

  async update(input: UpdateSmtpSettingsInput): Promise<PublicSmtpSettings> {
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
