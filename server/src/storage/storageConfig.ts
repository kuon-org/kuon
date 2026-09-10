import path from "node:path";

export type StorageProvider = "local" | "s3";
export type StorageDeliveryMode = "relay" | "redirect";

const provider = (process.env.KUON_STORAGE_PROVIDER ?? "local").toLowerCase();
const deliveryMode = (
  process.env.KUON_STORAGE_DELIVERY_MODE ?? "relay"
).toLowerCase();
const signedUrlExpiresInSeconds = Number(
  process.env.KUON_STORAGE_SIGNED_URL_EXPIRES_IN ?? 300,
);

if (provider !== "local" && provider !== "s3") {
  throw new Error(`Unsupported storage provider: ${provider}`);
}

if (deliveryMode !== "relay" && deliveryMode !== "redirect") {
  throw new Error(`Unsupported storage delivery mode: ${deliveryMode}`);
}

if (
  !Number.isFinite(signedUrlExpiresInSeconds) ||
  signedUrlExpiresInSeconds <= 0
) {
  throw new Error("KUON_STORAGE_SIGNED_URL_EXPIRES_IN must be a positive number");
}

const s3 = {
  endpoint: process.env.KUON_STORAGE_S3_ENDPOINT ?? "",
  region: process.env.KUON_STORAGE_S3_REGION ?? "auto",
  bucket: process.env.KUON_STORAGE_S3_BUCKET ?? "",
  accessKeyId: process.env.KUON_STORAGE_S3_ACCESS_KEY_ID ?? "",
  secretAccessKey: process.env.KUON_STORAGE_S3_SECRET_ACCESS_KEY ?? "",
  forcePathStyle:
    (process.env.KUON_STORAGE_S3_FORCE_PATH_STYLE ?? "false").toLowerCase() ===
    "true",
};

if (provider === "s3") {
  const missing = Object.entries({
    KUON_STORAGE_S3_BUCKET: s3.bucket,
    KUON_STORAGE_S3_ACCESS_KEY_ID: s3.accessKeyId,
    KUON_STORAGE_S3_SECRET_ACCESS_KEY: s3.secretAccessKey,
  })
    .filter(([, value]) => !value)
    .map(([key]) => key);

  if (missing.length > 0) {
    throw new Error(`Missing S3 storage configuration: ${missing.join(", ")}`);
  }
}

if (provider === "local" && deliveryMode === "redirect") {
  throw new Error("Local storage does not support redirect delivery mode");
}

export const storageConfig = {
  provider: provider as StorageProvider,
  deliveryMode: deliveryMode as StorageDeliveryMode,
  signedUrlExpiresInSeconds,
  localPath:
    process.env.KUON_STORAGE_LOCAL_PATH ??
    path.resolve(process.cwd(), "public/uploads"),
  s3,
};
