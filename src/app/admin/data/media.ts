import { getSupabaseBrowserClient } from "../../../lib/supabase/browser-client";
import type { MediaLibraryItem, MediaModule, MediaVisibility } from "../types";

const DEFAULT_PUBLIC_BUCKET = "public-assets";
const DEFAULT_PRIVATE_BUCKET = "admin-uploads";
const DEFAULT_LIST_PAGE_SIZE = 100;
const DEFAULT_SIGNED_PREVIEW_EXPIRES_IN_SECONDS = 300;

export const MEDIA_MODULES: MediaModule[] = [
  "journal",
  "program",
  "guide",
  "testimonials",
  "homepage",
  "logo",
];

export const MEDIA_MODULE_LABELS: Record<MediaModule, string> = {
  journal: "Jurnal",
  program: "Program",
  guide: "Rehber",
  testimonials: "Yorumlar",
  homepage: "Anasayfa",
  logo: "Logo",
};

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
  module: MediaModule;
  originalFileName: string;
}) {
  const moduleSegment = sanitizeSegment(input.module) || "journal";
  const extension = resolveExtension(input.originalFileName);
  const uniqueId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  return ["images", moduleSegment, `${uniqueId}.${extension}`].join("/");
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

function toTrimmedPath(value?: string) {
  return (value ?? "").trim().replace(/^\/+|\/+$/g, "");
}

async function listRecursiveFiles(options: {
  bucket: string;
  rootPrefix: string;
  limit: number;
}) {
  const supabase = getSupabaseBrowserClient();
  const queue: string[] = [options.rootPrefix];
  const files: Array<{ path: string; row: Record<string, unknown> }> = [];

  while (queue.length > 0 && files.length < options.limit) {
    const currentPrefix = queue.shift() ?? "";
    const { data, error } = await supabase.storage
      .from(options.bucket)
      .list(currentPrefix, {
        limit: DEFAULT_LIST_PAGE_SIZE,
        offset: 0,
        sortBy: { column: "created_at", order: "desc" },
      });

    if (error) {
      throw new Error(error.message);
    }

    for (const row of (data ?? []) as Array<Record<string, unknown>>) {
      const name = String(row.name ?? "").trim();
      if (!name) {
        continue;
      }
      const path = currentPrefix ? `${currentPrefix}/${name}` : name;

      if (row.id === null) {
        queue.push(path);
        continue;
      }

      files.push({ path, row });
      if (files.length >= options.limit) {
        break;
      }
    }
  }

  return files;
}

export async function listMediaObjects(options: {
  visibility: MediaVisibility;
  module?: MediaModule;
  prefix?: string;
  limit?: number;
}): Promise<MediaLibraryItem[]> {
  const bucket = readBucketName(options.visibility);
  const supabase = getSupabaseBrowserClient();
  const requestedPrefix = options.module
    ? `images/${options.module}`
    : toTrimmedPath(options.prefix ?? "images");
  const rows = await listRecursiveFiles({
    bucket,
    rootPrefix: requestedPrefix,
    limit: options.limit ?? 200,
  });

  return rows
    .map(({ path, row }) => {
    const publicUrl =
      options.visibility === "public"
        ? supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl
        : null;
    const metadata = (row.metadata ?? {}) as Record<string, unknown>;
    return {
      bucket,
      path,
      name: String(row.name),
      size: typeof metadata.size === "number" ? metadata.size : null,
      createdAt: typeof row.created_at === "string" ? row.created_at : null,
      updatedAt: typeof row.updated_at === "string" ? row.updated_at : null,
      publicUrl,
      reference: toMediaReference(bucket, path),
    };
    })
    .sort((a, b) => {
      const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return bTime - aTime;
    });
}

export async function uploadMediaObject(input: {
  visibility: MediaVisibility;
  file: File;
  module: MediaModule;
}): Promise<MediaLibraryItem> {
  const supabase = getSupabaseBrowserClient();
  const bucket = readBucketName(input.visibility);
  const path = buildMediaPath({
    module: input.module,
    originalFileName: input.file.name,
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
    throw new Error("Gecersiz medya referansi. Beklenen format: storage://bucket/path");
  }

  const supabase = getSupabaseBrowserClient();
  const { error } = await supabase.storage.from(parsed.bucket).remove([parsed.path]);
  if (error) {
    throw new Error(error.message);
  }
}

export async function getMediaPreviewUrl(input: {
  visibility: MediaVisibility;
  item: Pick<MediaLibraryItem, "bucket" | "path" | "publicUrl">;
  expiresInSeconds?: number;
}): Promise<string | null> {
  const supabase = getSupabaseBrowserClient();

  if (input.visibility === "public") {
    return (
      input.item.publicUrl ??
      supabase.storage.from(input.item.bucket).getPublicUrl(input.item.path).data.publicUrl
    );
  }

  const { data, error } = await supabase.storage
    .from(input.item.bucket)
    .createSignedUrl(
      input.item.path,
      input.expiresInSeconds ?? DEFAULT_SIGNED_PREVIEW_EXPIRES_IN_SECONDS,
    );

  if (error) {
    throw new Error(error.message);
  }

  return data.signedUrl ?? null;
}
