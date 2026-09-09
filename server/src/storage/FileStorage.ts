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

export interface FileStorage {
  put(input: PutFileInput): Promise<StoredFile>;
  get(key: string): Promise<Readable>;
  delete(key: string): Promise<void>;
  exists(key: string): Promise<boolean>;

  createTemporaryUrl?(
    key: string,
    options?: { expiresInSeconds?: number },
  ): Promise<string>;
}
