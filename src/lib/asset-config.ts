/**
 * Asset URL resolution for models, videos, and other large media.
 *
 * Remote asset support (Cloudflare R2):
 * Set VITE_R2_PUBLIC_BASE in your .env file to the public base URL of your R2
 * bucket (e.g. https://pub-xxx.r2.dev). This URL requires no credentials and
 * should be configured with public read access on the bucket.
 *
 * Example .env entry:
 *   VITE_R2_PUBLIC_BASE=https://pub-abc123.r2.dev
 *
 * Asset paths in content JSON (e.g. /models/shared/tooth-cross-section.glb)
 * are resolved in this order:
 *   1. If the path is already an absolute URL (http/https), use it as-is.
 *   2. If VITE_R2_PUBLIC_BASE is set, prefix with the R2 base URL.
 *   3. Otherwise, prefix with the Vite BASE_URL for local development.
 *
 * Secrets (R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY) are for server-side
 * upload scripts only and must never be exposed in browser bundles. See
 * assets/r2.config for the expected credential shape.
 */

const r2PublicBase =
  typeof import.meta !== "undefined" && import.meta.env
    ? (import.meta.env.VITE_R2_PUBLIC_BASE as string | undefined)
    : undefined;

const viteBase =
  typeof import.meta !== "undefined" && import.meta.env
    ? (import.meta.env.BASE_URL as string) ?? "/"
    : "/";

/**
 * Resolves a model or media asset path to a fully-qualified URL.
 *
 * @param path - A path like `/models/shared/tooth.glb` or an absolute URL.
 * @returns The resolved URL string.
 */
export const resolveAssetUrl = (path: string): string => {
  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  if (r2PublicBase) {
    const base = r2PublicBase.replace(/\/$/, "");
    return `${base}${path}`;
  }

  const base = viteBase.replace(/\/$/, "");
  return `${base}${path}`;
};

export const isRemoteAsset = (path: string): boolean => /^https?:\/\//i.test(path);
