import type { JsonValue } from "./db-rows";
import type { Locale, MediaDTO } from "./types";
import { DEFAULT_LOCALE } from "./types";

export function localeCandidates(
  locale: Locale,
  fallback: Locale = DEFAULT_LOCALE,
): Locale[] {
  return locale === fallback ? [locale] : [locale, fallback];
}

export function pickTranslation<T extends { locale: Locale }>(
  rows: T[],
  locale: Locale,
  fallback: Locale = DEFAULT_LOCALE,
): T | null {
  if (rows.length === 0) {
    return null;
  }

  const exact = rows.find((row) => row.locale === locale);
  if (exact) {
    return exact;
  }

  const fallbackRow = rows.find((row) => row.locale === fallback);
  return fallbackRow ?? rows[0] ?? null;
}

export function groupBy<T, K extends string | number>(
  rows: T[],
  keySelector: (row: T) => K,
): Record<K, T[]> {
  return rows.reduce<Record<K, T[]>>((acc, row) => {
    const key = keySelector(row);
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(row);
    return acc;
  }, {} as Record<K, T[]>);
}

export function normalizeMedia(
  url: string | null | undefined,
  alt: string | null | undefined,
  type: "image" | "video" = "image",
): MediaDTO | null {
  if (!url) {
    return null;
  }
  return {
    url,
    alt: alt ?? null,
    type,
  };
}

export function asArray<T>(
  value: JsonValue,
  fallback: T[] = [],
  itemGuard?: (item: unknown) => item is T,
): T[] {
  if (!Array.isArray(value)) {
    return fallback;
  }

  if (!itemGuard) {
    return value as T[];
  }

  return value.filter(itemGuard);
}

export function asObject(
  value: JsonValue,
  fallback: Record<string, unknown> = {},
): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return fallback;
  }
  return value as Record<string, unknown>;
}

export function readLocalizedObjectValue(
  value: JsonValue,
  locale: Locale,
  fallback: Locale = DEFAULT_LOCALE,
): string | null {
  const obj = asObject(value);
  const localeValue = obj[locale];
  if (typeof localeValue === "string" && localeValue.trim().length > 0) {
    return localeValue;
  }

  const fallbackValue = obj[fallback];
  if (typeof fallbackValue === "string" && fallbackValue.trim().length > 0) {
    return fallbackValue;
  }

  return null;
}

export function toNullableNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}
