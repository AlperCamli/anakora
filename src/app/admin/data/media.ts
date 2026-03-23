import { getSupabaseBrowserClient } from "../../../lib/supabase/browser-client";
import type { AppLocale, MediaLibraryItem, MediaVisibility } from "../types";

const DEFAULT_PUBLIC_BUCKET = "public-assets";
const DEFAULT_PRIVATE_BUCKET = "admin-uploads";

function readBucketName(visibility: MediaVisibility) {
  if (visibility === "public") {
    return (
      import.meta.env.VITE_SUPABASE_STORAGE_BUCKET_PUBLIC ?? DEFAULT_PUBLIC_BUCKET
    );
  }
  return (
    import.meta.env.VITE_SUPABASE_STORAGE_BUCKET_PRIVATE ?? DEFAULT_PRIVATE_BUCKET
  );
}

function sanitizeSegment(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-_]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function sanitizeFileName(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]/g, "-")
    .replace(/-+/g, "-");
}

function resolveExtension(fileName: string) {
  const safe = sanitizeFileName(fileName);
  const parts = safe.split(".");
  if (parts.length < 2) {
    return "bin";
  }
  const ext = parts.pop()?.trim();
  return ext || "bin";
}

function buildMediaPath(input: {
  module: string;
  originalFileName: string;
  locale?: AppLocale | "";
  entityId?: string;
}) {
  const now = new Date();
  const year = String(now.getUTCFullYear());
  const month = String(now.getUTCMonth() + 1).padStart(2, "0");
  const moduleSegment = sanitizeSegment(input.module) || "misc";
  const localeSegment =
    input.locale === "tr" || input.locale === "en" ? input.locale : "";
  const entitySegment = sanitizeSegment(input.entityId ?? "");
  const extension = resolveExtension(input.originalFileName);
  const uniqueId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  const parts = ["images", moduleSegment, year, month];
  if (localeSegment) {
    parts.push(localeSegment);
  }
  if (entitySegment) {
    parts.push(entitySegment);
  }
  parts.push(`${uniqueId}.${extension}`);

  return parts.join("/");
}

export function toMediaReference(bucket: string, path: string) {
  return `storage://${bucket}/${path}`;
}

export function parseMediaReference(value: string): { bucket: string; path: string } | null {
  const trimmed = value.trim();
  if (!trimmed.startsWith("storage://")) {
    return null;
  }

  const withoutPrefix = trimmed.replace("storage://", "");
  const firstSlash = withoutPrefix.indexOf("/");
  if (firstSlash <= 0) {
    return null;
  }

  const bucket = withoutPrefix.slice(0, firstSlash).trim();
  const path = withoutPrefix.slice(firstSlash + 1).trim();
  if (!bucket || !path) {
    return null;
  }
  return { bucket, path };
}

export function getBucketForVisibility(visibility: MediaVisibility) {
  return readBucketName(visibility);
}

export async function listMediaObjects(options: {
  visibility: MediaVisibility;
  prefix?: string;
  limit?: number;
}): Promise<MediaLibraryItem[]> {
  const supabase = getSupabaseBrowserClient();
  const bucket = readBucketName(options.visibility);
  const normalizedPrefix = (options.prefix ?? "").replace(/^\/+|\/+$/g, "");

  const { data, error } = await supabase.storage
    .from(bucket)
    .list(normalizedPrefix, {
      limit: options.limit ?? 200,
      offset: 0,
      sortBy: { column: "created_at", order: "desc" },
    });

  if (error) {
    throw new Error(error.message);
  }

  const rows = (data ?? []).filter((item) => item.id !== null);
  return rows.map((item) => {
    const path = normalizedPrefix ? `${normalizedPrefix}/${item.name}` : item.name;
    const publicUrl =
      options.visibility === "public"
        ? supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl
        : null;
    const metadata = (item.metadata ?? {}) as Record<string, unknown>;
    return {
      bucket,
      path,
      name: item.name,
      size: typeof metadata.size === "number" ? metadata.size : null,
      createdAt: item.created_at ?? null,
      updatedAt: item.updated_at ?? null,
      publicUrl,
      reference: toMediaReference(bucket, path),
    };
  });
}

export async function uploadMediaObject(input: {
  visibility: MediaVisibility;
  file: File;
  module: string;
  locale?: AppLocale | "";
  entityId?: string;
}): Promise<MediaLibraryItem> {
  const supabase = getSupabaseBrowserClient();
  const bucket = readBucketName(input.visibility);
  const path = buildMediaPath({
    module: input.module,
    originalFileName: input.file.name,
    locale: input.locale,
    entityId: input.entityId,
  });

  const { error } = await supabase.storage.from(bucket).upload(path, input.file, {
    upsert: false,
    contentType: input.file.type || undefined,
    cacheControl: "3600",
  });
  if (error) {
    throw new Error(error.message);
  }

  const publicUrl =
    input.visibility === "public"
      ? supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl
      : null;

  return {
    bucket,
    path,
    name: path.split("/").pop() ?? input.file.name,
    size: input.file.size,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    publicUrl,
    reference: toMediaReference(bucket, path),
  };
}

export async function removeMediaObject(reference: string): Promise<void> {
  const parsed = parseMediaReference(reference);
  if (!parsed) {
    throw new Error("Invalid media reference. Expected storage://bucket/path");
  }

  const supabase = getSupabaseBrowserClient();
  const { error } = await supabase.storage.from(parsed.bucket).remove([parsed.path]);
  if (error) {
    throw new Error(error.message);
  }
}
