import { createHash, createHmac } from "node:crypto";
import { Readable } from "node:stream";
import type {
  FileBody,
  FileStorage,
  PutFileInput,
  StoredFile,
  StoredFileInfo,
} from "./FileStorage.js";

export type S3CompatibleStorageOptions = {
  endpoint: string;
  region: string;
  bucket: string;
  accessKeyId: string;
  secretAccessKey: string;
  forcePathStyle?: boolean;
};

const EMPTY_SHA256 = createHash("sha256").update("").digest("hex");

const sha256 = (value: string | Buffer) =>
  createHash("sha256").update(value).digest("hex");

const hmac = (key: Buffer | string, value: string) =>
  createHmac("sha256", key).update(value).digest();

const encodeKey = (key: string) =>
  key
    .replace(/\\/g, "/")
    .split("/")
    .filter(Boolean)
    .map(encodeURIComponent)
    .join("/");

const toAmzDate = (date: Date) =>
  date.toISOString().replace(/[:-]|\.\d{3}/g, "");

const toDateStamp = (amzDate: string) => amzDate.slice(0, 8);

const toBuffer = async (body: FileBody): Promise<Buffer> => {
  if (Buffer.isBuffer(body)) return body;
  const chunks: Buffer[] = [];
  for await (const chunk of body) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
};

const decodeXml = (value: string) =>
  value
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");

export class S3CompatibleFileStorage implements FileStorage {
  private readonly endpoint: URL;

  constructor(private readonly options: S3CompatibleStorageOptions) {
    this.endpoint = new URL(options.endpoint);
  }

  private buildObjectUrl(key = "") {
    const url = new URL(this.endpoint.toString());
    const encodedKey = encodeKey(key);
    const basePath = url.pathname.replace(/\/$/, "");

    if (this.options.forcePathStyle ?? true) {
      url.pathname = `${basePath}/${encodeURIComponent(this.options.bucket)}${encodedKey ? `/${encodedKey}` : ""}`;
    } else {
      url.hostname = `${this.options.bucket}.${url.hostname}`;
      url.pathname = `${basePath}${encodedKey ? `/${encodedKey}` : "/"}`;
    }
    return url;
  }

  private signingKey(dateStamp: string) {
    const kDate = hmac(`AWS4${this.options.secretAccessKey}`, dateStamp);
    const kRegion = hmac(kDate, this.options.region);
    const kService = hmac(kRegion, "s3");
    return hmac(kService, "aws4_request");
  }

  private async request(
    method: string,
    url: URL,
    body?: Buffer,
    contentType?: string,
  ) {
    const now = new Date();
    const amzDate = toAmzDate(now);
    const dateStamp = toDateStamp(amzDate);
    const payloadHash = body ? sha256(body) : EMPTY_SHA256;
    const headers = new Headers();
    headers.set("host", url.host);
    headers.set("x-amz-content-sha256", payloadHash);
    headers.set("x-amz-date", amzDate);
    if (contentType) headers.set("content-type", contentType);

    const signedHeaderNames = [...headers.keys()].sort();
    const canonicalHeaders = signedHeaderNames
      .map((name) => `${name}:${headers.get(name)?.trim()}\n`)
      .join("");
    const canonicalQuery = [...url.searchParams.entries()]
      .sort(([aKey, aValue], [bKey, bValue]) =>
        aKey === bKey ? aValue.localeCompare(bValue) : aKey.localeCompare(bKey),
      )
      .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
      .join("&");
    const canonicalRequest = [
      method,
      url.pathname,
      canonicalQuery,
      canonicalHeaders,
      signedHeaderNames.join(";"),
      payloadHash,
    ].join("\n");
    const scope = `${dateStamp}/${this.options.region}/s3/aws4_request`;
    const stringToSign = [
      "AWS4-HMAC-SHA256",
      amzDate,
      scope,
      sha256(canonicalRequest),
    ].join("\n");
    const signature = createHmac("sha256", this.signingKey(dateStamp))
      .update(stringToSign)
      .digest("hex");
    headers.set(
      "authorization",
      `AWS4-HMAC-SHA256 Credential=${this.options.accessKeyId}/${scope}, SignedHeaders=${signedHeaderNames.join(";")}, Signature=${signature}`,
    );

    return fetch(url, { method, headers, body });
  }

