/**
 * Asset URL resolution for models, videos, and other large media.
 *
 * Resolution strategies, tried in order:
 *
 * 1. Absolute URLs (http/https) — used as-is.
 * 2. Public Cloudflare R2 URL (when VITE_R2_PUBLIC_BASE_URL is set).
 * 3. Signed Cloudflare R2 URL (when VITE_R2_* credentials are set).
 * 4. Local file via Vite BASE_URL — fallback for local/static deployments.
 */

import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const BASE_URL = import.meta.env.BASE_URL ?? "/";
const R2_PUBLIC_BASE_URL = import.meta.env.VITE_R2_PUBLIC_BASE_URL as string | undefined;
const R2_ACCOUNT_ID = import.meta.env.VITE_R2_ACCOUNT_ID as string | undefined;
const R2_BUCKET_NAME = import.meta.env.VITE_R2_BUCKET_NAME as string | undefined;
const R2_ACCESS_KEY_ID = import.meta.env.VITE_R2_ACCESS_KEY_ID as string | undefined;
const R2_SECRET_ACCESS_KEY = import.meta.env.VITE_R2_SECRET_ACCESS_KEY as string | undefined;
const R2_KEY_PREFIX = import.meta.env.VITE_R2_KEY_PREFIX as string | undefined;
const R2_FLATTEN_KEYS = import.meta.env.VITE_R2_FLATTEN_KEYS !== "false";

const joinUrl = (base: string, path: string): string =>
  `${base.replace(/\/+$/, "")}/${path.replace(/^\/+/, "")}`;

const pathToR2Key = (path: string): string => {
  const cleanedPath = path.replace(/^\/+/, "");
  const keyBody = R2_FLATTEN_KEYS
    ? (cleanedPath.split("/").pop() ?? cleanedPath)
    : cleanedPath;
  const defaultPrefix = R2_FLATTEN_KEYS ? "assets" : "";
  const prefix = (R2_KEY_PREFIX ?? defaultPrefix).replace(/^\/+|\/+$/g, "");
  return prefix ? `${prefix}/${keyBody}` : keyBody;
};

export const isR2Configured = (): boolean => Boolean(R2_PUBLIC_BASE_URL?.trim());
export const isR2SigningConfigured = (): boolean =>
  Boolean(R2_ACCOUNT_ID && R2_BUCKET_NAME && R2_ACCESS_KEY_ID && R2_SECRET_ACCESS_KEY);

const getR2Client = (): S3Client | null => {
  if (!isR2SigningConfigured()) {
    return null;
  }

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
 * Resolves a model/media path to a URL synchronously.
 */
export const resolveAssetUrl = (path: string): string => {
  if (/^https?:\/\//i.test(path)) return path;
  if (isR2Configured()) {
    return joinUrl(R2_PUBLIC_BASE_URL!, pathToR2Key(path));
  }
  const base = BASE_URL.replace(/\/$/, "");
  return `${base}${path}`;
};

/**
 * Async counterpart of resolveAssetUrl for existing async call sites.
 */
export const resolveAssetUrlAsync = async (path: string): Promise<string> => {
  if (/^https?:\/\//i.test(path)) return path;

  if (isR2Configured()) {
    return joinUrl(R2_PUBLIC_BASE_URL!, pathToR2Key(path));
  }

  const client = getR2Client();
  if (!client || !R2_BUCKET_NAME) {
    return resolveAssetUrl(path);
  }

  try {
    const command = new GetObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: pathToR2Key(path),
    });

    return await getSignedUrl(client, command, { expiresIn: 3600 });
  } catch {
    return resolveAssetUrl(path);
  }
};

export const isRemoteAsset = (path: string): boolean => /^https?:\/\//i.test(path);
