/**
 * Asset URL resolution for models, videos, and other large media.
 *
 * Three resolution strategies, tried in order:
 *
 * 1. Absolute URLs (http/https) — used as-is.
 * 2. Public Cloudflare R2 URL (when VITE_R2_PUBLIC_BASE_URL is set).
 * 3. Local file via Vite BASE_URL — fallback for local/static deployments.
 */

const BASE_URL = import.meta.env.BASE_URL ?? "/";
const R2_PUBLIC_BASE_URL = import.meta.env.VITE_R2_PUBLIC_BASE_URL as string | undefined;
const R2_KEY_PREFIX = import.meta.env.VITE_R2_KEY_PREFIX as string | undefined;
const R2_FLATTEN_KEYS = import.meta.env.VITE_R2_FLATTEN_KEYS === "true";

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
  return resolveAssetUrl(path);
};

export const isRemoteAsset = (path: string): boolean => /^https?:\/\//i.test(path);
