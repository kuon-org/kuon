import crypto from "node:crypto";
import path from "node:path";
import JWT_SECRET from "../utils/sessionTokens/jwtSecret.js";
import { serverSettingsService } from "./serverSettingsService.js";
import {
  applyStorageConfig,
  type StorageConfig,
  type StorageDeliveryMode,
  type StorageProvider,
  validateStorageConfig,
} from "../storage/storageConfig.js";
import { resetFileStorage } from "../storage/storageFactory.js";

const STORAGE_SETTING_KEYS = {
  provider: "storage_provider",
  deliveryMode: "storage_delivery_mode",
  signedUrlExpiresInSeconds: "storage_signed_url_expires_in",
  localPath: "storage_local_path",
  s3Endpoint: "storage_s3_endpoint",
  s3Region: "storage_s3_region",
  s3Bucket: "storage_s3_bucket",
  s3AccessKeyId: "storage_s3_access_key_id",
  s3SecretAccessKey: "storage_s3_secret_access_key_secret",
  s3ForcePathStyle: "storage_s3_force_path_style",
  azureAccountName: "storage_azure_account_name",
  azureAccountKey: "storage_azure_account_key_secret",
  azureContainer: "storage_azure_container",
  azureEndpoint: "storage_azure_endpoint",
} as const;

const STORAGE_ENV_NAMES = [
  "KUON_STORAGE_PROVIDER",
  "KUON_STORAGE_DELIVERY_MODE",
  "KUON_STORAGE_SIGNED_URL_EXPIRES_IN",
  "KUON_STORAGE_LOCAL_PATH",
  "KUON_STORAGE_S3_ENDPOINT",
  "KUON_STORAGE_S3_REGION",
  "KUON_STORAGE_S3_BUCKET",
  "KUON_STORAGE_S3_ACCESS_KEY_ID",
  "KUON_STORAGE_S3_SECRET_ACCESS_KEY",
  "KUON_STORAGE_S3_FORCE_PATH_STYLE",
  "KUON_STORAGE_AZURE_ACCOUNT_NAME",
  "KUON_STORAGE_AZURE_ACCOUNT_KEY",
  "KUON_STORAGE_AZURE_CONTAINER",
  "KUON_STORAGE_AZURE_ENDPOINT",
] as const;

const ENCRYPTION_PREFIX = "enc:v1";

export type PublicStorageSettings = Omit<
  StorageConfig,
  "s3" | "azure"
> & {
  s3: Omit<StorageConfig["s3"], "secretAccessKey"> & {
    secretAccessKeyConfigured: boolean;
  };
  azure: Omit<StorageConfig["azure"], "accountKey"> & {
    accountKeyConfigured: boolean;
  };
  source: "environment" | "database";
  readOnly: boolean;
};

export type UpdateStorageSettingsInput = {
  provider: StorageProvider;
  deliveryMode: StorageDeliveryMode;
  signedUrlExpiresInSeconds: number;
  localPath: string;
  s3: Omit<StorageConfig["s3"], "secretAccessKey"> & {
    secretAccessKey?: string;
  };
  azure: Omit<StorageConfig["azure"], "accountKey"> & {
    accountKey?: string;
  };
};

const getEncryptionKey = () =>
  crypto
    .createHash("sha256")
    .update(process.env.STORAGE_SECRET_ENCRYPTION_KEY || JWT_SECRET)
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
    throw new Error("Storage secretの保存形式が不正です");
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

const readBoolean = (value: string | undefined, fallback: boolean) => {
  if (value === undefined || value === "") return fallback;
  if (value.toLowerCase() === "true") return true;
  if (value.toLowerCase() === "false") return false;
  throw new Error(`Invalid boolean storage setting: ${value}`);
};

const readNumber = (value: string | undefined, fallback: number) => {
  if (value === undefined || value === "") return fallback;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) throw new Error(`Invalid numeric storage setting: ${value}`);
  return parsed;
};

const readProvider = (value: string | undefined): StorageProvider => {
  const normalized = (value || "local").toLowerCase();
  if (normalized !== "local" && normalized !== "s3" && normalized !== "azure") {
    throw new Error(`Unsupported storage provider: ${normalized}`);
  }
  return normalized;
};

