import { useEffect, useMemo, useState } from "react";
import { AdminImagePicker } from "../components/AdminImagePicker";
import { AdminLocaleCompleteness } from "../components/AdminLocaleCompleteness";
import { AdminRoleGate } from "../components/AdminRoleGate";
import { AdminStateCard } from "../components/AdminStateCard";
import { useAdminAuth } from "../context/AdminAuthContext";
import {
  createEmptyHomepageTrustedOrganization,
  getHomepageSectionHint,
  listHomepageSections,
  listHomepageTrustedOrganizations,
  saveHomepageTrustedOrganizations,
  saveHomepageSections,
} from "../data/homepage";
import type {
  HomepageSectionEditorValue,
  HomepageSectionKey,
  HomepageTrustedOrganizationEditorValue,
} from "../types";

function hasText(value: string) {
  return value.trim().length > 0;
}

const SECTION_LABELS: Record<HomepageSectionKey, string> = {
  hero: "Hero",
  brand_manifesto: "Marka Manifestosu",
  experience_categories: "Deneyim Kategorileri",
  upcoming_programs: "Yaklasan Programlar",
  why_anakora: "Neden Anakora",
  archive_preview: "Arsiv Onizleme",
  testimonials: "Yorumlar",
  journal_preview: "Jurnal Onizleme",
  final_cta: "Final CTA",
};

function sectionLabel(sectionKey: HomepageSectionKey) {
  return SECTION_LABELS[sectionKey];
}

function normalizeTrustedOrganizationSort(
  items: HomepageTrustedOrganizationEditorValue[],
) {
  return items.map((item, index) => ({
    ...item,
    sortOrder: String((index + 1) * 10),
  }));
}

export function AdminHomepagePage() {
  return (
    <AdminRoleGate capability="manage_content">
      <HomepageContent />
    </AdminRoleGate>
  );
}