  async put(input: PutFileInput): Promise<StoredFile> {
    const body = await toBuffer(input.body);
    const response = await this.request(
      "PUT",
      this.buildObjectUrl(input.key),
      body,
      input.contentType,
    );
    if (!response.ok) {
      throw new Error(`S3 put failed: ${response.status}`);
    }
    return { key: input.key };
  }

  async get(key: string): Promise<Readable> {
    const response = await this.request("GET", this.buildObjectUrl(key));
    if (!response.ok || !response.body) {
      throw new Error(`S3 get failed: ${response.status}`);
    }
    return Readable.fromWeb(response.body as never);
  }

  async delete(key: string): Promise<void> {
    const response = await this.request("DELETE", this.buildObjectUrl(key));
    if (!response.ok && response.status !== 404) {
      throw new Error(`S3 delete failed: ${response.status}`);
    }
  }

  async exists(key: string): Promise<boolean> {
    const response = await this.request("HEAD", this.buildObjectUrl(key));
    if (response.status === 404) return false;
    if (!response.ok) throw new Error(`S3 head failed: ${response.status}`);
    return true;
  }

  async *list(prefix = ""): AsyncIterable<StoredFileInfo> {
    let continuationToken: string | undefined;
    do {
      const url = this.buildObjectUrl();
      url.searchParams.set("list-type", "2");
      if (prefix) url.searchParams.set("prefix", prefix);
      if (continuationToken) {
        url.searchParams.set("continuation-token", continuationToken);
      }

      const response = await this.request("GET", url);
      if (!response.ok) throw new Error(`S3 list failed: ${response.status}`);
      const xml = await response.text();
      const keyPattern = /<Key>([\s\S]*?)<\/Key>/g;
      for (const match of xml.matchAll(keyPattern)) {
        yield { key: decodeXml(match[1]) };
      }
      continuationToken =
        xml.match(/<NextContinuationToken>([\s\S]*?)<\/NextContinuationToken>/)?.[1];
      if (continuationToken) continuationToken = decodeXml(continuationToken);
    } while (continuationToken);
  }

  async createTemporaryUrl(
    key: string,
    options?: { expiresInSeconds?: number },
  ): Promise<string> {
    const expiresInSeconds = Math.min(
      Math.max(options?.expiresInSeconds ?? 300, 1),
      604800,
    );
    const url = this.buildObjectUrl(key);
    const now = new Date();
    const amzDate = toAmzDate(now);
    const dateStamp = toDateStamp(amzDate);
    const scope = `${dateStamp}/${this.options.region}/s3/aws4_request`;

    url.searchParams.set("X-Amz-Algorithm", "AWS4-HMAC-SHA256");
    url.searchParams.set(
      "X-Amz-Credential",
      `${this.options.accessKeyId}/${scope}`,
    );
    url.searchParams.set("X-Amz-Date", amzDate);
    url.searchParams.set("X-Amz-Expires", String(expiresInSeconds));
    url.searchParams.set("X-Amz-SignedHeaders", "host");

    const canonicalQuery = [...url.searchParams.entries()]
      .sort(([aKey, aValue], [bKey, bValue]) =>
        aKey === bKey ? aValue.localeCompare(bValue) : aKey.localeCompare(bKey),
      )
      .map(([queryKey, value]) =>
        `${encodeURIComponent(queryKey)}=${encodeURIComponent(value)}`,
      )
      .join("&");
    const canonicalRequest = [
      "GET",
      url.pathname,
      canonicalQuery,
      `host:${url.host}\n`,
      "host",
      "UNSIGNED-PAYLOAD",
    ].join("\n");
    const stringToSign = [
      "AWS4-HMAC-SHA256",
      amzDate,
      scope,
      sha256(canonicalRequest),
    ].join("\n");
    const signature = createHmac("sha256", this.signingKey(dateStamp))
      .update(stringToSign)
      .digest("hex");
    url.searchParams.set("X-Amz-Signature", signature);
    return url.toString();
  }
}
