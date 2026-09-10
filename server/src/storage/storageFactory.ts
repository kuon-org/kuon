import type { FileStorage } from "./FileStorage.js";
import { LocalFileStorage } from "./LocalFileStorage.js";
import { S3CompatibleFileStorage } from "./S3CompatibleFileStorage.js";
import { storageConfig } from "./storageConfig.js";

let storage: FileStorage | undefined;

export const getFileStorage = (): FileStorage => {
  if (storage) return storage;

  if (storageConfig.provider === "local") {
    storage = new LocalFileStorage(storageConfig.localPath);
    return storage;
  }

  if (storageConfig.provider === "s3") {
    storage = new S3CompatibleFileStorage(storageConfig.s3);
    return storage;
  }

  throw new Error(`Unsupported storage provider: ${storageConfig.provider}`);
};
