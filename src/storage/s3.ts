import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { env } from "../config/env.js";
import type { Storage, SavedFile } from "./types.js";

const cfg = env.storage.s3;

export function isS3Configured(): boolean {
  return Boolean(cfg.bucket && cfg.accessKeyId && cfg.secretAccessKey);
}

let client: S3Client | null = null;
function getClient(): S3Client {
  if (!client) {
    client = new S3Client({
      region: cfg.region,
      endpoint: cfg.endpoint,
      forcePathStyle: cfg.forcePathStyle,
      credentials: {
        accessKeyId: cfg.accessKeyId,
        secretAccessKey: cfg.secretAccessKey,
      },
    });
  }
  return client;
}

function publicUrlFor(key: string): string {
  if (cfg.publicUrl) return `${cfg.publicUrl}/${key}`;
  if (cfg.endpoint) {
    // S3-compatible custom endpoint (path-style)
    const base = cfg.endpoint.replace(/\/$/, "");
    return cfg.forcePathStyle
      ? `${base}/${cfg.bucket}/${key}`
      : `${base}/${key}`;
  }
  return `https://${cfg.bucket}.s3.${cfg.region}.amazonaws.com/${key}`;
}

export const s3Storage: Storage = {
  driver: "s3",
  async save(buffer, filename, mimetype): Promise<SavedFile> {
    const key = cfg.prefix ? `${cfg.prefix}/${filename}` : filename;
    await getClient().send(
      new PutObjectCommand({
        Bucket: cfg.bucket,
        Key: key,
        Body: buffer,
        ContentType: mimetype,
      })
    );
    return { key, url: publicUrlFor(key), driver: "s3" };
  },
  async remove(key): Promise<void> {
    await getClient()
      .send(new DeleteObjectCommand({ Bucket: cfg.bucket, Key: key }))
      .catch(() => {});
  },
};
