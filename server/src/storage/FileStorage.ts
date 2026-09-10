import type { Readable } from "node:stream";

export type FileBody = Buffer | Readable;

export type PutFileInput = {
  key: string;
  body: FileBody;
  contentType?: string;
};

export type StoredFile = {
  key: string;
};

export type StoredFileInfo = {
  key: string;
};

export type StoredFileContent = {
  body: Readable;
  contentType?: string;
  contentLength?: number;
};

export interface FileStorage {
  put(input: PutFileInput): Promise<StoredFile>;
  get(key: string): Promise<StoredFileContent>;
  delete(key: string): Promise<void>;
  exists(key: string): Promise<boolean>;
  list(prefix?: string): AsyncIterable<StoredFileInfo>;

  createTemporaryUrl?(
    key: string,
    options?: { expiresInSeconds?: number },
  ): Promise<string>;
}