function HomepageContent() {
  const { user } = useAdminAuth();
  const [sections, setSections] = useState<HomepageSectionEditorValue[]>([]);
  const [trustedOrganizations, setTrustedOrganizations] = useState<
    HomepageTrustedOrganizationEditorValue[]
  >([]);
  const [draggedTrustedIndex, setDraggedTrustedIndex] = useState<number | null>(
    null,
  );
  const [selectedKey, setSelectedKey] = useState<HomepageSectionKey | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    async function run() {
      setLoading(true);
      setError(null);
      try {
        const [rows, trustedRows] = await Promise.all([
          listHomepageSections(),
          listHomepageTrustedOrganizations(),
        ]);
        if (!mounted) {
          return;
        }
        setSections(rows);
        setTrustedOrganizations(normalizeTrustedOrganizationSort(trustedRows));
        setSelectedKey(rows[0]?.key ?? null);
      } catch (fetchError) {
        if (mounted) {
          setError(fetchError instanceof Error ? fetchError.message : "Bilinmeyen hata");
        }
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

  const selectedSection = useMemo(() => {
    return sections.find((section) => section.key === selectedKey) ?? null;
  }, [sections, selectedKey]);

  function updateSection(
    key: HomepageSectionKey,
    updater: (current: HomepageSectionEditorValue) => HomepageSectionEditorValue,
  ) {
    setSections((prev) => prev.map((section) => (section.key === key ? updater(section) : section)));
  }

  function addTrustedOrganization() {
    setTrustedOrganizations((prev) =>
      normalizeTrustedOrganizationSort([
        ...prev,
        createEmptyHomepageTrustedOrganization((prev.length + 1) * 10),
      ]),
    );
  }

  function updateTrustedOrganization(
    index: number,
    updater: (
      current: HomepageTrustedOrganizationEditorValue,
    ) => HomepageTrustedOrganizationEditorValue,
  ) {
    setTrustedOrganizations((prev) =>
      normalizeTrustedOrganizationSort(
        prev.map((item, currentIndex) =>
          currentIndex === index ? updater(item) : item,
        ),
      ),
    );
  }

  function removeTrustedOrganization(index: number) {
    setTrustedOrganizations((prev) =>
      normalizeTrustedOrganizationSort(
        prev.filter((_, currentIndex) => currentIndex !== index),
      ),
    );
  }

  function moveTrustedOrganization(fromIndex: number, toIndex: number) {
    setTrustedOrganizations((prev) => {
      if (
        fromIndex === toIndex ||
        fromIndex < 0 ||
        toIndex < 0 ||
        fromIndex >= prev.length ||
        toIndex >= prev.length
      ) {
        return prev;
      }

      const next = [...prev];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      return normalizeTrustedOrganizationSort(next);
    });
  }

  async function persist() {
    if (!user) {
      setSaveError("Kimligi dogrulanmis kullanici bulunamadi.");
      return;
    }

    setSaving(true);
    setSaveError(null);
    setSaveMessage(null);
    try {
      await Promise.all([
        saveHomepageSections(sections, user.id),
        saveHomepageTrustedOrganizations(trustedOrganizations, user.id),
      ]);
      const [refreshed, refreshedTrusted] = await Promise.all([
        listHomepageSections(),
        listHomepageTrustedOrganizations(),
      ]);
      setSections(refreshed);
      setTrustedOrganizations(normalizeTrustedOrganizationSort(refreshedTrusted));
      setSaveMessage("Anasayfa bolumleri ve guvenilen kurumlar kaydedildi.");
    } catch (persistError) {
      setSaveError(
        persistError instanceof Error
          ? persistError.message
          : "Anasayfa verisi kaydedilemedi.",
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <AdminStateCard
        title="Anasayfa bolumleri yukleniyor"
        message="Yapilandirilmis bolum ayarlari hazirlaniyor..."
      />
    );
  }

  if (error) {
    return <AdminStateCard title="Anasayfa modulu kullanilamiyor" message={error} tone="error" />;
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-medium">Anasayfa bolumleri</h3>
            <p className="text-sm text-muted-foreground">
              Aktiflik, sira, lokalize metinler, medya, payload JSON ve guvenilen kurum logolari.
            </p>
          </div>
          <button
            type="button"
            onClick={() => void persist()}
            disabled={saving}
            className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground disabled:opacity-70"
          >
            {saving ? "Kaydediliyor..." : "Bolumleri kaydet"}
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

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
          <table className="min-w-full divide-y divide-border text-sm">
            <thead className="bg-muted/40 text-left text-xs uppercase tracking-[0.08em] text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Section</th>
                <th className="px-4 py-3">Dil</th>
                <th className="px-4 py-3">Durum</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {sections.map((section) => (
                <tr
                  key={section.key}
                  className={`cursor-pointer align-top ${selectedKey === section.key ? "bg-primary/5" : "hover:bg-muted/40"}`}
                  onClick={() => setSelectedKey(section.key)}
                >
                  <td className="px-4 py-3">
                    <p className="font-medium capitalize">{sectionLabel(section.key)}</p>
                    <p className="text-xs text-muted-foreground">sira {section.tr.sortOrder}</p>
                  </td>
                  <td className="px-4 py-3">
                    <AdminLocaleCompleteness
                      trComplete={hasText(section.tr.title) || hasText(section.tr.subtitle)}
                      enComplete={hasText(section.en.title) || hasText(section.en.subtitle)}
                    />
                  </td>
                  <td className="px-4 py-3 text-xs">
                    <span
                      className={`rounded-full px-2 py-1 ${
                        section.tr.isActive
                          ? "bg-primary/10 text-primary"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {section.tr.isActive ? "aktif" : "pasif"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {selectedSection ? (
          <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
            <h4 className="text-base font-medium capitalize">{sectionLabel(selectedSection.key)}</h4>
            <p className="mt-1 text-xs text-muted-foreground">
              {getHomepageSectionHint(selectedSection.key)}
            </p>
            <div className="mt-3 space-y-3">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <label className="block space-y-1 text-sm">
                  <span>Bolum sirasi</span>
                  <input
                    value={selectedSection.tr.sortOrder}
                    onChange={(event) =>
                      updateSection(selectedSection.key, (current) => ({
                        ...current,
                        tr: { ...current.tr, sortOrder: event.target.value },
                        en: { ...current.en, sortOrder: event.target.value },
                      }))
                    }
                    className="w-full rounded-md border border-border bg-background px-3 py-2"
                  />
                </label>
                <label className="flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm">
                  <input
                    type="checkbox"
                    checked={selectedSection.tr.isActive}
                    onChange={(event) =>
                      updateSection(selectedSection.key, (current) => ({
                        ...current,
                        tr: { ...current.tr, isActive: event.target.checked },
                        en: { ...current.en, isActive: event.target.checked },
                      }))
                    }
                  />
                  Bolum aktif
                </label>
              </div>

              <SectionLocaleEditor
                label="TR"
                value={selectedSection.tr}
                onChange={(key, value) =>
                  updateSection(selectedSection.key, (current) => ({
                    ...current,
                    tr: { ...current.tr, [key]: value },
                  }))
                }
              />

              <SectionLocaleEditor
                label="EN"
                value={selectedSection.en}
                onChange={(key, value) =>
                  updateSection(selectedSection.key, (current) => ({
                    ...current,
                    en: { ...current.en, [key]: value },
                  }))
                }
              />

              {selectedSection.key === "brand_manifesto" && (
                <TrustedOrganizationsEditor
                  items={trustedOrganizations}
                  draggedIndex={draggedTrustedIndex}
                  onAdd={addTrustedOrganization}
                  onUpdate={updateTrustedOrganization}
                  onRemove={removeTrustedOrganization}
                  onDragStart={(index) => setDraggedTrustedIndex(index)}
                  onDragCancel={() => setDraggedTrustedIndex(null)}
                  onDrop={(targetIndex) => {
                    if (draggedTrustedIndex === null) {
                      return;
                    }
                    moveTrustedOrganization(draggedTrustedIndex, targetIndex);
                    setDraggedTrustedIndex(null);
                  }}
                />
              )}
            </div>
          </div>
        ) : (
          <AdminStateCard title="Bolum secilmedi" message="Listeden bir bolum secin." />
        )}
      </section>
    </div>
  );
}

function SectionLocaleEditor({
  label,
  value,
  onChange,
}: {
  label: string;
  value: HomepageSectionEditorValue["tr"];
  onChange: (
    key: keyof HomepageSectionEditorValue["tr"],
    value: HomepageSectionEditorValue["tr"][keyof HomepageSectionEditorValue["tr"]],
  ) => void;
}) {
  return (
    <div className="rounded-md border border-border p-3">
      <p className="mb-2 text-xs uppercase tracking-[0.12em] text-muted-foreground">{label}</p>
      <div className="space-y-2">
        <input
          value={value.title}
          onChange={(event) => onChange("title", event.target.value)}
          placeholder={`${label} baslik`}
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
        />
        <textarea
          value={value.subtitle}
          onChange={(event) => onChange("subtitle", event.target.value)}
          rows={2}
          placeholder={`${label} alt baslik`}
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
        />
        <input
          value={value.mediaUrl}
          onChange={(event) => onChange("mediaUrl", event.target.value)}
          placeholder="Medya URL"
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
        />
        <input
          value={value.mediaAlt}
          onChange={(event) => onChange("mediaAlt", event.target.value)}
          placeholder="Medya alt metin"
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
        />
        <textarea
          value={value.payloadJson}
          onChange={(event) => onChange("payloadJson", event.target.value)}
          rows={6}
          placeholder="Payload JSON"
          className="w-full rounded-md border border-border bg-background px-3 py-2 font-mono text-xs"
        />
      </div>
    </div>
  );
}

function TrustedOrganizationsEditor({
  items,
  draggedIndex,
  onAdd,
  onUpdate,
  onRemove,
  onDragStart,
  onDragCancel,
  onDrop,
}: {
  items: HomepageTrustedOrganizationEditorValue[];
  draggedIndex: number | null;
  onAdd: () => void;
  onUpdate: (
    index: number,
    updater: (
      current: HomepageTrustedOrganizationEditorValue,
    ) => HomepageTrustedOrganizationEditorValue,
  ) => void;
  onRemove: (index: number) => void;
  onDragStart: (index: number) => void;
  onDragCancel: () => void;
  onDrop: (targetIndex: number) => void;
}) {
  return (
    <div className="rounded-md border border-border p-3">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium">Guvenilen kurum logolari</p>
          <p className="text-xs text-muted-foreground">
            En az 5 aktif logo oldugunda anasayfada marquee otomatik kayar.
          </p>
        </div>
        <button
          type="button"
          onClick={onAdd}
          className="rounded-md border border-border px-3 py-1.5 text-xs hover:bg-muted"
        >
          Kurum ekle
        </button>
      </div>

      <div className="space-y-3">
        {items.map((item, index) => (
          <div
            key={item.id ?? `trusted-org-${index}`}
            onDragOver={(event) => {
              event.preventDefault();
            }}
            onDrop={(event) => {
              event.preventDefault();
              onDrop(index);
            }}
            className={`rounded-md border p-3 ${
              draggedIndex === index
                ? "border-primary bg-primary/5"
                : "border-border bg-background"
            }`}
          >
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  draggable
                  onDragStart={() => onDragStart(index)}
                  onDragEnd={onDragCancel}
                  className="cursor-grab rounded-md border border-border px-2 py-1 text-xs text-muted-foreground active:cursor-grabbing"
                >
                  Surukle
                </button>
                <span className="text-xs text-muted-foreground">
                  Sira: {item.sortOrder}
                </span>
              </div>
              <button
                type="button"
                onClick={() => onRemove(index)}
                className="rounded-md border border-destructive/40 px-2.5 py-1 text-xs text-destructive hover:bg-destructive/5"
              >
                Kaldir
              </button>
            </div>

            <div className="space-y-2">
              <label className="block space-y-1 text-sm">
                <span>Kurum adi</span>
                <input
                  value={item.organizationName}
                  onChange={(event) =>
                    onUpdate(index, (current) => ({
                      ...current,
                      organizationName: event.target.value,
                    }))
                  }
                  placeholder="Kurum adi"
                  className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm"
                />
              </label>

              <AdminImagePicker
                label="Logo gorseli"
                module="logo"
                value={item.logoUrl}
                onChange={(nextValue) =>
                  onUpdate(index, (current) => ({
                    ...current,
                    logoUrl: nextValue,
                  }))
                }
              />

              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <label className="block space-y-1 text-sm">
                  <span>Logo alt metni (opsiyonel)</span>
                  <input
                    value={item.logoAlt}
                    onChange={(event) =>
                      onUpdate(index, (current) => ({
                        ...current,
                        logoAlt: event.target.value,
                      }))
                    }
                    placeholder="Logo aciklama"
                    className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm"
                  />
                </label>
                <label className="block space-y-1 text-sm">
                  <span>Web sitesi URL (opsiyonel)</span>
                  <input
                    value={item.websiteUrl}
                    onChange={(event) =>
                      onUpdate(index, (current) => ({
                        ...current,
                        websiteUrl: event.target.value,
                      }))
                    }
                    placeholder="https://..."
                    className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm"
                  />
                </label>
              </div>

              <label className="flex items-center gap-2 rounded-md border border-border bg-card px-3 py-2 text-sm">
                <input
                  type="checkbox"
                  checked={item.isActive}
                  onChange={(event) =>
                    onUpdate(index, (current) => ({
                      ...current,
                      isActive: event.target.checked,
                    }))
                  }
                />
                Aktif
              </label>
            </div>
          </div>
        ))}

        {items.length === 0 && (
          <p className="rounded-md border border-dashed border-border px-3 py-6 text-center text-sm text-muted-foreground">
            Henuz kurum eklenmedi.
          </p>
        )}
      </div>
    </div>
  );
}
