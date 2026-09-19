import apiClient from "./client";

export type StorageProvider = "local" | "s3" | "azure";
export type StorageDeliveryMode = "relay" | "redirect";

export type StorageSettings = {
  provider: StorageProvider;
  deliveryMode: StorageDeliveryMode;
  signedUrlExpiresInSeconds: number;
  localPath: string;
  s3: {
    endpoint: string;
    region: string;
    bucket: string;
    accessKeyId: string;
    forcePathStyle: boolean;
    secretAccessKeyConfigured: boolean;
  };
  azure: {
    accountName: string;
    container: string;
    endpoint: string;
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
  s3: Omit<StorageSettings["s3"], "secretAccessKeyConfigured"> & {
    secretAccessKey?: string;
  };
  azure: Omit<StorageSettings["azure"], "accountKeyConfigured"> & {
    accountKey?: string;
  };
};

export const fetchStorageSettings = async () =>
  (await apiClient.get<StorageSettings>("/admin/settings/storage")).data;

export const updateStorageSettings = async (
  input: UpdateStorageSettingsInput,
) =>
  (await apiClient.put<StorageSettings>("/admin/settings/storage", input)).data;
