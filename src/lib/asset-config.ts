/**
 * Asset URL resolution for models, videos, and other large media.
 *
 * Three resolution strategies, tried in order:
 *
 * 1. Absolute URLs (http/https) — used as-is.
 *
 * 2. Cloudflare R2 presigned URL — generated when all four VITE_R2_* env
 *    vars are set. The credentials come from .env (same values as
 *    assets/r2.config) with a VITE_ prefix so Vite embeds them in the
 *    browser bundle. Only use this on internal or private deployments.
 *
 *    Required .env entries:
 *      VITE_R2_ACCOUNT_ID      — your Cloudflare account ID
 *      VITE_R2_BUCKET_NAME     — R2 bucket name
 *      VITE_R2_ACCESS_KEY_ID   — R2 API token access key
 *      VITE_R2_SECRET_ACCESS_KEY — R2 API token secret key
 *
 *    Presigned URLs are valid for 1 hour and require no public bucket access.
 *
 * 3. Local file via Vite BASE_URL — fallback for dev and deployments without R2.
 */

import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const env = (typeof import.meta !== "undefined" && import.meta.env) ? import.meta.env : {};

const R2_ACCOUNT_ID = env.VITE_R2_ACCOUNT_ID as string | undefined;
const R2_BUCKET_NAME = env.VITE_R2_BUCKET_NAME as string | undefined;
const R2_ACCESS_KEY_ID = env.VITE_R2_ACCESS_KEY_ID as string | undefined;
const R2_SECRET_ACCESS_KEY = env.VITE_R2_SECRET_ACCESS_KEY as string | undefined;
const BASE_URL = (env.BASE_URL as string | undefined) ?? "/";

export const isR2Configured = (): boolean =>
  Boolean(R2_ACCOUNT_ID && R2_BUCKET_NAME && R2_ACCESS_KEY_ID && R2_SECRET_ACCESS_KEY);

const getR2Client = (): S3Client | null => {
  if (!isR2Configured()) return null;

  return new S3Client({
    region: "auto",
    endpoint: `https://${R2_ACCOUNT_ID!}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: R2_ACCESS_KEY_ID!,
      secretAccessKey: R2_SECRET_ACCESS_KEY!,
    },
  });
};

/**
 * Converts a content path like `/models/shared/tooth.glb` to an R2 object key
 * by stripping the leading slash.
 */
const pathToR2Key = (path: string): string => path.replace(/^\//, "");

/**
 * Resolves a model/media path to a URL synchronously.
 * For R2-hosted private assets, use resolveAssetUrlAsync instead.
 */
export const resolveAssetUrl = (path: string): string => {
  if (/^https?:\/\//i.test(path)) return path;
  const base = BASE_URL.replace(/\/$/, "");
  return `${base}${path}`;
};

/**
 * Resolves a model/media path to a URL, generating an R2 presigned URL when
 * credentials are available. Falls back to resolveAssetUrl otherwise.
 *
 * Presigned URLs expire after 1 hour.
 */
export const resolveAssetUrlAsync = async (path: string): Promise<string> => {
  if (/^https?:\/\//i.test(path)) return path;

  const client = getR2Client();
  if (!client || !R2_BUCKET_NAME) return resolveAssetUrl(path);

  try {
    const command = new GetObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: pathToR2Key(path),
    });

    return await getSignedUrl(client, command, { expiresIn: 3600 });
  } catch {
    // Fall back to local path if signing fails
    return resolveAssetUrl(path);
  }
};

export const isRemoteAsset = (path: string): boolean => /^https?:\/\//i.test(path);
