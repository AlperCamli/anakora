export function trimOrNull(value: string): string | null {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function normalizeSlug(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function parseInteger(value: string, fieldLabel: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  const parsed = Number(trimmed);
  if (!Number.isInteger(parsed)) {
    throw new Error(`${fieldLabel} tam sayi olmalidir.`);
  }

  return parsed;
}

export function parseJsonObject(
  text: string,
  fieldLabel: string,
): Record<string, unknown> {
  const trimmed = text.trim();
  if (!trimmed) {
    return {};
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(trimmed);
  } catch (error) {
    throw new Error(
      error instanceof Error
        ? `${fieldLabel} gecersiz JSON: ${error.message}`
        : `${fieldLabel} gecersiz JSON.`,
    );
  }

  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error(`${fieldLabel} bir JSON nesnesi olmalidir.`);
  }

  return parsed as Record<string, unknown>;
}

export function parseJsonArray(text: string, fieldLabel: string): unknown[] {
  const trimmed = text.trim();
  if (!trimmed) {
    return [];
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(trimmed);
  } catch (error) {
    throw new Error(
      error instanceof Error
        ? `${fieldLabel} gecersiz JSON: ${error.message}`
        : `${fieldLabel} gecersiz JSON.`,
    );
  }

  if (!Array.isArray(parsed)) {
    throw new Error(`${fieldLabel} bir JSON dizisi olmalidir.`);
  }

  return parsed;
}

export function stringifyJson(value: unknown, fallback: "object" | "array" = "object") {
  if (fallback === "object") {
    if (!value || typeof value !== "object" || Array.isArray(value)) {
      return "{}";
    }
  }
  if (fallback === "array" && !Array.isArray(value)) {
    return "[]";
  }
  return JSON.stringify(value, null, 2);
}

export function toDateTimeLocal(iso: string | null): string {
  if (!iso) {
    return "";
  }

  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const offsetMs = date.getTimezoneOffset() * 60_000;
  const localDate = new Date(date.getTime() - offsetMs);
  return localDate.toISOString().slice(0, 16);
}

export function toIsoFromDateTimeLocal(value: string, fieldLabel: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error(`${fieldLabel} gecersiz tarih/saat degeri iceriyor.`);
  }
  return parsed.toISOString();
}

export function hasText(value: string | null | undefined) {
  return Boolean(value && value.trim().length > 0);
}
