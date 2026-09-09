import type { FileStorage } from "./FileStorage.js";
import { LocalFileStorage } from "./LocalFileStorage.js";
import { storageConfig } from "./storageConfig.js";

let storage: FileStorage | undefined;

export const getFileStorage = (): FileStorage => {
  if (storage) return storage;

  if (storageConfig.provider === "local") {
    storage = new LocalFileStorage(storageConfig.localPath);
    return storage;
  }

  throw new Error(`Unsupported storage provider: ${storageConfig.provider}`);
};
