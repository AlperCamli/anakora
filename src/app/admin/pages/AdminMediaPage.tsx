import { useEffect, useState } from "react";
import { AdminRoleGate } from "../components/AdminRoleGate";
import { AdminStateCard } from "../components/AdminStateCard";
import {
  getBucketForVisibility,
  listMediaObjects,
  removeMediaObject,
  uploadMediaObject,
} from "../data/media";
import type { AppLocale, MediaLibraryItem, MediaVisibility } from "../types";

function formatSize(size: number | null) {
  if (!size || size <= 0) {
    return "-";
  }
  if (size < 1024) {
    return `${size} B`;
  }
  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(1)} KB`;
  }
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

export function AdminMediaPage() {
  return (
    <AdminRoleGate capability="manage_media">
      <MediaContent />
    </AdminRoleGate>
  );
}

function MediaContent() {
  const [visibility, setVisibility] = useState<MediaVisibility>("public");
  const [prefix, setPrefix] = useState("images");
  const [locale, setLocale] = useState<AppLocale | "">("");
  const [moduleName, setModuleName] = useState("journal");
  const [entityId, setEntityId] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const [items, setItems] = useState<MediaLibraryItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<MediaLibraryItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  async function loadLibrary() {
    setLoading(true);
    setError(null);
    try {
      const rows = await listMediaObjects({
        visibility,
        prefix,
        limit: 200,
      });
      setItems(rows);
      if (rows.length === 0) {
        setSelectedItem(null);
      } else if (!selectedItem) {
        setSelectedItem(rows[0]);
      }
    } catch (fetchError) {
      setError(fetchError instanceof Error ? fetchError.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadLibrary();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visibility]);

  async function handleUpload() {
    if (!selectedFile) {
      setActionError("Please select a file first.");
      return;
    }

    setUploading(true);
    setActionError(null);
    setActionMessage(null);
    try {
      const uploaded = await uploadMediaObject({
        visibility,
        file: selectedFile,
        module: moduleName,
        locale,
        entityId: entityId || undefined,
      });
      setActionMessage("File uploaded successfully.");
      setSelectedFile(null);
      await loadLibrary();
      setSelectedItem(uploaded);
    } catch (uploadError) {
      setActionError(uploadError instanceof Error ? uploadError.message : "Upload failed.");
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(item: MediaLibraryItem) {
    setActionError(null);
    setActionMessage(null);
    try {
      await removeMediaObject(item.reference);
      setActionMessage("Asset deleted.");
      await loadLibrary();
    } catch (deleteError) {
      setActionError(deleteError instanceof Error ? deleteError.message : "Delete failed.");
    }
  }

  if (loading) {
    return <AdminStateCard title="Loading media library" message="Reading storage objects..." />;
  }

  if (error) {
    return <AdminStateCard title="Media unavailable" message={error} tone="error" />;
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
        <h3 className="text-lg font-medium">Media library</h3>
        <p className="text-sm text-muted-foreground">
          Upload flow uses Supabase Storage. Path convention:
          <code className="ml-1 rounded bg-muted px-1.5 py-0.5 text-xs">
            images/&lt;module&gt;/&lt;year&gt;/&lt;month&gt;/[locale]/[entity]/&lt;unique&gt;.&lt;ext&gt;
          </code>
        </p>
      </div>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-[0.95fr_1.05fr]">
        <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
          <h4 className="text-base font-medium">Upload</h4>
          <div className="mt-3 space-y-2">
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <label className="block space-y-1 text-sm">
                <span>Visibility</span>
                <select
                  value={visibility}
                  onChange={(event) => setVisibility(event.target.value as MediaVisibility)}
                  className="w-full rounded-md border border-border bg-background px-3 py-2"
                >
                  <option value="public">public ({getBucketForVisibility("public")})</option>
                  <option value="private">private ({getBucketForVisibility("private")})</option>
                </select>
              </label>
              <label className="block space-y-1 text-sm">
                <span>Module</span>
                <input
                  value={moduleName}
                  onChange={(event) => setModuleName(event.target.value)}
                  className="w-full rounded-md border border-border bg-background px-3 py-2"
                />
              </label>
            </div>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <label className="block space-y-1 text-sm">
                <span>Locale (optional)</span>
                <select
                  value={locale}
                  onChange={(event) => setLocale(event.target.value as AppLocale | "")}
                  className="w-full rounded-md border border-border bg-background px-3 py-2"
                >
                  <option value="">none</option>
                  <option value="tr">tr</option>
                  <option value="en">en</option>
                </select>
              </label>
              <label className="block space-y-1 text-sm">
                <span>Entity ID (optional)</span>
                <input
                  value={entityId}
                  onChange={(event) => setEntityId(event.target.value)}
                  className="w-full rounded-md border border-border bg-background px-3 py-2"
                />
              </label>
            </div>
            <label className="block space-y-1 text-sm">
              <span>File</span>
              <input
                type="file"
                onChange={(event) => setSelectedFile(event.target.files?.[0] ?? null)}
                className="w-full rounded-md border border-border bg-background px-3 py-2"
              />
            </label>
            <button
              type="button"
              onClick={() => void handleUpload()}
              disabled={uploading}
              className="w-full rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground disabled:opacity-70"
            >
              {uploading ? "Uploading..." : "Upload to storage"}
            </button>
          </div>

          <h4 className="mt-6 text-base font-medium">Browse</h4>
          <div className="mt-2 flex gap-2">
            <input
              value={prefix}
              onChange={(event) => setPrefix(event.target.value)}
              placeholder="prefix (example: images)"
              className="flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm"
            />
            <button
              type="button"
              onClick={() => void loadLibrary()}
              className="rounded-md border border-border px-4 py-2 text-sm hover:bg-muted"
            >
              Refresh
            </button>
          </div>

          {(actionMessage || actionError) && (
            <p
              className={`mt-3 rounded-md px-3 py-2 text-sm ${
                actionError
                  ? "border border-destructive/20 bg-destructive/5 text-destructive"
                  : "border border-primary/20 bg-primary/10 text-primary"
              }`}
            >
              {actionError || actionMessage}
            </p>
          )}
        </div>

        <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
          <h4 className="text-base font-medium">Assets ({items.length})</h4>
          <div className="mt-3 max-h-[520px] space-y-2 overflow-auto pr-1">
            {items.map((item) => (
              <button
                key={item.reference}
                type="button"
                onClick={() => setSelectedItem(item)}
                className={`w-full rounded-md border px-3 py-2 text-left text-sm ${
                  selectedItem?.reference === item.reference
                    ? "border-primary bg-primary/5"
                    : "border-border hover:bg-muted"
                }`}
              >
                <p className="font-medium">{item.name}</p>
                <p className="text-xs text-muted-foreground">
                  {item.path} • {formatSize(item.size)}
                </p>
              </button>
            ))}
            {items.length === 0 && (
              <p className="rounded-md border border-dashed border-border px-3 py-8 text-center text-sm text-muted-foreground">
                No assets found for this prefix/bucket.
              </p>
            )}
          </div>

          {selectedItem && (
            <div className="mt-4 space-y-2 rounded-md border border-border bg-background p-3">
              <p className="text-xs uppercase tracking-[0.1em] text-muted-foreground">
                Reference patterns
              </p>
              <p className="text-xs text-muted-foreground">Public URL</p>
              <textarea
                readOnly
                value={selectedItem.publicUrl ?? "(private object - no public URL)"}
                rows={2}
                className="w-full rounded-md border border-border bg-card px-2 py-1 text-xs"
              />
              <p className="text-xs text-muted-foreground">Storage reference</p>
              <textarea
                readOnly
                value={selectedItem.reference}
                rows={2}
                className="w-full rounded-md border border-border bg-card px-2 py-1 text-xs"
              />
              <button
                type="button"
                onClick={() => void handleDelete(selectedItem)}
                className="rounded-md border border-destructive/40 px-3 py-1.5 text-xs text-destructive hover:bg-destructive/5"
              >
                Delete selected asset
              </button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
