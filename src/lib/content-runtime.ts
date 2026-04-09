import { ZodError, type ZodType } from "zod";

import { FetchError, ValidationError } from "@/lib/errors";
import type { LocalizedText } from "@/types/content";

export const withBasePath = (path: string) =>
  `${import.meta.env.BASE_URL.replace(/\/$/, "")}${path}`;

export const fetchJson = async <T>(path: string): Promise<T> => {
  const response = await fetch(withBasePath(path));

  if (!response.ok) {
    throw new FetchError(path, response.status);
  }

  return response.json() as Promise<T>;
};

export const loadValidatedJson = async <T>(path: string, schema: ZodType<T>): Promise<T> => {
  const payload = await fetchJson<unknown>(path);

  try {
    return schema.parse(payload);
  } catch (error) {
    if (error instanceof ZodError) {
      throw new ValidationError(`Invalid content payload for ${path}`, error.issues);
    }

    throw error;
  }
};

export const resolveLocalizedText = (value: LocalizedText | null | undefined, fallback: string) => {
  if (typeof value === "string") {
    return value;
  }

  if (value) {
    if (typeof value.en === "string") {
      return value.en;
    }

    const firstAvailableValue = Object.values(value).find(
      (entry): entry is string => typeof entry === "string",
    );

    if (firstAvailableValue) {
      return firstAvailableValue;
    }
  }

  return fallback;
};
