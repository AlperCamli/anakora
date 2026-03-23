import { useEffect, useState } from "react";
import { AdminRoleGate } from "../components/AdminRoleGate";
import { AdminStateCard } from "../components/AdminStateCard";
import { useAdminAuth } from "../context/AdminAuthContext";
import {
  createEmptySiteSettingsEditorValue,
  getSiteSettingsEditor,
  saveSiteSettings,
} from "../data/site-settings";
import type { SiteSettingsEditorValue, SiteSettingsLocaleValue } from "../types";

export function AdminSiteSettingsPage() {
  return (
    <AdminRoleGate capability="manage_settings">
      <SiteSettingsContent />
    </AdminRoleGate>
  );
}

function SiteSettingsContent() {
  const { user } = useAdminAuth();
  const [value, setValue] = useState<SiteSettingsEditorValue>(
    createEmptySiteSettingsEditorValue(),
  );
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
        const settings = await getSiteSettingsEditor();
        if (!mounted) {
          return;
        }
        setValue(settings);
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

  function updateLocale(
    locale: "tr" | "en",
    key: keyof SiteSettingsLocaleValue,
    nextValue: SiteSettingsLocaleValue[keyof SiteSettingsLocaleValue],
  ) {
    setValue((prev) => ({
      ...prev,
      [locale]: {
        ...prev[locale],
        [key]: nextValue,
      },
    }));
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
      await saveSiteSettings(value, user.id);
      setSaveMessage("Site settings saved.");
    } catch (persistError) {
      setSaveError(
        persistError instanceof Error ? persistError.message : "Could not save site settings.",
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <AdminStateCard title="Loading site settings" message="Preparing locale settings..." />;
  }
  if (error) {
    return <AdminStateCard title="Site settings unavailable" message={error} tone="error" />;
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-medium">Site settings</h3>
            <p className="text-sm text-muted-foreground">
              Contact info, social links, global SEO defaults, and notification placeholders.
            </p>
          </div>
          <button
            type="button"
            onClick={() => void persist()}
            disabled={saving}
            className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground disabled:opacity-70"
          >
            {saving ? "Saving..." : "Save settings"}
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

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <SiteSettingsLocaleCard
          label="TR"
          value={value.tr}
          onChange={(key, nextValue) => updateLocale("tr", key, nextValue)}
        />
        <SiteSettingsLocaleCard
          label="EN"
          value={value.en}
          onChange={(key, nextValue) => updateLocale("en", key, nextValue)}
        />
      </section>
    </div>
  );
}

function SiteSettingsLocaleCard({
  label,
  value,
  onChange,
}: {
  label: "TR" | "EN";
  value: SiteSettingsLocaleValue;
  onChange: (
    key: keyof SiteSettingsLocaleValue,
    value: SiteSettingsLocaleValue[keyof SiteSettingsLocaleValue],
  ) => void;
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
      <h4 className="text-base font-medium">{label} locale</h4>
      <div className="mt-3 space-y-2">
        <input value={value.siteName} onChange={(event) => onChange("siteName", event.target.value)} placeholder="Site name" className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm" />
        <input value={value.logoText} onChange={(event) => onChange("logoText", event.target.value)} placeholder="Logo text" className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm" />
        <textarea value={value.tagline} onChange={(event) => onChange("tagline", event.target.value)} rows={2} placeholder="Tagline" className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm" />
        <input value={value.contactEmail} onChange={(event) => onChange("contactEmail", event.target.value)} placeholder="Contact email" className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm" />
        <input value={value.contactPhone} onChange={(event) => onChange("contactPhone", event.target.value)} placeholder="Contact phone" className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm" />
        <input value={value.instagramUrl} onChange={(event) => onChange("instagramUrl", event.target.value)} placeholder="Instagram URL" className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm" />
        <input value={value.defaultSeoTitle} onChange={(event) => onChange("defaultSeoTitle", event.target.value)} placeholder="Default SEO title" className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm" />
        <textarea value={value.defaultSeoDescription} onChange={(event) => onChange("defaultSeoDescription", event.target.value)} rows={2} placeholder="Default SEO description" className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm" />
        <input value={value.globalSeoImageUrl} onChange={(event) => onChange("globalSeoImageUrl", event.target.value)} placeholder="Global SEO image URL" className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm" />
        <input value={value.reservationNotificationEmail} onChange={(event) => onChange("reservationNotificationEmail", event.target.value)} placeholder="Reservation notification email" className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm" />
        <label className="flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm">
          <input type="checkbox" checked={value.footerNewsletterEnabled} onChange={(event) => onChange("footerNewsletterEnabled", event.target.checked)} />
          Footer newsletter enabled
        </label>
        <textarea value={value.headerNavigationJson} onChange={(event) => onChange("headerNavigationJson", event.target.value)} rows={4} placeholder='Header navigation JSON (array): [{\"label\":\"...\",\"href\":\"...\"}]' className="w-full rounded-md border border-border bg-background px-3 py-2 font-mono text-xs" />
        <textarea value={value.footerLegalLinksJson} onChange={(event) => onChange("footerLegalLinksJson", event.target.value)} rows={4} placeholder='Footer legal links JSON (array): [{\"label\":\"...\",\"href\":\"...\"}]' className="w-full rounded-md border border-border bg-background px-3 py-2 font-mono text-xs" />
        <textarea value={value.socialLinksJson} onChange={(event) => onChange("socialLinksJson", event.target.value)} rows={4} placeholder='Social links JSON (object): {\"instagram\":\"https://...\"}' className="w-full rounded-md border border-border bg-background px-3 py-2 font-mono text-xs" />
        <textarea value={value.notificationSettingsJson} onChange={(event) => onChange("notificationSettingsJson", event.target.value)} rows={4} placeholder='Notification settings JSON (object): {\"sendBookingEmail\":true}' className="w-full rounded-md border border-border bg-background px-3 py-2 font-mono text-xs" />
      </div>
    </div>
  );
}
