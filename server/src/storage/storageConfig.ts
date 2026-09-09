import path from "node:path";

export type StorageProvider = "local";
export type StorageDeliveryMode = "relay" | "redirect";

const provider = (process.env.KUON_STORAGE_PROVIDER ?? "local").toLowerCase();
const deliveryMode = (
  process.env.KUON_STORAGE_DELIVERY_MODE ?? "relay"
).toLowerCase();
const signedUrlExpiresInSeconds = Number(
  process.env.KUON_STORAGE_SIGNED_URL_EXPIRES_IN ?? 300,
);

if (provider !== "local") {
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

export const storageConfig = {
  provider: provider as StorageProvider,
  deliveryMode: deliveryMode as StorageDeliveryMode,
  signedUrlExpiresInSeconds,
  localPath:
    process.env.KUON_STORAGE_LOCAL_PATH ??
    path.resolve(process.cwd(), "public/uploads"),
};