const readDeliveryMode = (value: string | undefined): StorageDeliveryMode => {
  const normalized = (value || "relay").toLowerCase();
  if (normalized !== "relay" && normalized !== "redirect") {
    throw new Error(`Unsupported storage delivery mode: ${normalized}`);
  }
  return normalized;
};

export class StorageSettingsService {
  isEnvironmentManaged(): boolean {
    return STORAGE_ENV_NAMES.some((name) => process.env[name] !== undefined);
  }

  private async getDbValue(key: string): Promise<string | undefined> {
    return (await serverSettingsService.get(key))?.value;
  }

  private async getDatabaseConfig(): Promise<StorageConfig> {
    const entries = await Promise.all(
      Object.entries(STORAGE_SETTING_KEYS).map(async ([name, key]) => [
        name,
        await this.getDbValue(key),
      ] as const),
    );
    const db = Object.fromEntries(entries) as Record<keyof typeof STORAGE_SETTING_KEYS, string | undefined>;

    return {
      provider: readProvider(db.provider),
      deliveryMode: readDeliveryMode(db.deliveryMode),
      signedUrlExpiresInSeconds: readNumber(db.signedUrlExpiresInSeconds, 300),
      localPath: db.localPath || path.resolve(process.cwd(), "public/uploads"),
      s3: {
        endpoint: db.s3Endpoint || "",
        region: db.s3Region || "auto",
        bucket: db.s3Bucket || "",
        accessKeyId: db.s3AccessKeyId || "",
        secretAccessKey: db.s3SecretAccessKey ? decryptSecret(db.s3SecretAccessKey) : "",
        forcePathStyle: readBoolean(db.s3ForcePathStyle, false),
      },
      azure: {
        accountName: db.azureAccountName || "",
        accountKey: db.azureAccountKey ? decryptSecret(db.azureAccountKey) : "",
        container: db.azureContainer || "",
        endpoint: db.azureEndpoint || "",
      },
    };
  }

  async get(): Promise<StorageConfig> {
    const db = await this.getDatabaseConfig();
    const config: StorageConfig = {
      provider: readProvider(process.env.KUON_STORAGE_PROVIDER ?? db.provider),
      deliveryMode: readDeliveryMode(
        process.env.KUON_STORAGE_DELIVERY_MODE ?? db.deliveryMode,
      ),
      signedUrlExpiresInSeconds: readNumber(
        process.env.KUON_STORAGE_SIGNED_URL_EXPIRES_IN,
        db.signedUrlExpiresInSeconds,
      ),
      localPath: process.env.KUON_STORAGE_LOCAL_PATH ?? db.localPath,
      s3: {
        endpoint: process.env.KUON_STORAGE_S3_ENDPOINT ?? db.s3.endpoint,
        region: process.env.KUON_STORAGE_S3_REGION ?? db.s3.region,
        bucket: process.env.KUON_STORAGE_S3_BUCKET ?? db.s3.bucket,
        accessKeyId: process.env.KUON_STORAGE_S3_ACCESS_KEY_ID ?? db.s3.accessKeyId,
        secretAccessKey:
          process.env.KUON_STORAGE_S3_SECRET_ACCESS_KEY ?? db.s3.secretAccessKey,
        forcePathStyle: readBoolean(
          process.env.KUON_STORAGE_S3_FORCE_PATH_STYLE,
          db.s3.forcePathStyle,
        ),
      },
      azure: {
        accountName:
          process.env.KUON_STORAGE_AZURE_ACCOUNT_NAME ?? db.azure.accountName,
        accountKey:
          process.env.KUON_STORAGE_AZURE_ACCOUNT_KEY ?? db.azure.accountKey,
        container: process.env.KUON_STORAGE_AZURE_CONTAINER ?? db.azure.container,
        endpoint: process.env.KUON_STORAGE_AZURE_ENDPOINT ?? db.azure.endpoint,
      },
    };
    validateStorageConfig(config);
    return config;
  }

