import { useEffect, useMemo, useState } from "react";
import { AdminLocaleCompleteness } from "../components/AdminLocaleCompleteness";
import { AdminRoleGate } from "../components/AdminRoleGate";
import { AdminStateCard } from "../components/AdminStateCard";
import { useAdminAuth } from "../context/AdminAuthContext";
import {
  getHomepageSectionHint,
  listHomepageSections,
  saveHomepageSections,
} from "../data/homepage";
import type { HomepageSectionEditorValue, HomepageSectionKey } from "../types";

function hasText(value: string) {
  return value.trim().length > 0;
}

function sectionLabel(sectionKey: HomepageSectionKey) {
  return sectionKey.replaceAll("_", " ");
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
        const rows = await listHomepageSections();
        if (!mounted) {
          return;
        }
        setSections(rows);
        setSelectedKey(rows[0]?.key ?? null);
      } catch (fetchError) {
        if (mounted) {
          setError(fetchError instanceof Error ? fetchError.message : "Unknown error");
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

  async function persist() {
    if (!user) {
      setSaveError("Authenticated user could not be resolved.");
      return;
    }

    setSaving(true);
    setSaveError(null);
    setSaveMessage(null);
    try {
      await saveHomepageSections(sections, user.id);
      const refreshed = await listHomepageSections();
      setSections(refreshed);
      setSaveMessage("Homepage sections saved.");
    } catch (persistError) {
      setSaveError(
        persistError instanceof Error ? persistError.message : "Could not save homepage sections.",
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <AdminStateCard
        title="Loading homepage sections"
        message="Preparing structured section configuration..."
      />
    );
  }

  if (error) {
    return <AdminStateCard title="Homepage module unavailable" message={error} tone="error" />;
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-medium">Homepage sections</h3>
            <p className="text-sm text-muted-foreground">
              Manage activation, ordering, localized copy, media, and controlled payload JSON.
            </p>
          </div>
          <button
            type="button"
            onClick={() => void persist()}
            disabled={saving}
            className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground disabled:opacity-70"
          >
            {saving ? "Saving..." : "Save sections"}
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
                <th className="px-4 py-3">Locale</th>
                <th className="px-4 py-3">Status</th>
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
                    <p className="text-xs text-muted-foreground">order {section.tr.sortOrder}</p>
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
                      {section.tr.isActive ? "enabled" : "disabled"}
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
                  <span>Section order</span>
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
                  Enabled section
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
            </div>
          </div>
        ) : (
          <AdminStateCard title="No section selected" message="Select a section from the list." />
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
          placeholder={`${label} title`}
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
        />
        <textarea
          value={value.subtitle}
          onChange={(event) => onChange("subtitle", event.target.value)}
          rows={2}
          placeholder={`${label} subtitle`}
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
        />
        <input
          value={value.mediaUrl}
          onChange={(event) => onChange("mediaUrl", event.target.value)}
          placeholder="Media URL"
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
        />
        <input
          value={value.mediaAlt}
          onChange={(event) => onChange("mediaAlt", event.target.value)}
          placeholder="Media alt text"
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
