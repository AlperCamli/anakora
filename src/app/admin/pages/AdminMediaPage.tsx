import { useEffect, useState } from "react";
import { AdminImagePreview } from "../components/AdminImagePreview";
import { AdminRoleGate } from "../components/AdminRoleGate";
import { AdminStateCard } from "../components/AdminStateCard";
import {
  getMediaPreviewUrl,
  MEDIA_MODULE_LABELS,
  MEDIA_MODULES,
  getBucketForVisibility,
  listMediaObjects,
  removeMediaObject,
  uploadMediaObject,
} from "../data/media";
import type { MediaLibraryItem, MediaModule, MediaVisibility } from "../types";

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
  const [moduleName, setModuleName] = useState<MediaModule>("journal");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const [items, setItems] = useState<MediaLibraryItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<MediaLibraryItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [selectedPreviewUrl, setSelectedPreviewUrl] = useState<string | null>(null);
  const [selectedPreviewError, setSelectedPreviewError] = useState<string | null>(null);

  async function loadLibrary() {
    setLoading(true);
    setError(null);
    try {
      const rows = await listMediaObjects({
        visibility,
        module: moduleName,
        limit: 200,
      });
      setItems(rows);
      if (rows.length === 0) {
        setSelectedItem(null);
      } else if (!selectedItem) {
        setSelectedItem(rows[0]);
      }
    } catch (fetchError) {
      setError(fetchError instanceof Error ? fetchError.message : "Bilinmeyen hata");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadLibrary();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visibility, moduleName]);

  useEffect(() => {
    let mounted = true;

    async function run() {
      if (!selectedItem) {
        setSelectedPreviewUrl(null);
        setSelectedPreviewError(null);
        return;
      }

      setSelectedPreviewUrl(null);
      setSelectedPreviewError(null);
      try {
        const previewUrl = await getMediaPreviewUrl({
          visibility,
          item: selectedItem,
        });
        if (!mounted) {
          return;
        }
        setSelectedPreviewUrl(previewUrl);
      } catch (previewError) {
        if (!mounted) {
          return;
        }
        setSelectedPreviewError(
          previewError instanceof Error
            ? previewError.message
            : "Onizleme URL'i olusturulamadi.",
        );
      }
    }

    void run();
    return () => {
      mounted = false;
    };
  }, [selectedItem, visibility]);

  async function handleUpload() {
    if (!selectedFile) {
      setActionError("Lutfen once dosya secin.");
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
      });
      setActionMessage("Dosya basariyla yuklendi.");
      setSelectedFile(null);
      await loadLibrary();
      setSelectedItem(uploaded);
    } catch (uploadError) {
      setActionError(uploadError instanceof Error ? uploadError.message : "Yukleme basarisiz.");
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(item: MediaLibraryItem) {
    setActionError(null);
    setActionMessage(null);
    try {
      await removeMediaObject(item.reference);
      setActionMessage("Varlik silindi.");
      await loadLibrary();
    } catch (deleteError) {
      setActionError(deleteError instanceof Error ? deleteError.message : "Silme islemi basarisiz.");
    }
  }

  if (loading) {
    return <AdminStateCard title="Medya kutuphanesi yukleniyor" message="Depolama dosyalari okunuyor..." />;
  }

  if (error) {
    return <AdminStateCard title="Medya modulu kullanilamiyor" message={error} tone="error" />;
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
        <h3 className="text-lg font-medium">Medya kutuphanesi</h3>
        <p className="text-sm text-muted-foreground">
          Yeni yukleme yolu:
          <code className="ml-1 rounded bg-muted px-1.5 py-0.5 text-xs">
            images/&lt;module&gt;/&lt;unique&gt;.&lt;ext&gt;
          </code>
        </p>
        <p className="mt-2 text-xs text-muted-foreground">
          Not: Eski derin klasor yapisindaki dosyalar da module gore listelenmeye devam eder.
        </p>
      </div>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-[0.95fr_1.05fr]">
        <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
          <h4 className="text-base font-medium">Yukle</h4>
          <div className="mt-3 space-y-2">
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <label className="block space-y-1 text-sm">
                <span>Gorunurluk</span>
                <select
                  value={visibility}
                  onChange={(event) => setVisibility(event.target.value as MediaVisibility)}
                  className="w-full rounded-md border border-border bg-background px-3 py-2"
                >
                  <option value="public">Herkese acik ({getBucketForVisibility("public")})</option>
                  <option value="private">Sadece admin ({getBucketForVisibility("private")})</option>
                </select>
              </label>
              <label className="block space-y-1 text-sm">
                <span>Modul</span>
                <select
                  value={moduleName}
                  onChange={(event) => setModuleName(event.target.value as MediaModule)}
                  className="w-full rounded-md border border-border bg-background px-3 py-2"
                >
                  {MEDIA_MODULES.map((module) => (
                    <option key={module} value={module}>
                      {MEDIA_MODULE_LABELS[module]}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <label className="block space-y-1 text-sm">
              <span>Dosya</span>
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
              {uploading ? "Yukleniyor..." : "Kutuphaneye yukle"}
            </button>
          </div>

          <h4 className="mt-6 text-base font-medium">Listele</h4>
          <div className="mt-2 flex gap-2">
            <button
              type="button"
              onClick={() => void loadLibrary()}
              className="rounded-md border border-border px-4 py-2 text-sm hover:bg-muted"
            >
              Yenile
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
          <h4 className="text-base font-medium">
            Varliklar ({MEDIA_MODULE_LABELS[moduleName]}) • {items.length}
          </h4>
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
                <div className="flex items-center gap-3">
                  <AdminImagePreview
                    src={visibility === "public" ? item.publicUrl : null}
                    alt={`${item.name} onizleme`}
                    className="h-14 w-14 shrink-0 rounded-md border border-border bg-muted/30"
                    imageClassName="h-full w-full rounded-md object-contain p-1"
                    fallbackLabel={visibility === "public" ? "Gorsel yok" : "Ozel"}
                  />
                  <div className="min-w-0">
                    <p className="truncate font-medium">{item.name}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {item.path} • {formatSize(item.size)}
                    </p>
                  </div>
                </div>
              </button>
            ))}
            {items.length === 0 && (
              <p className="rounded-md border border-dashed border-border px-3 py-8 text-center text-sm text-muted-foreground">
                {MEDIA_MODULE_LABELS[moduleName]} modulunde varlik bulunamadi.
              </p>
            )}
          </div>

          {selectedItem && (
            <div className="mt-4 space-y-2 rounded-md border border-border bg-background p-3">
              <AdminImagePreview
                src={selectedPreviewUrl}
                alt={`${selectedItem.name} onizleme`}
                className="h-56 w-full rounded-md border border-border bg-muted/20"
                imageClassName="h-full w-full rounded-md object-contain p-2"
                fallbackLabel="Onizleme gorseli yok"
              />
              {selectedPreviewError && (
                <p className="rounded-md border border-destructive/20 bg-destructive/5 px-3 py-2 text-xs text-destructive">
                  {selectedPreviewError}
                </p>
              )}
              <p className="text-xs uppercase tracking-[0.1em] text-muted-foreground">
                Referans bicimleri
              </p>
              <p className="text-xs text-muted-foreground">Herkese acik URL</p>
              <textarea
                readOnly
                value={selectedItem.publicUrl ?? "(Sadece admin nesnesi - herkese acik URL yok)"}
                rows={2}
                className="w-full rounded-md border border-border bg-card px-2 py-1 text-xs"
              />
              <p className="text-xs text-muted-foreground">Depolama referansi</p>
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
                Secili varligi sil
              </button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
