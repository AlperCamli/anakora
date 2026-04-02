import { useEffect, useMemo, useState } from "react";
import { AdminImagePreview } from "../components/AdminImagePreview";
import { AdminLocaleCompleteness } from "../components/AdminLocaleCompleteness";
import { AdminRoleGate } from "../components/AdminRoleGate";
import { AdminStateCard } from "../components/AdminStateCard";
import {
  createEmptyTestimonialEditorValue,
  getTestimonialEditorById,
  getTestimonialFormLookups,
  listTestimonials,
  saveTestimonial,
} from "../data/testimonials";
import { useAdminAuth } from "../context/AdminAuthContext";
import type { TestimonialEditorValue, TestimonialListItem } from "../types";

type PublishFilter = "all" | "published" | "draft";

function formatDate(value: string | null) {
  if (!value) {
    return "-";
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }
  return new Intl.DateTimeFormat("tr-TR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(parsed);
}

function hasLocaleContent(authorName: string | null, quote: string | null) {
  return Boolean(authorName?.trim() && quote?.trim());
}

export function AdminTestimonialsPage() {
  return (
    <AdminRoleGate capability="manage_content">
      <TestimonialsContent />
    </AdminRoleGate>
  );
}

function TestimonialsContent() {
  const { user } = useAdminAuth();
  const [items, setItems] = useState<TestimonialListItem[]>([]);
  const [programs, setPrograms] = useState<Array<{ id: string; slug: string; title: string }>>([]);
  const [guides, setGuides] = useState<Array<{ id: string; slug: string; name: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [publishFilter, setPublishFilter] = useState<PublishFilter>("all");
  const [featuredOnly, setFeaturedOnly] = useState(false);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editorValue, setEditorValue] = useState<TestimonialEditorValue>(
    createEmptyTestimonialEditorValue(),
  );
  const [editorLoading, setEditorLoading] = useState(false);
  const [editorError, setEditorError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function run() {
      setLoading(true);
      setError(null);
      try {
        const [{ programs: programOptions, guides: guideOptions }, testimonials] =
          await Promise.all([getTestimonialFormLookups(), listTestimonials()]);
        if (!mounted) {
          return;
        }
        setPrograms(programOptions);
        setGuides(guideOptions);
        setItems(testimonials);
      } catch (fetchError) {
        if (!mounted) {
          return;
        }
        setError(fetchError instanceof Error ? fetchError.message : "Bilinmeyen hata");
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
  }, []);

  const programMap = useMemo(() => {
    return new Map(programs.map((item) => [item.id, item]));
  }, [programs]);

  const filteredItems = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return items.filter((item) => {
      if (publishFilter === "published" && !item.isPublished) {
        return false;
      }
      if (publishFilter === "draft" && item.isPublished) {
        return false;
      }
      if (featuredOnly && !item.isFeatured) {
        return false;
      }
      if (!needle) {
        return true;
      }
      const haystack = [
        item.slug ?? "",
        item.trAuthorName ?? "",
        item.enAuthorName ?? "",
        item.trQuote ?? "",
        item.enQuote ?? "",
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(needle);
    });
  }, [featuredOnly, items, publishFilter, search]);

  function clearEditor() {
    setSelectedId(null);
    setEditorValue(createEmptyTestimonialEditorValue());
    setEditorError(null);
    setSaveError(null);
    setSaveMessage(null);
  }

  async function openEditor(id: string) {
    setEditorLoading(true);
    setEditorError(null);
    setSaveError(null);
    setSaveMessage(null);
    try {
      const value = await getTestimonialEditorById(id);
      setSelectedId(id);
      setEditorValue(value);
    } catch (loadError) {
      setEditorError(loadError instanceof Error ? loadError.message : "Duzenleyici yuklenemedi.");
    } finally {
      setEditorLoading(false);
    }
  }

  function updateField<K extends keyof TestimonialEditorValue>(
    key: K,
    value: TestimonialEditorValue[K],
  ) {
    setEditorValue((prev) => ({ ...prev, [key]: value }));
  }

  function updateTrField<K extends keyof TestimonialEditorValue["tr"]>(
    key: K,
    value: TestimonialEditorValue["tr"][K],
  ) {
    setEditorValue((prev) => ({
      ...prev,
      tr: {
        ...prev.tr,
        [key]: value,
      },
    }));
  }

  function updateEnField<K extends keyof TestimonialEditorValue["en"]>(
    key: K,
    value: TestimonialEditorValue["en"][K],
  ) {
    setEditorValue((prev) => ({
      ...prev,
      en: {
        ...prev.en,
        [key]: value,
      },
    }));
  }

  function toggleProgram(programId: string) {
    setEditorValue((prev) => {
      const has = prev.linkedProgramIds.includes(programId);
      const linkedProgramIds = has
        ? prev.linkedProgramIds.filter((id) => id !== programId)
        : [...prev.linkedProgramIds, programId];
      const primaryProgramId = has && prev.primaryProgramId === programId ? "" : prev.primaryProgramId;
      return {
        ...prev,
        linkedProgramIds,
        primaryProgramId,
      };
    });
  }

  async function refreshListAndKeepSelection(nextSelectedId: string | null) {
    const testimonials = await listTestimonials();
    setItems(testimonials);
    if (!nextSelectedId) {
      return;
    }
    const value = await getTestimonialEditorById(nextSelectedId);
    setSelectedId(nextSelectedId);
    setEditorValue(value);
  }

  async function persist() {
    if (!user) {
      setSaveError("Kimligi dogrulanmis kullanici bulunamadi.");
      return;
    }

    setIsSaving(true);
    setSaveError(null);
    setSaveMessage(null);
    setEditorError(null);

    try {
      const savedId = await saveTestimonial(editorValue);
      setSaveMessage(editorValue.id ? "Yorum guncellendi." : "Yorum olusturuldu.");
      await refreshListAndKeepSelection(savedId);
    } catch (persistError) {
      setSaveError(
        persistError instanceof Error
          ? persistError.message
          : "Yorum kaydedilemedi.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  if (loading) {
    return (
      <AdminStateCard
        title="Yorumlar yukleniyor"
        message="Yorum envanteri ve duzenleyici verileri hazirlaniyor..."
      />
    );
  }

  if (error) {
    return <AdminStateCard title="Yorumlar kullanilamiyor" message={error} tone="error" />;
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h3 className="text-lg font-medium">Yorumlar</h3>
            <p className="text-sm text-muted-foreground">
              Toplam {items.length} yorumdan {filteredItems.length} sonuc.
            </p>
          </div>
          <button
            type="button"
            onClick={clearEditor}
            className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground"
          >
            Yeni yorum
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 rounded-lg border border-border bg-card p-4 shadow-sm md:grid-cols-4">
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Slug, yazar, alinti ara"
          className="rounded-md border border-border bg-background px-3 py-2 text-sm"
        />
        <select
          value={publishFilter}
          onChange={(event) => setPublishFilter(event.target.value as PublishFilter)}
          className="rounded-md border border-border bg-background px-3 py-2 text-sm"
        >
          <option value="all">Tum yayin durumlari</option>
          <option value="published">Sadece yayindakiler</option>
          <option value="draft">Sadece taslaklar</option>
        </select>
        <label className="flex items-center gap-2 rounded-md border border-border bg-background px-3 py-2 text-sm">
          <input
            type="checkbox"
            checked={featuredOnly}
            onChange={(event) => setFeaturedOnly(event.target.checked)}
          />
          Sadece one cikanlar
        </label>
      </div>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-[1.15fr_1fr]">
        <div className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
          <table className="min-w-full divide-y divide-border text-sm">
            <thead className="bg-muted/40 text-left text-xs uppercase tracking-[0.08em] text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Gorsel</th>
                <th className="px-4 py-3">Yazar</th>
                <th className="px-4 py-3">Dil</th>
                <th className="px-4 py-3">Durum</th>
                <th className="px-4 py-3">Program bagi</th>
                <th className="px-4 py-3">Islemler</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredItems.map((item) => (
                <tr key={item.id} className="align-top">
                  <td className="px-4 py-3">
                    <AdminImagePreview
                      src={item.authorImageUrl}
                      alt={`${item.trAuthorName || item.enAuthorName || "Yazar"} gorseli`}
                      className="h-14 w-14 rounded-md border border-border bg-muted/30"
                      imageClassName="h-full w-full rounded-md object-contain p-1"
                      fallbackLabel="Yok"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium">{item.trAuthorName || item.enAuthorName || "-"}</p>
                    <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                      {(item.trQuote || item.enQuote || "-").slice(0, 120)}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      /{item.slug || "slug-yok"} • {formatDate(item.testimonialDate)}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <AdminLocaleCompleteness
                      trComplete={hasLocaleContent(item.trAuthorName, item.trQuote)}
                      enComplete={hasLocaleContent(item.enAuthorName, item.enQuote)}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full px-2 py-1 text-xs ${
                        item.isPublished
                          ? "bg-primary/10 text-primary"
                          : "bg-terracotta/15 text-terracotta"
                      }`}
                    >
                      {item.isPublished ? "yayinda" : "taslak"}
                    </span>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Puan {item.rating}/5
                      {item.isFeatured ? " • one cikan" : ""}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    <p>{item.linkedProgramCount} bagli</p>
                    <p>
                      {item.primaryProgramId
                        ? programMap.get(item.primaryProgramId)?.title ??
                          programMap.get(item.primaryProgramId)?.slug ??
                          "Ana program"
                        : "Ana program yok"}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-xs">
                    <button
                      type="button"
                      onClick={() => void openEditor(item.id)}
                      className="text-primary hover:underline"
                    >
                      Duzenle
                    </button>
                  </td>
                </tr>
              ))}
              {filteredItems.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-sm text-muted-foreground">
                    Secili filtrelere uygun yorum bulunamadi.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h4 className="text-base font-medium">
                {selectedId ? "Yorumu duzenle" : "Yorum olustur"}
              </h4>
              <p className="text-xs text-muted-foreground">
                TR/EN icerik, program baglantisi ve siralama yonetimi.
              </p>
            </div>
            <button
              type="button"
              onClick={clearEditor}
              className="rounded-md border border-border px-3 py-1.5 text-xs hover:bg-muted"
            >
              Sifirla
            </button>
          </div>

          {editorLoading ? (
            <AdminStateCard title="Duzenleyici yukleniyor" message="Yorum verileri hazirlaniyor..." />
          ) : (
            <div className="space-y-3">
              <label className="block space-y-1 text-sm">
                <span>Slug</span>
                <input
                  value={editorValue.slug}
                  onChange={(event) => updateField("slug", event.target.value)}
                  placeholder="topluluk-yorumu-1"
                  className="w-full rounded-md border border-border bg-background px-3 py-2"
                />
              </label>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <label className="block space-y-1 text-sm">
                  <span>Puan (1-5)</span>
                  <input
                    value={editorValue.rating}
                    onChange={(event) => updateField("rating", event.target.value)}
                    className="w-full rounded-md border border-border bg-background px-3 py-2"
                  />
                </label>
                <label className="block space-y-1 text-sm">
                  <span>Sira</span>
                  <input
                    value={editorValue.sortOrder}
                    onChange={(event) => updateField("sortOrder", event.target.value)}
                    className="w-full rounded-md border border-border bg-background px-3 py-2"
                  />
                </label>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <label className="block space-y-1 text-sm">
                  <span>Ana program bagi</span>
                  <select
                    value={editorValue.primaryProgramId}
                    onChange={(event) => updateField("primaryProgramId", event.target.value)}
                    className="w-full rounded-md border border-border bg-background px-3 py-2"
                  >
                    <option value="">Yok</option>
                    {programs.map((program) => (
                      <option key={program.id} value={program.id}>
                        {program.title}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block space-y-1 text-sm">
                  <span>Rehber bagi (opsiyonel)</span>
                  <select
                    value={editorValue.guideId}
                    onChange={(event) => updateField("guideId", event.target.value)}
                    className="w-full rounded-md border border-border bg-background px-3 py-2"
                  >
                    <option value="">Yok</option>
                    {guides.map((guide) => (
                      <option key={guide.id} value={guide.id}>
                        {guide.name}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <label className="block space-y-1 text-sm">
                <span>Yorum tarihi</span>
                <input
                  type="date"
                  value={editorValue.testimonialDate}
                  onChange={(event) => updateField("testimonialDate", event.target.value)}
                  className="w-full rounded-md border border-border bg-background px-3 py-2"
                />
              </label>

              <label className="block space-y-1 text-sm">
                <span>Yazar gorseli URL</span>
                <input
                  value={editorValue.authorImageUrl}
                  onChange={(event) => updateField("authorImageUrl", event.target.value)}
                  placeholder="https://..."
                  className="w-full rounded-md border border-border bg-background px-3 py-2"
                />
              </label>
              <AdminImagePreview
                src={editorValue.authorImageUrl}
                alt="Yazar gorseli onizleme"
                className="h-56 w-full rounded-md border border-border bg-muted/20"
                imageClassName="h-full w-full rounded-md object-contain p-2"
                fallbackLabel="Yazar gorseli onizlemesi yok"
              />

              <div className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
                <label className="flex items-center gap-2 rounded-md border border-border px-3 py-2">
                  <input
                    type="checkbox"
                    checked={editorValue.isPublished}
                    onChange={(event) => updateField("isPublished", event.target.checked)}
                  />
                  Yayinda
                </label>
                <label className="flex items-center gap-2 rounded-md border border-border px-3 py-2">
                  <input
                    type="checkbox"
                    checked={editorValue.isFeatured}
                    onChange={(event) => updateField("isFeatured", event.target.checked)}
                  />
                  One cikan
                </label>
              </div>

              <div className="rounded-md border border-border p-3">
                <p className="text-sm font-medium">Ek bagli programlar</p>
                <p className="text-xs text-muted-foreground">
                  Program detay sayfalari icin opsiyonel capraz baglantilar.
                </p>
                <div className="mt-2 grid grid-cols-1 gap-2">
                  {programs.map((program) => (
                    <label key={program.id} className="flex items-center gap-2 text-xs">
                      <input
                        type="checkbox"
                        checked={editorValue.linkedProgramIds.includes(program.id)}
                        onChange={() => toggleProgram(program.id)}
                      />
                      <span>{program.title}</span>
                    </label>
                  ))}
                </div>
              </div>

              <section className="grid grid-cols-1 gap-3 xl:grid-cols-2">
                <div className="space-y-2 rounded-md border border-border p-3">
                  <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">TR</p>
                  <input
                    value={editorValue.tr.authorName}
                    onChange={(event) => updateTrField("authorName", event.target.value)}
                    placeholder="Yazar adi"
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                  />
                  <input
                    value={editorValue.tr.authorTitle}
                    onChange={(event) => updateTrField("authorTitle", event.target.value)}
                    placeholder="Yazar unvani"
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                  />
                  <textarea
                    value={editorValue.tr.quote}
                    onChange={(event) => updateTrField("quote", event.target.value)}
                    rows={5}
                    placeholder="TR yorum"
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                  />
                </div>

                <div className="space-y-2 rounded-md border border-border p-3">
                  <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">EN</p>
                  <input
                    value={editorValue.en.authorName}
                    onChange={(event) => updateEnField("authorName", event.target.value)}
                    placeholder="Yazar adi"
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                  />
                  <input
                    value={editorValue.en.authorTitle}
                    onChange={(event) => updateEnField("authorTitle", event.target.value)}
                    placeholder="Yazar unvani"
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                  />
                  <textarea
                    value={editorValue.en.quote}
                    onChange={(event) => updateEnField("quote", event.target.value)}
                    rows={5}
                    placeholder="EN yorum"
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                  />
                </div>
              </section>

              {(editorError || saveError || saveMessage) && (
                <p
                  className={`rounded-md px-3 py-2 text-sm ${
                    editorError || saveError
                      ? "border border-destructive/20 bg-destructive/5 text-destructive"
                      : "border border-primary/20 bg-primary/10 text-primary"
                  }`}
                >
                  {editorError || saveError || saveMessage}
                </p>
              )}

              <button
                type="button"
                onClick={() => void persist()}
                disabled={isSaving}
                className="w-full rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground disabled:opacity-70"
              >
                {isSaving ? "Kaydediliyor..." : selectedId ? "Yorumu guncelle" : "Yorum olustur"}
              </button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
