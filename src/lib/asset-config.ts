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

type S3ClientConstructor = typeof import("@aws-sdk/client-s3").S3Client;
type GetObjectCommandConstructor = typeof import("@aws-sdk/client-s3").GetObjectCommand;
type GetSignedUrlFn = typeof import("@aws-sdk/s3-request-presigner").getSignedUrl;

type AwsSigningModules = {
  S3Client: S3ClientConstructor;
  GetObjectCommand: GetObjectCommandConstructor;
  getSignedUrl: GetSignedUrlFn;
};

const BASE_URL = import.meta.env.BASE_URL ?? "/";
const R2_PUBLIC_BASE_URL = import.meta.env.VITE_R2_PUBLIC_BASE_URL as string | undefined;
const R2_ACCOUNT_ID = import.meta.env.VITE_R2_ACCOUNT_ID as string | undefined;
const R2_BUCKET_NAME = import.meta.env.VITE_R2_BUCKET_NAME as string | undefined;
const R2_ACCESS_KEY_ID = import.meta.env.VITE_R2_ACCESS_KEY_ID as string | undefined;
const R2_SECRET_ACCESS_KEY = import.meta.env.VITE_R2_SECRET_ACCESS_KEY as string | undefined;
const R2_KEY_PREFIX = import.meta.env.VITE_R2_KEY_PREFIX as string | undefined;
const R2_FLATTEN_KEYS = import.meta.env.VITE_R2_FLATTEN_KEYS !== "false";
const SIGNED_URL_EXPIRES_SECONDS = 3600;
const SIGNED_URL_CACHE_SECONDS = 3300;

const signedUrlCache = new Map<string, { url: string; expiresAt: number }>();
let awsSigningModulesPromise: Promise<AwsSigningModules> | null = null;
let r2ClientPromise: Promise<InstanceType<S3ClientConstructor> | null> | null = null;

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

const getAwsSigningModules = async (): Promise<AwsSigningModules> => {
  if (!awsSigningModulesPromise) {
    awsSigningModulesPromise = Promise.all([
      import("@aws-sdk/client-s3"),
      import("@aws-sdk/s3-request-presigner"),
    ]).then(([s3, presigner]) => ({
      S3Client: s3.S3Client,
      GetObjectCommand: s3.GetObjectCommand,
      getSignedUrl: presigner.getSignedUrl,
    }));
  }

  return awsSigningModulesPromise;
};

const getR2Client = async (): Promise<InstanceType<S3ClientConstructor> | null> => {
  if (!isR2SigningConfigured()) {
    return null;
  }

  if (!r2ClientPromise) {
    r2ClientPromise = getAwsSigningModules().then(({ S3Client }) =>
      new S3Client({
        region: "auto",
        endpoint: `https://${R2_ACCOUNT_ID!}.r2.cloudflarestorage.com`,
        credentials: {
          accessKeyId: R2_ACCESS_KEY_ID!,
          secretAccessKey: R2_SECRET_ACCESS_KEY!,
        },
      }),
    );
  }

  return r2ClientPromise;
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

  const key = pathToR2Key(path);
  const cacheKey = `${R2_BUCKET_NAME ?? ""}:${key}`;
  const cached = signedUrlCache.get(cacheKey);
  const now = Date.now();
  if (cached && cached.expiresAt > now) {
    return cached.url;
  }

  const [client, { GetObjectCommand, getSignedUrl }] = await Promise.all([
    getR2Client(),
    getAwsSigningModules(),
  ]);

  if (!client || !R2_BUCKET_NAME) {
    return resolveAssetUrl(path);
  }

  try {
    const command = new GetObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: key,
    });

    const url = await getSignedUrl(client, command, { expiresIn: SIGNED_URL_EXPIRES_SECONDS });
    signedUrlCache.set(cacheKey, {
      url,
      expiresAt: now + SIGNED_URL_CACHE_SECONDS * 1000,
    });
    return url;
  } catch {
    return resolveAssetUrl(path);
  }
};

export const isRemoteAsset = (path: string): boolean => /^https?:\/\//i.test(path);
