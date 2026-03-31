import { useEffect, useState } from "react";
import { MEDIA_MODULE_LABELS, listMediaObjects, uploadMediaObject } from "../data/media";
import type {
  MediaLibraryItem,
  MediaModule,
  MediaVisibility,
} from "../types";

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

export function AdminImagePicker({
  label,
  module,
  value,
  onChange,
  visibility = "public",
}: {
  label?: string;
  module: MediaModule;
  value: string;
  onChange: (nextValue: string) => void;
  visibility?: MediaVisibility;
}) {
  const [items, setItems] = useState<MediaLibraryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  async function loadItems() {
    setLoading(true);
    setError(null);
    try {
      const rows = await listMediaObjects({
        visibility,
        module,
        limit: 200,
      });
      setItems(rows);
    } catch (fetchError) {
      setError(
        fetchError instanceof Error ? fetchError.message : "Gorseller listelenemedi.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [module, visibility]);

  async function handleUpload() {
    if (!selectedFile) {
      setError("Lutfen once bir dosya secin.");
      return;
    }

    setUploading(true);
    setError(null);
    try {
      const uploaded = await uploadMediaObject({
        visibility,
        module,
        file: selectedFile,
      });
      setSelectedFile(null);
      await loadItems();
      onChange(uploaded.publicUrl ?? uploaded.reference);
    } catch (uploadError) {
      setError(
        uploadError instanceof Error ? uploadError.message : "Dosya yuklenemedi.",
      );
    } finally {
      setUploading(false);
    }
  }

  const selectedValue = value.trim();

  return (
    <div className="space-y-3 rounded-md border border-border p-3">
      {label && <p className="text-sm font-medium">{label}</p>}

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_auto]">
        <input
          type="file"
          accept="image/*"
          onChange={(event) => setSelectedFile(event.target.files?.[0] ?? null)}
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
        />
        <button
          type="button"
          onClick={() => void handleUpload()}
          disabled={uploading}
          className="rounded-md border border-border px-4 py-2 text-sm hover:bg-muted disabled:opacity-70"
        >
          {uploading ? "Yukleniyor..." : "Cihazdan yukle"}
        </button>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-xs uppercase tracking-[0.1em] text-muted-foreground">
          Kutuphane ({MEDIA_MODULE_LABELS[module]})
        </p>
        <button
          type="button"
          onClick={() => void loadItems()}
          className="text-xs text-primary hover:underline"
        >
          Yenile
        </button>
      </div>

      {loading ? (
        <p className="text-xs text-muted-foreground">Gorseller yukleniyor...</p>
      ) : (
        <div className="max-h-52 space-y-2 overflow-auto pr-1">
          {items.map((item) => {
            const candidate = item.publicUrl ?? item.reference;
            const isActive = selectedValue === candidate;
            return (
              <button
                key={item.reference}
                type="button"
                onClick={() => onChange(candidate)}
                className={`w-full rounded-md border px-3 py-2 text-left text-xs ${
                  isActive
                    ? "border-primary bg-primary/5"
                    : "border-border hover:bg-muted"
                }`}
              >
                <p className="font-medium">{item.name}</p>
                <p className="text-muted-foreground">
                  {item.path} • {formatSize(item.size)}
                </p>
              </button>
            );
          })}
          {items.length === 0 && (
            <p className="rounded-md border border-dashed border-border px-3 py-5 text-center text-xs text-muted-foreground">
              {MEDIA_MODULE_LABELS[module]} klasorunde gorsel bulunamadi.
            </p>
          )}
        </div>
      )}

      {selectedValue && (
        <div className="space-y-2 rounded-md border border-border bg-background p-3">
          <div className="flex items-center justify-between">
            <p className="text-xs uppercase tracking-[0.1em] text-muted-foreground">
              Secili gorsel
            </p>
            <button
              type="button"
              onClick={() => onChange("")}
              className="text-xs text-destructive hover:underline"
            >
              Temizle
            </button>
          </div>
          <img
            src={selectedValue}
            alt="Secili gorsel onizleme"
            className="h-40 w-full rounded-md object-cover"
          />
          <p className="break-all text-xs text-muted-foreground">{selectedValue}</p>
        </div>
      )}

      {error && (
        <p className="rounded-md border border-destructive/20 bg-destructive/5 px-3 py-2 text-xs text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