  async getPublic(): Promise<PublicStorageSettings> {
    const config = await this.get();
    const { secretAccessKey, ...s3 } = config.s3;
    const { accountKey, ...azure } = config.azure;
    const environmentManaged = this.isEnvironmentManaged();
    return {
      provider: config.provider,
      deliveryMode: config.deliveryMode,
      signedUrlExpiresInSeconds: config.signedUrlExpiresInSeconds,
      localPath: config.localPath,
      s3: { ...s3, secretAccessKeyConfigured: Boolean(secretAccessKey) },
      azure: { ...azure, accountKeyConfigured: Boolean(accountKey) },
      source: environmentManaged ? "environment" : "database",
      readOnly: environmentManaged,
    };
  }

  async initialize(): Promise<void> {
    const config = await this.get();
    applyStorageConfig(config);
    resetFileStorage();
  }

  async update(input: UpdateStorageSettingsInput): Promise<PublicStorageSettings> {
    if (this.isEnvironmentManaged()) {
      throw new Error("Storageは環境変数から設定されているため管理画面から変更できません");
    }

    const current = await this.getDatabaseConfig();
    const config: StorageConfig = {
      provider: input.provider,
      deliveryMode: input.deliveryMode,
      signedUrlExpiresInSeconds: input.signedUrlExpiresInSeconds,
      localPath: input.localPath.trim() || path.resolve(process.cwd(), "public/uploads"),
      s3: {
        endpoint: input.s3.endpoint.trim(),
        region: input.s3.region.trim() || "auto",
        bucket: input.s3.bucket.trim(),
        accessKeyId: input.s3.accessKeyId.trim(),
        secretAccessKey: input.s3.secretAccessKey || current.s3.secretAccessKey,
        forcePathStyle: input.s3.forcePathStyle,
      },
      azure: {
        accountName: input.azure.accountName.trim(),
        accountKey: input.azure.accountKey || current.azure.accountKey,
        container: input.azure.container.trim(),
        endpoint: input.azure.endpoint.trim(),
      },
    };
    validateStorageConfig(config);

    await Promise.all([
      serverSettingsService.set(STORAGE_SETTING_KEYS.provider, config.provider),
      serverSettingsService.set(STORAGE_SETTING_KEYS.deliveryMode, config.deliveryMode),
      serverSettingsService.set(
        STORAGE_SETTING_KEYS.signedUrlExpiresInSeconds,
        String(config.signedUrlExpiresInSeconds),
      ),
      serverSettingsService.set(STORAGE_SETTING_KEYS.localPath, config.localPath),
      serverSettingsService.set(STORAGE_SETTING_KEYS.s3Endpoint, config.s3.endpoint),
      serverSettingsService.set(STORAGE_SETTING_KEYS.s3Region, config.s3.region),
      serverSettingsService.set(STORAGE_SETTING_KEYS.s3Bucket, config.s3.bucket),
      serverSettingsService.set(STORAGE_SETTING_KEYS.s3AccessKeyId, config.s3.accessKeyId),
      serverSettingsService.set(
        STORAGE_SETTING_KEYS.s3ForcePathStyle,
        String(config.s3.forcePathStyle),
      ),
      serverSettingsService.set(
        STORAGE_SETTING_KEYS.azureAccountName,
        config.azure.accountName,
      ),
      serverSettingsService.set(
        STORAGE_SETTING_KEYS.azureContainer,
        config.azure.container,
      ),
      serverSettingsService.set(
        STORAGE_SETTING_KEYS.azureEndpoint,
        config.azure.endpoint,
      ),
    ]);

    if (input.s3.secretAccessKey) {
      await serverSettingsService.set(
        STORAGE_SETTING_KEYS.s3SecretAccessKey,
        encryptSecret(input.s3.secretAccessKey),
      );
    }
    if (input.azure.accountKey) {
      await serverSettingsService.set(
        STORAGE_SETTING_KEYS.azureAccountKey,
        encryptSecret(input.azure.accountKey),
      );
    }

    applyStorageConfig(config);
    resetFileStorage();
    return this.getPublic();
  }
}

export const storageSettingsService = new StorageSettingsService();
