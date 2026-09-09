import crypto from "node:crypto";
import type { Prisma } from "@prisma/client";
import JWT_SECRET from "./sessionTokens/jwtSecret.js";

const ENCRYPTION_PREFIX = "enc:v1";
const PRIVATE_KEY_FIELD = "private_key";

const getEncryptionKey = () =>
  crypto
    .createHash("sha256")
    .update(process.env.IDP_SECRET_ENCRYPTION_KEY || JWT_SECRET)
    .digest();

export const isEncryptedIdpSecret = (value: unknown): value is string =>
  typeof value === "string" && value.startsWith(`${ENCRYPTION_PREFIX}:`);

export const encryptIdpSecret = (plainText: string): string => {
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

export const decryptIdpSecret = (value: string): string => {
  if (!value) return "";
  if (!isEncryptedIdpSecret(value)) return value;

  const [prefix, version, ivText, tagText, encryptedText] = value.split(":");
  if (`${prefix}:${version}` !== ENCRYPTION_PREFIX || !ivText || !tagText || !encryptedText) {
    throw new Error("IdP secret storage format is invalid");
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

export const prepareIdpConfigForStorage = (
  config: Record<string, unknown>,
): Prisma.InputJsonValue => {
  const privateKey = config[PRIVATE_KEY_FIELD];
  if (typeof privateKey !== "string" || !privateKey || isEncryptedIdpSecret(privateKey)) {
    return config as Prisma.InputJsonValue;
  }

  return {
    ...config,
    [PRIVATE_KEY_FIELD]: encryptIdpSecret(privateKey),
  } as Prisma.InputJsonValue;
};

export const resolveIdpConfigSecrets = (
  config: Record<string, unknown>,
): Record<string, unknown> => {
  const privateKey = config[PRIVATE_KEY_FIELD];
  if (typeof privateKey !== "string" || !privateKey) return config;

  return {
    ...config,
    [PRIVATE_KEY_FIELD]: decryptIdpSecret(privateKey),
  };
};
