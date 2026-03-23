import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { useAdminAuth } from "../context/AdminAuthContext";
import {
  createEmptyProgramEditorValue,
  getProgramEditorById,
  getProgramFormLookups,
  getProgramGalleryCount,
  saveProgram,
} from "../data/programs";
import type { ProgramEditorValue, ProgramFaqValue } from "../types";
import { AdminStateCard } from "../components/AdminStateCard";

function normalizeSlug(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function createEmptyFaq(index: number): ProgramFaqValue {
  return {
    sortOrder: index,
    isActive: true,
    trQuestion: "",
    trAnswer: "",
    enQuestion: "",
    enAnswer: "",
  };
}

export function AdminProgramEditorPage() {
  const { programId } = useParams();
  const navigate = useNavigate();
  const { user } = useAdminAuth();

  const isNew = !programId;

  const [value, setValue] = useState<ProgramEditorValue>(createEmptyProgramEditorValue);
  const [guides, setGuides] = useState<Array<{ id: string; name: string; slug: string }>>([]);
  const [categories, setCategories] = useState<
    Array<{ id: string; slug: string; trName: string | null; enName: string | null }>
  >([]);
  const [galleryCount, setGalleryCount] = useState(0);
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
        const lookups = await getProgramFormLookups();
        if (!mounted) {
          return;
        }

        setGuides(lookups.guides);
        setCategories(lookups.categories);

        if (isNew) {
          setValue(createEmptyProgramEditorValue());
          setGalleryCount(0);
        } else {
          const editorValue = await getProgramEditorById(programId);
          if (!mounted) {
            return;
          }
          setValue(editorValue);
          const count = await getProgramGalleryCount(programId);
          if (mounted) {
            setGalleryCount(count);
          }
        }
      } catch (loadError) {
        if (!mounted) {
          return;
        }
        setError(loadError instanceof Error ? loadError.message : "Unknown error");
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
  }, [isNew, programId]);

  const previewSlug = useMemo(() => {
    const source = value.slug || value.tr.title || value.en.title;
    return normalizeSlug(source);
  }, [value.en.title, value.slug, value.tr.title]);

  function updateField<K extends keyof ProgramEditorValue>(
    key: K,
    nextValue: ProgramEditorValue[K],
  ) {
    setValue((prev) => ({ ...prev, [key]: nextValue }));
  }

  function updateTrField<K extends keyof ProgramEditorValue["tr"]>(
    key: K,
    nextValue: ProgramEditorValue["tr"][K],
  ) {
    setValue((prev) => ({
      ...prev,
      tr: {
        ...prev.tr,
        [key]: nextValue,
      },
    }));
  }

  function updateEnField<K extends keyof ProgramEditorValue["en"]>(
    key: K,
    nextValue: ProgramEditorValue["en"][K],
  ) {
    setValue((prev) => ({
      ...prev,
      en: {
        ...prev.en,
        [key]: nextValue,
      },
    }));
  }

  function updateFaq(index: number, patch: Partial<ProgramFaqValue>) {
    setValue((prev) => {
      const nextFaqs = [...prev.faqs];
      nextFaqs[index] = {
        ...nextFaqs[index],
        ...patch,
      };
      return {
        ...prev,
        faqs: nextFaqs,
      };
    });
  }

  function removeFaq(index: number) {
    setValue((prev) => ({
      ...prev,
      faqs: prev.faqs.filter((_, faqIndex) => faqIndex !== index),
    }));
  }

  function toggleCategory(categoryId: string) {
    setValue((prev) => {
      const hasCategory = prev.categoryIds.includes(categoryId);
      return {
        ...prev,
        categoryIds: hasCategory
          ? prev.categoryIds.filter((id) => id !== categoryId)
          : [...prev.categoryIds, categoryId],
      };
    });
  }

  async function persist(nextStatus?: ProgramEditorValue["status"]) {
    if (!user) {
      setSaveError("Authenticated user could not be resolved.");
      return;
    }

    setIsSaving(true);
    setSaveError(null);
    setSaveMessage(null);

    try {
      const payload = {
        ...value,
        status: nextStatus ?? value.status,
      };

      const savedId = await saveProgram(payload, user.id);
      setSaveMessage(
        nextStatus === "published"
          ? "Program published and saved."
          : "Program saved successfully.",
      );

      if (isNew || programId !== savedId) {
        navigate(`/admin/programs/${savedId}`, { replace: true });
      } else {
        updateField("status", payload.status);
        const count = await getProgramGalleryCount(savedId);
        setGalleryCount(count);
      }
    } catch (persistError) {
      setSaveError(
        persistError instanceof Error ? persistError.message : "Could not save program.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  if (loading) {
    return (
      <AdminStateCard
        title="Loading program editor"
        message="Preparing content fields and linked data..."
      />
    );
  }

  if (error) {
    return (
      <AdminStateCard title="Program editor error" message={error} tone="error" />
    );
  }

  return (
    <div className="space-y-5">
      <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h3 className="text-lg font-medium">
              {isNew ? "Create program" : "Edit program"}
            </h3>
            <p className="text-sm text-muted-foreground">
              Structured editorial form with TR/EN translations, FAQs, and operations data.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => void persist()}
              disabled={isSaving}
              className="rounded-md border border-border px-4 py-2 text-sm hover:bg-muted disabled:opacity-70"
            >
              {isSaving ? "Saving..." : "Save changes"}
            </button>
            <button
              type="button"
              onClick={() => void persist("published")}
              disabled={isSaving}
              className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground disabled:opacity-70"
            >
              Publish
            </button>
            {previewSlug && (
              <a
                href={`/deneyimler/${previewSlug}`}
                target="_blank"
                rel="noreferrer"
                className="rounded-md border border-border px-4 py-2 text-sm hover:bg-muted"
              >
                Preview
              </a>
            )}
          </div>
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
          <h4 className="mb-3 text-base font-medium">General</h4>
          <div className="space-y-3">
            <label className="block space-y-1 text-sm">
              <span>Slug</span>
              <input
                value={value.slug}
                onChange={(event) => updateField("slug", event.target.value)}
                placeholder="kapadokya-bahar-deneyimi"
                className="w-full rounded-md border border-border bg-background px-3 py-2"
              />
            </label>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <label className="block space-y-1 text-sm">
                <span>Status</span>
                <select
                  value={value.status}
                  onChange={(event) =>
                    updateField(
                      "status",
                      event.target.value as ProgramEditorValue["status"],
                    )
                  }
                  className="w-full rounded-md border border-border bg-background px-3 py-2"
                >
                  <option value="upcoming">upcoming</option>
                  <option value="published">published</option>
                  <option value="completed">completed</option>
                  <option value="cancelled">cancelled</option>
                </select>
              </label>

              <label className="block space-y-1 text-sm">
                <span>Booking mode</span>
                <select
                  value={value.bookingMode}
                  onChange={(event) =>
                    updateField(
                      "bookingMode",
                      event.target.value as ProgramEditorValue["bookingMode"],
                    )
                  }
                  className="w-full rounded-md border border-border bg-background px-3 py-2"
                >
                  <option value="application">application</option>
                  <option value="direct">direct</option>
                  <option value="external">external</option>
                </select>
              </label>
            </div>

            {value.bookingMode === "external" && (
              <label className="block space-y-1 text-sm">
                <span>External booking URL</span>
                <input
                  value={value.externalBookingUrl}
                  onChange={(event) =>
                    updateField("externalBookingUrl", event.target.value)
                  }
                  placeholder="https://"
                  className="w-full rounded-md border border-border bg-background px-3 py-2"
                />
              </label>
            )}

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <label className="block space-y-1 text-sm">
                <span>Location name</span>
                <input
                  value={value.locationName}
                  onChange={(event) => updateField("locationName", event.target.value)}
                  className="w-full rounded-md border border-border bg-background px-3 py-2"
                />
              </label>

              <label className="block space-y-1 text-sm">
                <span>City</span>
                <input
                  value={value.city}
                  onChange={(event) => updateField("city", event.target.value)}
                  className="w-full rounded-md border border-border bg-background px-3 py-2"
                />
              </label>
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <label className="block space-y-1 text-sm">
                <span>Country code</span>
                <input
                  value={value.countryCode}
                  onChange={(event) => updateField("countryCode", event.target.value)}
                  placeholder="TR"
                  className="w-full rounded-md border border-border bg-background px-3 py-2 uppercase"
                />
              </label>

              <label className="block space-y-1 text-sm">
                <span>Cover image URL</span>
                <input
                  value={value.coverImageUrl}
                  onChange={(event) => updateField("coverImageUrl", event.target.value)}
                  placeholder="https://..."
                  className="w-full rounded-md border border-border bg-background px-3 py-2"
                />
              </label>
            </div>

            <div className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={value.isFeatured}
                onChange={(event) => updateField("isFeatured", event.target.checked)}
              />
              <span>Featured program</span>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
          <h4 className="mb-3 text-base font-medium">Schedule, Pricing, Scope</h4>
          <div className="space-y-3">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <label className="block space-y-1 text-sm">
                <span>Starts at</span>
                <input
                  type="datetime-local"
                  value={value.startsAt}
                  onChange={(event) => updateField("startsAt", event.target.value)}
                  className="w-full rounded-md border border-border bg-background px-3 py-2"
                />
              </label>

              <label className="block space-y-1 text-sm">
                <span>Ends at</span>
                <input
                  type="datetime-local"
                  value={value.endsAt}
                  onChange={(event) => updateField("endsAt", event.target.value)}
                  className="w-full rounded-md border border-border bg-background px-3 py-2"
                />
              </label>
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <label className="block space-y-1 text-sm">
                <span>Duration days</span>
                <input
                  value={value.durationDays}
                  onChange={(event) => updateField("durationDays", event.target.value)}
                  className="w-full rounded-md border border-border bg-background px-3 py-2"
                />
              </label>

              <label className="block space-y-1 text-sm">
                <span>Duration nights</span>
                <input
                  value={value.durationNights}
                  onChange={(event) => updateField("durationNights", event.target.value)}
                  className="w-full rounded-md border border-border bg-background px-3 py-2"
                />
              </label>
            </div>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <label className="block space-y-1 text-sm">
                <span>Price amount</span>
                <input
                  value={value.priceAmount}
                  onChange={(event) => updateField("priceAmount", event.target.value)}
                  className="w-full rounded-md border border-border bg-background px-3 py-2"
                />
              </label>

              <label className="block space-y-1 text-sm">
                <span>Price currency</span>
                <input
                  value={value.priceCurrency}
                  onChange={(event) => updateField("priceCurrency", event.target.value)}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 uppercase"
                />
              </label>
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <label className="block space-y-1 text-sm">
                <span>Capacity</span>
                <input
                  value={value.capacity}
                  onChange={(event) => updateField("capacity", event.target.value)}
                  className="w-full rounded-md border border-border bg-background px-3 py-2"
                />
              </label>

              <label className="block space-y-1 text-sm">
                <span>Spots left</span>
                <input
                  value={value.spotsLeft}
                  onChange={(event) => updateField("spotsLeft", event.target.value)}
                  className="w-full rounded-md border border-border bg-background px-3 py-2"
                />
              </label>
            </div>

            <label className="block space-y-1 text-sm">
              <span>Primary guide</span>
              <select
                value={value.primaryGuideId}
                onChange={(event) => updateField("primaryGuideId", event.target.value)}
                className="w-full rounded-md border border-border bg-background px-3 py-2"
              >
                <option value="">No linked guide</option>
                {guides.map((guide) => (
                  <option key={guide.id} value={guide.id}>
                    {guide.name} ({guide.slug})
                  </option>
                ))}
              </select>
            </label>

            <div className="space-y-2">
              <p className="text-sm">Type / Scope (program categories)</p>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {categories.map((category) => (
                  <label
                    key={category.id}
                    className="flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm"
                  >
                    <input
                      type="checkbox"
                      checked={value.categoryIds.includes(category.id)}
                      onChange={() => toggleCategory(category.id)}
                    />
                    <span>
                      {category.trName || category.enName || category.slug}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
          <h4 className="mb-3 text-base font-medium">TR Content</h4>
          <div className="space-y-3">
            <label className="block space-y-1 text-sm">
              <span>Title</span>
              <input
                value={value.tr.title}
                onChange={(event) => updateTrField("title", event.target.value)}
                className="w-full rounded-md border border-border bg-background px-3 py-2"
              />
            </label>
            <label className="block space-y-1 text-sm">
              <span>Subtitle</span>
              <input
                value={value.tr.subtitle}
                onChange={(event) => updateTrField("subtitle", event.target.value)}
                className="w-full rounded-md border border-border bg-background px-3 py-2"
              />
            </label>
            <label className="block space-y-1 text-sm">
              <span>Summary</span>
              <textarea
                value={value.tr.summary}
                onChange={(event) => updateTrField("summary", event.target.value)}
                rows={3}
                className="w-full rounded-md border border-border bg-background px-3 py-2"
              />
            </label>
            <label className="block space-y-1 text-sm">
              <span>Story markdown</span>
              <textarea
                value={value.tr.storyMarkdown}
                onChange={(event) => updateTrField("storyMarkdown", event.target.value)}
                rows={5}
                className="w-full rounded-md border border-border bg-background px-3 py-2"
              />
            </label>
            <label className="block space-y-1 text-sm">
              <span>Cover image alt</span>
              <input
                value={value.tr.coverImageAlt}
                onChange={(event) => updateTrField("coverImageAlt", event.target.value)}
                className="w-full rounded-md border border-border bg-background px-3 py-2"
              />
            </label>
            <label className="block space-y-1 text-sm">
              <span>Who is it for (one line per item)</span>
              <textarea
                value={value.tr.whoIsItFor}
                onChange={(event) => updateTrField("whoIsItFor", event.target.value)}
                rows={4}
                className="w-full rounded-md border border-border bg-background px-3 py-2"
              />
            </label>
            <label className="block space-y-1 text-sm">
              <span>Itinerary JSON array</span>
              <textarea
                value={value.tr.itineraryJson}
                onChange={(event) => updateTrField("itineraryJson", event.target.value)}
                rows={4}
                className="w-full rounded-md border border-border bg-background px-3 py-2 font-mono text-xs"
              />
            </label>
            <label className="block space-y-1 text-sm">
              <span>Included items (one line per item)</span>
              <textarea
                value={value.tr.includedItems}
                onChange={(event) => updateTrField("includedItems", event.target.value)}
                rows={4}
                className="w-full rounded-md border border-border bg-background px-3 py-2"
              />
            </label>
            <label className="block space-y-1 text-sm">
              <span>Excluded items (one line per item)</span>
              <textarea
                value={value.tr.excludedItems}
                onChange={(event) => updateTrField("excludedItems", event.target.value)}
                rows={4}
                className="w-full rounded-md border border-border bg-background px-3 py-2"
              />
            </label>
            <label className="block space-y-1 text-sm">
              <span>SEO title</span>
              <input
                value={value.tr.seoTitle}
                onChange={(event) => updateTrField("seoTitle", event.target.value)}
                className="w-full rounded-md border border-border bg-background px-3 py-2"
              />
            </label>
            <label className="block space-y-1 text-sm">
              <span>SEO description</span>
              <textarea
                value={value.tr.seoDescription}
                onChange={(event) => updateTrField("seoDescription", event.target.value)}
                rows={3}
                className="w-full rounded-md border border-border bg-background px-3 py-2"
              />
            </label>
          </div>
        </div>

        <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
          <h4 className="mb-3 text-base font-medium">EN Content</h4>
          <div className="space-y-3">
            <label className="block space-y-1 text-sm">
              <span>Title</span>
              <input
                value={value.en.title}
                onChange={(event) => updateEnField("title", event.target.value)}
                className="w-full rounded-md border border-border bg-background px-3 py-2"
              />
            </label>
            <label className="block space-y-1 text-sm">
              <span>Subtitle</span>
              <input
                value={value.en.subtitle}
                onChange={(event) => updateEnField("subtitle", event.target.value)}
                className="w-full rounded-md border border-border bg-background px-3 py-2"
              />
            </label>
            <label className="block space-y-1 text-sm">
              <span>Summary</span>
              <textarea
                value={value.en.summary}
                onChange={(event) => updateEnField("summary", event.target.value)}
                rows={3}
                className="w-full rounded-md border border-border bg-background px-3 py-2"
              />
            </label>
            <label className="block space-y-1 text-sm">
              <span>Story markdown</span>
              <textarea
                value={value.en.storyMarkdown}
                onChange={(event) => updateEnField("storyMarkdown", event.target.value)}
                rows={5}
                className="w-full rounded-md border border-border bg-background px-3 py-2"
              />
            </label>
            <label className="block space-y-1 text-sm">
              <span>Cover image alt</span>
              <input
                value={value.en.coverImageAlt}
                onChange={(event) => updateEnField("coverImageAlt", event.target.value)}
                className="w-full rounded-md border border-border bg-background px-3 py-2"
              />
            </label>
            <label className="block space-y-1 text-sm">
              <span>Who is it for (one line per item)</span>
              <textarea
                value={value.en.whoIsItFor}
                onChange={(event) => updateEnField("whoIsItFor", event.target.value)}
                rows={4}
                className="w-full rounded-md border border-border bg-background px-3 py-2"
              />
            </label>
            <label className="block space-y-1 text-sm">
              <span>Itinerary JSON array</span>
              <textarea
                value={value.en.itineraryJson}
                onChange={(event) => updateEnField("itineraryJson", event.target.value)}
                rows={4}
                className="w-full rounded-md border border-border bg-background px-3 py-2 font-mono text-xs"
              />
            </label>
            <label className="block space-y-1 text-sm">
              <span>Included items (one line per item)</span>
              <textarea
                value={value.en.includedItems}
                onChange={(event) => updateEnField("includedItems", event.target.value)}
                rows={4}
                className="w-full rounded-md border border-border bg-background px-3 py-2"
              />
            </label>
            <label className="block space-y-1 text-sm">
              <span>Excluded items (one line per item)</span>
              <textarea
                value={value.en.excludedItems}
                onChange={(event) => updateEnField("excludedItems", event.target.value)}
                rows={4}
                className="w-full rounded-md border border-border bg-background px-3 py-2"
              />
            </label>
            <label className="block space-y-1 text-sm">
              <span>SEO title</span>
              <input
                value={value.en.seoTitle}
                onChange={(event) => updateEnField("seoTitle", event.target.value)}
                className="w-full rounded-md border border-border bg-background px-3 py-2"
              />
            </label>
            <label className="block space-y-1 text-sm">
              <span>SEO description</span>
              <textarea
                value={value.en.seoDescription}
                onChange={(event) => updateEnField("seoDescription", event.target.value)}
                rows={3}
                className="w-full rounded-md border border-border bg-background px-3 py-2"
              />
            </label>
          </div>
        </div>
      </section>

      <section className="rounded-lg border border-border bg-card p-4 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <h4 className="text-base font-medium">FAQs (TR/EN)</h4>
          <button
            type="button"
            onClick={() =>
              updateField("faqs", [...value.faqs, createEmptyFaq(value.faqs.length)])
            }
            className="rounded-md border border-border px-3 py-2 text-sm hover:bg-muted"
          >
            Add FAQ
          </button>
        </div>

        <div className="space-y-3">
          {value.faqs.map((faq, index) => (
            <div key={index} className="rounded-md border border-border p-3">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-sm font-medium">FAQ #{index + 1}</p>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 text-xs text-muted-foreground">
                    <input
                      type="checkbox"
                      checked={faq.isActive}
                      onChange={(event) =>
                        updateFaq(index, { isActive: event.target.checked })
                      }
                    />
                    Active
                  </label>
                  <button
                    type="button"
                    onClick={() => removeFaq(index)}
                    className="text-xs text-destructive hover:underline"
                  >
                    Remove
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                <div className="space-y-2">
                  <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">TR</p>
                  <input
                    value={faq.trQuestion}
                    onChange={(event) =>
                      updateFaq(index, { trQuestion: event.target.value })
                    }
                    placeholder="TR question"
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                  />
                  <textarea
                    value={faq.trAnswer}
                    onChange={(event) =>
                      updateFaq(index, { trAnswer: event.target.value })
                    }
                    placeholder="TR answer"
                    rows={3}
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                  />
                </div>

                <div className="space-y-2">
                  <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">EN</p>
                  <input
                    value={faq.enQuestion}
                    onChange={(event) =>
                      updateFaq(index, { enQuestion: event.target.value })
                    }
                    placeholder="EN question"
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                  />
                  <textarea
                    value={faq.enAnswer}
                    onChange={(event) =>
                      updateFaq(index, { enAnswer: event.target.value })
                    }
                    placeholder="EN answer"
                    rows={3}
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                  />
                </div>
              </div>
            </div>
          ))}

          {value.faqs.length === 0 && (
            <p className="rounded-md border border-dashed border-border px-3 py-6 text-center text-sm text-muted-foreground">
              No FAQ items yet.
            </p>
          )}
        </div>
      </section>

      <section className="rounded-lg border border-border bg-card p-4 shadow-sm">
        <h4 className="text-base font-medium">Gallery management hook</h4>
        <p className="mt-1 text-sm text-muted-foreground">
          {isNew
            ? "Save the program first to enable gallery item management."
            : `This program currently has ${galleryCount} gallery item(s). Full gallery CRUD can be added on top of program_gallery_items from this hook.`}
        </p>
        <div className="mt-3 flex items-center gap-2">
          <Link
            to="/admin/media"
            className="rounded-md border border-border px-3 py-2 text-sm hover:bg-muted"
          >
            Open media module placeholder
          </Link>
          {!isNew && (
            <span className="text-xs text-muted-foreground">
              Program ID: {programId}
            </span>
          )}
        </div>
      </section>
    </div>
  );
}
