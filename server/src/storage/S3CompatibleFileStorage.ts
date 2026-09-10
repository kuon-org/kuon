import { Readable } from "node:stream";
import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import type {
  FileStorage,
  PutFileInput,
  StoredFile,
  StoredFileInfo,
} from "./FileStorage.js";

export type S3CompatibleStorageOptions = {
  endpoint?: string;
  region: string;
  bucket: string;
  accessKeyId: string;
  secretAccessKey: string;
  forcePathStyle?: boolean;
};

export class S3CompatibleFileStorage implements FileStorage {
  private readonly client: S3Client;

  constructor(private readonly options: S3CompatibleStorageOptions) {
    this.client = new S3Client({
      region: options.region,
      endpoint: options.endpoint || undefined,
      forcePathStyle: options.forcePathStyle,
      credentials: {
        accessKeyId: options.accessKeyId,
        secretAccessKey: options.secretAccessKey,
      },
    });
  }

  async put(input: PutFileInput): Promise<StoredFile> {
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.options.bucket,
        Key: input.key,
        Body: input.body,
        ContentType: input.contentType,
      }),
    );
    return { key: input.key };
  }

  async get(key: string) {
    const response = await this.client.send(
      new GetObjectCommand({ Bucket: this.options.bucket, Key: key }),
    );
    if (!response.Body) throw new Error(`S3 object has no body: ${key}`);

    const body =
      response.Body instanceof Readable
        ? response.Body
        : Readable.fromWeb(response.Body.transformToWebStream() as never);

    return {
      body,
      contentType: response.ContentType,
      contentLength: response.ContentLength,
    };
  }

  async delete(key: string): Promise<void> {
    await this.client.send(
      new DeleteObjectCommand({ Bucket: this.options.bucket, Key: key }),
    );
  }

  async exists(key: string): Promise<boolean> {
    try {
      await this.client.send(
        new HeadObjectCommand({ Bucket: this.options.bucket, Key: key }),
      );
      return true;
    } catch (error) {
      const statusCode = (error as { $metadata?: { httpStatusCode?: number } })
        .$metadata?.httpStatusCode;
      if (statusCode === 404) return false;
      throw error;
    }
  }

  async *list(prefix = ""): AsyncIterable<StoredFileInfo> {
    let continuationToken: string | undefined;
    do {
      const response = await this.client.send(
        new ListObjectsV2Command({
          Bucket: this.options.bucket,
          Prefix: prefix || undefined,
          ContinuationToken: continuationToken,
        }),
      );

      for (const object of response.Contents ?? []) {
        if (object.Key) yield { key: object.Key };
      }

      continuationToken = response.IsTruncated
        ? response.NextContinuationToken
        : undefined;
    } while (continuationToken);
  }

  async createTemporaryUrl(
    key: string,
    options?: { expiresInSeconds?: number },
  ): Promise<string> {
    const expiresIn = Math.min(
      Math.max(options?.expiresInSeconds ?? 300, 1),
      604800,
    );
    return getSignedUrl(
      this.client,
      new GetObjectCommand({ Bucket: this.options.bucket, Key: key }),
      { expiresIn },
    );
  }
}
