import path from "node:path";

export type StorageProvider = "local" | "s3" | "azure";
export type StorageDeliveryMode = "relay" | "redirect";

export type StorageConfig = {
  provider: StorageProvider;
  deliveryMode: StorageDeliveryMode;
  signedUrlExpiresInSeconds: number;
  localPath: string;
  s3: {
    endpoint: string;
    region: string;
    bucket: string;
    accessKeyId: string;
    secretAccessKey: string;
    forcePathStyle: boolean;
  };
  azure: {
    accountName: string;
    accountKey: string;
    container: string;
    endpoint: string;
  };
};

const parseProvider = (value: string): StorageProvider => {
  const provider = value.toLowerCase();
  if (provider !== "local" && provider !== "s3" && provider !== "azure") {
    throw new Error(`Unsupported storage provider: ${provider}`);
  }
  return provider;
};

const parseDeliveryMode = (value: string): StorageDeliveryMode => {
  const mode = value.toLowerCase();
  if (mode !== "relay" && mode !== "redirect") {
    throw new Error(`Unsupported storage delivery mode: ${mode}`);
  }
  return mode;
};

export const validateStorageConfig = (config: StorageConfig): void => {
  if (
    !Number.isFinite(config.signedUrlExpiresInSeconds) ||
    config.signedUrlExpiresInSeconds <= 0 ||
    config.signedUrlExpiresInSeconds > 604800
  ) {
    throw new Error(
      "KUON_STORAGE_SIGNED_URL_EXPIRES_IN must be between 1 and 604800",
    );
  }

  if (config.provider === "local") {
    if (!config.localPath.trim()) throw new Error("Local storage path is required");
    if (config.deliveryMode === "redirect") {
      throw new Error("Local storage does not support redirect delivery mode");
    }
  }

  if (config.provider === "s3") {
    if (!config.s3.region.trim()) throw new Error("S3 region is required");
    if (!config.s3.bucket.trim()) throw new Error("S3 bucket is required");
    if (!config.s3.accessKeyId.trim()) throw new Error("S3 access key ID is required");
    if (!config.s3.secretAccessKey) throw new Error("S3 secret access key is required");
  }

  if (config.provider === "azure") {
    if (!config.azure.accountName.trim()) throw new Error("Azure account name is required");
    if (!config.azure.accountKey) throw new Error("Azure account key is required");
    if (!config.azure.container.trim()) throw new Error("Azure container is required");
  }
};

const initialStorageConfig: StorageConfig = {
  provider: parseProvider(process.env.KUON_STORAGE_PROVIDER ?? "local"),
  deliveryMode: parseDeliveryMode(
    process.env.KUON_STORAGE_DELIVERY_MODE ?? "relay",
  ),
  signedUrlExpiresInSeconds: Number(
    process.env.KUON_STORAGE_SIGNED_URL_EXPIRES_IN ?? 300,
  ),
  localPath:
    process.env.KUON_STORAGE_LOCAL_PATH ??
    path.resolve(process.cwd(), "public/uploads"),
  s3: {
    endpoint: process.env.KUON_STORAGE_S3_ENDPOINT ?? "",
    region: process.env.KUON_STORAGE_S3_REGION ?? "auto",
    bucket: process.env.KUON_STORAGE_S3_BUCKET ?? "",
    accessKeyId: process.env.KUON_STORAGE_S3_ACCESS_KEY_ID ?? "",
    secretAccessKey: process.env.KUON_STORAGE_S3_SECRET_ACCESS_KEY ?? "",
    forcePathStyle:
      (process.env.KUON_STORAGE_S3_FORCE_PATH_STYLE ?? "false").toLowerCase() ===
      "true",
  },
  azure: {
    accountName: process.env.KUON_STORAGE_AZURE_ACCOUNT_NAME ?? "",
    accountKey: process.env.KUON_STORAGE_AZURE_ACCOUNT_KEY ?? "",
    container: process.env.KUON_STORAGE_AZURE_CONTAINER ?? "",
    endpoint: process.env.KUON_STORAGE_AZURE_ENDPOINT ?? "",
  },
};

validateStorageConfig(initialStorageConfig);

export const storageConfig: StorageConfig = initialStorageConfig;

export const applyStorageConfig = (config: StorageConfig): void => {
  validateStorageConfig(config);
  storageConfig.provider = config.provider;
  storageConfig.deliveryMode = config.deliveryMode;
  storageConfig.signedUrlExpiresInSeconds = config.signedUrlExpiresInSeconds;
  storageConfig.localPath = config.localPath;
  storageConfig.s3 = { ...config.s3 };
  storageConfig.azure = { ...config.azure };
};
