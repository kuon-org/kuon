import fs from "node:fs";
import path from "node:path";
import { pipeline } from "node:stream/promises";
import type {
  FileStorage,
  PutFileInput,
  StoredFile,
} from "./FileStorage.js";

const normalizeKey = (key: string) => {
  const normalized = path.posix.normalize(key.replaceAll("\\", "/"));
  if (
    normalized === "." ||
    normalized.startsWith("../") ||
    normalized.includes("/../") ||
    path.posix.isAbsolute(normalized)
  ) {
    throw new Error("Invalid storage key");
  }
  return normalized;
};

export class LocalFileStorage implements FileStorage {
  constructor(private readonly basePath: string) {}

  private resolvePath(key: string) {
    return path.join(this.basePath, normalizeKey(key));
  }

  async put(input: PutFileInput): Promise<StoredFile> {
    const normalizedKey = normalizeKey(input.key);
    const filePath = this.resolvePath(normalizedKey);
    await fs.promises.mkdir(path.dirname(filePath), { recursive: true });

    if (Buffer.isBuffer(input.body)) {
      await fs.promises.writeFile(filePath, input.body);
    } else {
      await pipeline(input.body, fs.createWriteStream(filePath));
    }

    return { key: normalizedKey };
  }

  async get(key: string) {
    return fs.createReadStream(this.resolvePath(key));
  }

  async delete(key: string): Promise<void> {
    try {
      await fs.promises.unlink(this.resolvePath(key));
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      await fs.promises.access(this.resolvePath(key), fs.constants.F_OK);
      return true;
    } catch {
      return false;
    }
  }
}
