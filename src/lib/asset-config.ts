/**
 * Asset URL resolution for models, videos, and other large media.
 *
 * Resolution strategies, tried in order:
 *
 * 1. Absolute URLs (http/https) — used as-is.
 * 2. Public Cloudflare R2 URL derived from local path conventions.
 * 3. Local file via Vite BASE_URL — fallback for local/static deployments.
 *
 * The browser only receives the public asset base URL plus optional key-mapping
 * rules. Any R2 credentials stay server-side for upload or admin workflows.
 */

const joinUrl = (base: string, path: string): string =>
  `${base.replace(/\/+$/, "")}/${path.replace(/^\/+/, "")}`;

const DEFAULT_R2_PUBLIC_BASE_URL = "https://pub-8e3c30b5230f4f26bef002809026aaa8.r2.dev";

const getBaseUrl = (): string => import.meta.env.BASE_URL ?? "/";

const shouldUseLocalAssets = (): boolean =>
  import.meta.env.VITE_USE_LOCAL_ASSETS === "true";

const getR2PublicBaseUrl = (): string | undefined => {
  if (shouldUseLocalAssets()) {
    return undefined;
  }

  const value = import.meta.env.VITE_R2_PUBLIC_BASE_URL as string | undefined;
  return value?.trim() ? value.trim() : DEFAULT_R2_PUBLIC_BASE_URL;
};

const getR2KeyPrefix = (): string | undefined =>
  import.meta.env.VITE_R2_KEY_PREFIX as string | undefined;

const shouldFlattenR2Keys = (): boolean =>
  import.meta.env.VITE_R2_FLATTEN_KEYS !== "false";

export const pathToR2Key = (path: string): string => {
  const cleanedPath = path.replace(/^\/+/, "");
  const keyBody = shouldFlattenR2Keys()
    ? (cleanedPath.split("/").pop() ?? cleanedPath)
    : cleanedPath;
  const defaultPrefix = shouldFlattenR2Keys() ? "assets" : "";
  const prefix = (getR2KeyPrefix() ?? defaultPrefix).replace(/^\/+|\/+$/g, "");
  return prefix ? `${prefix}/${keyBody}` : keyBody;
};

export const isR2Configured = (): boolean => Boolean(getR2PublicBaseUrl());

export const getClientAssetBaseUrl = (): string | null => getR2PublicBaseUrl() ?? null;

/**
 * Resolves a model/media path to a URL synchronously.
 */
export const resolveAssetUrl = (path: string): string => {
  if (/^https?:\/\//i.test(path)) return path;
  const publicBaseUrl = getR2PublicBaseUrl();
  if (publicBaseUrl) {
    return joinUrl(publicBaseUrl, pathToR2Key(path));
  }
  const base = getBaseUrl().replace(/\/$/, "");
  return `${base}${path}`;
};

/**
 * Async counterpart of resolveAssetUrl for existing async call sites.
 */
export const resolveAssetUrlAsync = async (path: string): Promise<string> =>
  resolveAssetUrl(path);

export const isRemoteAsset = (path: string): boolean => /^https?:\/\//i.test(path);
