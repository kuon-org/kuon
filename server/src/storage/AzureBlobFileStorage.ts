import { Readable } from "node:stream";
import {
  BlobSASPermissions,
  BlobServiceClient,
  StorageSharedKeyCredential,
  generateBlobSASQueryParameters,
} from "@azure/storage-blob";
import type {
  FileStorage,
  PutFileInput,
  StoredFile,
  StoredFileInfo,
} from "./FileStorage.js";

export type AzureBlobStorageOptions = {
  accountName: string;
  accountKey: string;
  container: string;
  endpoint?: string;
};

export class AzureBlobFileStorage implements FileStorage {
  private readonly credential: StorageSharedKeyCredential;
  private readonly serviceClient: BlobServiceClient;

  constructor(private readonly options: AzureBlobStorageOptions) {
    this.credential = new StorageSharedKeyCredential(
      options.accountName,
      options.accountKey,
    );
    const serviceUrl =
      options.endpoint || `https://${options.accountName}.blob.core.windows.net`;
    this.serviceClient = new BlobServiceClient(serviceUrl, this.credential);
  }

  private get containerClient() {
    return this.serviceClient.getContainerClient(this.options.container);
  }

  private getBlobClient(key: string) {
    return this.containerClient.getBlobClient(key);
  }

  async put(input: PutFileInput): Promise<StoredFile> {
    const blockBlobClient = this.containerClient.getBlockBlobClient(input.key);
    const headers = input.contentType
      ? { blobContentType: input.contentType }
      : undefined;

    if (Buffer.isBuffer(input.body)) {
      await blockBlobClient.uploadData(input.body, {
        blobHTTPHeaders: headers,
      });
    } else {
      await blockBlobClient.uploadStream(input.body, undefined, undefined, {
        blobHTTPHeaders: headers,
      });
    }

    return { key: input.key };
  }

  async get(key: string) {
    const response = await this.getBlobClient(key).download();
    if (!response.readableStreamBody) {
      throw new Error(`Azure Blob object has no body: ${key}`);
    }

    const body = Readable.from(response.readableStreamBody);
    return {
      body,
      contentType: response.contentType,
      contentLength: response.contentLength,
    };
  }

  async delete(key: string): Promise<void> {
    await this.getBlobClient(key).deleteIfExists();
  }

  async exists(key: string): Promise<boolean> {
    return this.getBlobClient(key).exists();
  }

  async *list(prefix = ""): AsyncIterable<StoredFileInfo> {
    for await (const blob of this.containerClient.listBlobsFlat({
      prefix: prefix || undefined,
    })) {
      yield { key: blob.name };
    }
  }

  async createTemporaryUrl(
    key: string,
    options?: { expiresInSeconds?: number },
  ): Promise<string> {
    const expiresInSeconds = Math.min(
      Math.max(options?.expiresInSeconds ?? 300, 1),
      604800,
    );
    const startsOn = new Date(Date.now() - 60_000);
    const expiresOn = new Date(Date.now() + expiresInSeconds * 1000);
    const sas = generateBlobSASQueryParameters(
      {
        containerName: this.options.container,
        blobName: key,
        permissions: BlobSASPermissions.parse("r"),
        startsOn,
        expiresOn,
      },
      this.credential,
    ).toString();

    return `${this.getBlobClient(key).url}?${sas}`;
  }
}
