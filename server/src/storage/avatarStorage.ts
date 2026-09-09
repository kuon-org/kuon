import path from "node:path";
import { getFileStorage } from "./storageFactory.js";

const AVATAR_PREFIX = "avatars";

const sanitizeProviderName = (provider: string) =>
  provider.replace(/[^a-zA-Z0-9._-]/g, "_");

export const buildLocalAvatarKey = (userId: string, originalName: string) => {
  const ext = path.extname(originalName);
  return `${AVATAR_PREFIX}/${userId}_local${ext}`;
};

export const buildExternalAvatarKey = (
  userId: string,
  provider: string,
  sourceUrl: string,
) => {
  const ext = path.extname(new URL(sourceUrl).pathname) || ".png";
  return `${AVATAR_PREFIX}/${userId}_${sanitizeProviderName(provider)}${ext}`;
};

export const toLegacyUploadPath = (key: string) => `/uploads/${key}`;

export const saveAvatar = async (
  key: string,
  body: Buffer,
  contentType?: string,
) => {
  const storage = getFileStorage();
  return storage.put({ key, body, contentType });
};

export const deleteAvatar = async (key: string) => {
  await getFileStorage().delete(key);
};

export const deleteProviderAvatars = async (
  userId: string,
  provider: string,
) => {
  const storage = getFileStorage();
  const filenamePrefix = `${userId}_${sanitizeProviderName(provider)}`;

  for await (const file of storage.list(AVATAR_PREFIX)) {
    const filename = path.posix.basename(file.key);
    if (filename.startsWith(filenamePrefix)) {
      await storage.delete(file.key);
    }
  }
};
