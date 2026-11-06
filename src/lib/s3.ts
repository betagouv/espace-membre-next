import {
  S3Client,
  GetObjectCommand,
  DeleteObjectCommand,
  PutObjectCommand,
  NoSuchKey,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

import config from "@/lib/config";

function createS3Client(): S3Client | undefined {
  try {
    if (
      !config.S3_HOST ||
      !config.S3_KEY_ID ||
      !config.S3_KEY_SECRET ||
      !config.S3_BUCKET
    ) {
      return undefined;
    }
    return new S3Client({
      region: config.S3_REGION,
      endpoint: config.S3_HOST,
      // Custom S3-compatible endpoint (e.g. OVH / Scalingo) requires path-style addressing
      forcePathStyle: true,
      credentials: {
        accessKeyId: config.S3_KEY_ID,
        secretAccessKey: config.S3_KEY_SECRET,
      },
    });
  } catch {
    console.error("there is no S3");
    return undefined;
  }
}

let s3: S3Client | undefined = createS3Client();

export const isS3Available = (): boolean => !!s3;

function assertS3Available(): void {
  if (!s3) {
    throw new Error("S3 client is not available");
  }
}

export async function getImageContent(
  key: string,
): Promise<Uint8Array | undefined> {
  assertS3Available();
  try {
    const output = await s3!.send(
      new GetObjectCommand({ Bucket: config.S3_BUCKET, Key: key }),
    );
    if (!output.Body) return undefined;
    return new Uint8Array(await output.Body.transformToByteArray());
  } catch (error) {
    if (error instanceof NoSuchKey) return undefined;
    throw error;
  }
}

export async function hasImage(key: string): Promise<boolean> {
  try {
    const content = await getImageContent(key);
    return content !== undefined;
  } catch {
    return false;
  }
}

export async function deleteImage(key: string): Promise<void> {
  assertS3Available();
  await s3!.send(
    new DeleteObjectCommand({ Bucket: config.S3_BUCKET, Key: key }),
  );
}

export async function getPutSignedUrl(
  key: string,
  options: { contentType: string; expiresIn?: number },
): Promise<string> {
  assertS3Available();
  const command = new PutObjectCommand({
    Bucket: config.S3_BUCKET,
    Key: key,
    ContentType: options.contentType,
  });
  return getSignedUrl(s3!, command, { expiresIn: options.expiresIn ?? 60 });
}

export async function getAvatarUrl(
  username: string,
): Promise<string | undefined> {
  const s3Key = `members/${username}/avatar.jpg`;
  const hasImageFlag = await hasImage(s3Key);
  return hasImageFlag ? `/api/member/${username}/image` : undefined;
}
