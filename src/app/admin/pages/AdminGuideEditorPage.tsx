import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { useAdminAuth } from "../context/AdminAuthContext";
import {
  createEmptyGuideEditorValue,
  getGuideEditorById,
  getGuideLinkedPrograms,
  saveGuide,
} from "../data/guides";
import type { GuideEditorValue } from "../types";
import { AdminImagePreview } from "../components/AdminImagePreview";
import { AdminStateCard } from "../components/AdminStateCard";

export function AdminGuideEditorPage() {
  const { guideId } = useParams();
  const navigate = useNavigate();
  const { user } = useAdminAuth();

  const isNew = !guideId;

  const [value, setValue] = useState<GuideEditorValue>(createEmptyGuideEditorValue);
  const [linkedPrograms, setLinkedPrograms] = useState<
    Array<{ id: string; slug: string; status: string }>
  >([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function run() {
      setLoading(true);
      setError(null);

      try {
        if (isNew) {
          setValue(createEmptyGuideEditorValue());
          setLinkedPrograms([]);
        } else {
          const [editorValue, links] = await Promise.all([
            getGuideEditorById(guideId),
            getGuideLinkedPrograms(guideId),
          ]);

          if (!mounted) {
            return;
          }
          setValue(editorValue);
          setLinkedPrograms(links);
        }
      } catch (loadError) {
        if (!mounted) {
          return;
        }
        setError(loadError instanceof Error ? loadError.message : "Bilinmeyen hata");
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    void run();
    return () => {
      mounted = false;
    };
  }, [guideId, isNew]);

  function updateField<K extends keyof GuideEditorValue>(
    key: K,
    nextValue: GuideEditorValue[K],
  ) {
    setValue((prev) => ({ ...prev, [key]: nextValue }));
  }

  function updateTrField<K extends keyof GuideEditorValue["tr"]>(
    key: K,
    nextValue: GuideEditorValue["tr"][K],
  ) {
    setValue((prev) => ({
      ...prev,
      tr: {
        ...prev.tr,
        [key]: nextValue,
      },
    }));
  }

  function updateEnField<K extends keyof GuideEditorValue["en"]>(
    key: K,
    nextValue: GuideEditorValue["en"][K],
  ) {
    setValue((prev) => ({
      ...prev,
      en: {
        ...prev.en,
        [key]: nextValue,
      },
    }));
  }

  async function persist() {
    if (!user) {
      setSaveError("Kimligi dogrulanmis kullanici bulunamadi.");
      return;
    }

    setIsSaving(true);
    setSaveError(null);
    setSaveMessage(null);

    try {
      const savedId = await saveGuide(value, user.id);
      setSaveMessage("Rehber kaydedildi.");

      if (isNew || guideId !== savedId) {
        navigate(`/admin/guides/${savedId}`, { replace: true });
      } else {
        const links = await getGuideLinkedPrograms(savedId);
        setLinkedPrograms(links);
      }
    } catch (persistError) {
      setSaveError(
        persistError instanceof Error ? persistError.message : "Rehber kaydedilemedi.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  if (loading) {
    return (
      <AdminStateCard
        title="Rehber duzenleyici yukleniyor"
        message="Profil alanlari ve bagli program kullanimi hazirlaniyor..."
      />
    );
  }

  if (error) {
    return <AdminStateCard title="Rehber duzenleyici hatasi" message={error} tone="error" />;
  }

  return (
    <div className="space-y-5">
      <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h3 className="text-lg font-medium">{isNew ? "Rehber olustur" : "Rehberi duzenle"}</h3>
            <p className="text-sm text-muted-foreground">
              Cift dilli rehber profili icerigini ve program baglantilarini yonetin.
            </p>
          </div>

          <button
            type="button"
            onClick={() => void persist()}
            disabled={isSaving}
            className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground disabled:opacity-70"
          >
            {isSaving ? "Kaydediliyor..." : "Rehberi kaydet"}
          </button>
        </div>

        {(saveMessage || saveError) && (
          <p
            className={`mt-3 rounded-md px-3 py-2 text-sm ${
              saveError
                ? "border border-destructive/20 bg-destructive/5 text-destructive"
                : "border border-primary/20 bg-primary/10 text-primary"
            }`}
          >
            {saveError || saveMessage}
          </p>
        )}
      </div>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
          <h4 className="mb-3 text-base font-medium">Profil Bilgileri</h4>
          <div className="space-y-3">
            <label className="block space-y-1 text-sm">
              <span>Slug</span>
              <input
                value={value.slug}
                onChange={(event) => updateField("slug", event.target.value)}
                placeholder="ayse-yilmaz"
                className="w-full rounded-md border border-border bg-background px-3 py-2"
              />
            </label>

            <label className="block space-y-1 text-sm">
              <span>E-posta</span>
              <input
                value={value.email}
                onChange={(event) => updateField("email", event.target.value)}
                placeholder="guide@anakora.com"
                className="w-full rounded-md border border-border bg-background px-3 py-2"
              />
            </label>

            <label className="block space-y-1 text-sm">
              <span>Instagram kullanici adi</span>
              <input
                value={value.instagramHandle}
                onChange={(event) => updateField("instagramHandle", event.target.value)}
                placeholder="@guide"
                className="w-full rounded-md border border-border bg-background px-3 py-2"
              />
            </label>

            <label className="block space-y-1 text-sm">
              <span>Avatar gorseli URL</span>
              <input
                value={value.avatarUrl}
                onChange={(event) => updateField("avatarUrl", event.target.value)}
                placeholder="https://..."
                className="w-full rounded-md border border-border bg-background px-3 py-2"
              />
            </label>
            <AdminImagePreview
              src={value.avatarUrl}
              alt="Rehber avatar onizleme"
              className="h-56 w-full rounded-md border border-border bg-muted/20"
              imageClassName="h-full w-full rounded-md object-contain p-2"
              fallbackLabel="Avatar onizlemesi yok"
            />

            <div className="flex items-center gap-6 text-sm">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={value.isActive}
                  onChange={(event) => updateField("isActive", event.target.checked)}
                />
                Aktif profil
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={value.isFeatured}
                  onChange={(event) => updateField("isFeatured", event.target.checked)}
                />
                One cikan rehber
              </label>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
          <h4 className="mb-3 text-base font-medium">Bagli Programlar</h4>
          <p className="text-sm text-muted-foreground">
            Bu rehberi ana rehber olarak kullanan programlar.
          </p>
          <div className="mt-3 space-y-2">
            {linkedPrograms.map((program) => (
              <div
                key={program.id}
                className="flex items-center justify-between rounded-md border border-border px-3 py-2 text-sm"
              >
                <div>
                  <p className="font-medium">{program.slug}</p>
                  <p className="text-xs text-muted-foreground">{program.status}</p>
                </div>
                <Link
                  to={`/admin/programs/${program.id}`}
                  className="text-xs text-primary hover:underline"
                >
                  Programi ac
                </Link>
              </div>
            ))}

            {!isNew && linkedPrograms.length === 0 && (
              <p className="rounded-md border border-dashed border-border px-3 py-6 text-center text-sm text-muted-foreground">
                Bu rehbere bagli program yok.
              </p>
            )}

            {isNew && (
              <p className="rounded-md border border-dashed border-border px-3 py-6 text-center text-sm text-muted-foreground">
                Bagli programlari gorebilmek icin once rehberi kaydedin.
              </p>
            )}
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
          <h4 className="mb-3 text-base font-medium">TR Icerik</h4>
          <div className="space-y-3">
            <label className="block space-y-1 text-sm">
              <span>Ad soyad</span>
              <input
                value={value.tr.fullName}
                onChange={(event) => updateTrField("fullName", event.target.value)}
                className="w-full rounded-md border border-border bg-background px-3 py-2"
              />
            </label>
            <label className="block space-y-1 text-sm">
              <span>Unvan</span>
              <input
                value={value.tr.title}
                onChange={(event) => updateTrField("title", event.target.value)}
                className="w-full rounded-md border border-border bg-background px-3 py-2"
              />
            </label>
            <label className="block space-y-1 text-sm">
              <span>Biyografi</span>
              <textarea
                value={value.tr.bio}
                onChange={(event) => updateTrField("bio", event.target.value)}
                rows={8}
                className="w-full rounded-md border border-border bg-background px-3 py-2"
              />
            </label>
          </div>
        </div>

        <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
          <h4 className="mb-3 text-base font-medium">EN Icerik</h4>
          <div className="space-y-3">
            <label className="block space-y-1 text-sm">
              <span>Ad soyad</span>
              <input
                value={value.en.fullName}
                onChange={(event) => updateEnField("fullName", event.target.value)}
                className="w-full rounded-md border border-border bg-background px-3 py-2"
              />
            </label>
            <label className="block space-y-1 text-sm">
              <span>Unvan</span>
              <input
                value={value.en.title}
                onChange={(event) => updateEnField("title", event.target.value)}
                className="w-full rounded-md border border-border bg-background px-3 py-2"
              />
            </label>
            <label className="block space-y-1 text-sm">
              <span>Biyografi</span>
              <textarea
                value={value.en.bio}
                onChange={(event) => updateEnField("bio", event.target.value)}
                rows={8}
                className="w-full rounded-md border border-border bg-background px-3 py-2"
              />
            </label>
          </div>
        </div>
      </section>
    </div>
  );
}
