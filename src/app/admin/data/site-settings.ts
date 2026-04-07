import { getSupabaseBrowserClient } from "../../../lib/supabase/browser-client";
import { normalizeInstagramUrl } from "../../../lib/instagram";
import type { AppLocale, SiteSettingsEditorValue, SiteSettingsLocaleValue } from "../types";
import { parseJsonArray, parseJsonObject, stringifyJson, trimOrNull } from "./_helpers";

function createLocaleValue(locale: AppLocale): SiteSettingsLocaleValue {
  return {
    locale,
    siteName: "ANAKORA",
    logoText: "ANAKORA",
    tagline: "",
    contactEmail: "",
    contactPhone: "",
    instagramUrl: "",
    defaultSeoTitle: "",
    defaultSeoDescription: "",
    globalSeoImageUrl: "",
    reservationNotificationEmail: "",
    headerNavigationJson: "[]",
    footerLegalLinksJson: "[]",
    socialLinksJson: "{}",
    notificationSettingsJson: "{}",
    footerNewsletterEnabled: true,
  };
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function validateLinkArray(
  value: unknown[],
  fieldLabel: string,
): Array<{ label: string; href: string }> {
  const parsed: Array<{ label: string; href: string }> = [];

  for (const item of value) {
    if (!item || typeof item !== "object" || Array.isArray(item)) {
      throw new Error(`${fieldLabel} alani sadece nesne ogeleri icermelidir.`);
    }
    const obj = item as Record<string, unknown>;
    const label = typeof obj.label === "string" ? obj.label.trim() : "";
    const href = typeof obj.href === "string" ? obj.href.trim() : "";
    if (!label || !href) {
      throw new Error(`${fieldLabel} ogeleri hem label hem href icermelidir.`);
    }
    parsed.push({ label, href });
  }

  return parsed;
}

export function createEmptySiteSettingsEditorValue(): SiteSettingsEditorValue {
  return {
    tr: createLocaleValue("tr"),
    en: createLocaleValue("en"),
  };
}

export async function getSiteSettingsEditor(): Promise<SiteSettingsEditorValue> {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("site_settings")
    .select(
      "id, locale, site_name, logo_text, tagline, contact_email, contact_phone, instagram_url, default_seo_title, default_seo_description, global_seo_image_url, reservation_notification_email, header_navigation, footer_legal_links, social_links, notification_settings, footer_newsletter_enabled",
    )
    .in("locale", ["tr", "en"]);

  if (error) {
    throw new Error(error.message);
  }

  const base = createEmptySiteSettingsEditorValue();
  for (const row of (data ?? []) as Array<Record<string, unknown>>) {
    const locale = String(row.locale) as AppLocale;
    if (locale !== "tr" && locale !== "en") {
      continue;
    }

    const mapped: SiteSettingsLocaleValue = {
      id: String(row.id),
      locale,
      siteName: String(row.site_name ?? ""),
      logoText: String(row.logo_text ?? ""),
      tagline: String(row.tagline ?? ""),
      contactEmail: String(row.contact_email ?? ""),
      contactPhone: String(row.contact_phone ?? ""),
      instagramUrl: normalizeInstagramUrl(String(row.instagram_url ?? "")) ?? "",
      defaultSeoTitle: String(row.default_seo_title ?? ""),
      defaultSeoDescription: String(row.default_seo_description ?? ""),
      globalSeoImageUrl: String(row.global_seo_image_url ?? ""),
      reservationNotificationEmail: String(row.reservation_notification_email ?? ""),
      headerNavigationJson: stringifyJson(row.header_navigation, "array"),
      footerLegalLinksJson: stringifyJson(row.footer_legal_links, "array"),
      socialLinksJson: stringifyJson(row.social_links, "object"),
      notificationSettingsJson: stringifyJson(row.notification_settings, "object"),
      footerNewsletterEnabled: Boolean(row.footer_newsletter_enabled),
    };

    if (locale === "tr") {
      base.tr = mapped;
    } else {
      base.en = mapped;
    }
  }

  return base;
}

function sanitizeLocaleRow(value: SiteSettingsLocaleValue, adminUserId: string) {
  const contactEmail = value.contactEmail.trim();
  if (contactEmail && !isValidEmail(contactEmail)) {
    throw new Error(`${value.locale.toUpperCase()} iletisim e-postasi gecersiz.`);
  }

  const reservationEmail = value.reservationNotificationEmail.trim();
  if (reservationEmail && !isValidEmail(reservationEmail)) {
    throw new Error(
      `${value.locale.toUpperCase()} rezervasyon bildirim e-postasi gecersiz.`,
    );
  }

  if (!value.siteName.trim()) {
    throw new Error(`${value.locale.toUpperCase()} site adi zorunludur.`);
  }

  const instagramUrlInput = value.instagramUrl.trim();
  const instagramUrl = normalizeInstagramUrl(instagramUrlInput);
  if (instagramUrlInput && !instagramUrl) {
    throw new Error(
      `${value.locale.toUpperCase()} Instagram alani gecersiz. /kullanici, @kullanici, kullanici veya tam URL kullanin.`,
    );
  }

  const headerNavigation = validateLinkArray(
    parseJsonArray(value.headerNavigationJson, `${value.locale.toUpperCase()} header navigation`),
    `${value.locale.toUpperCase()} header navigation`,
  );
  const footerLegalLinks = validateLinkArray(
    parseJsonArray(value.footerLegalLinksJson, `${value.locale.toUpperCase()} footer links`),
    `${value.locale.toUpperCase()} footer links`,
  );

  const socialLinks = parseJsonObject(
    value.socialLinksJson,
    `${value.locale.toUpperCase()} social links`,
  );
  const notificationSettings = parseJsonObject(
    value.notificationSettingsJson,
    `${value.locale.toUpperCase()} notification settings`,
  );

  return {
    locale: value.locale,
    site_name: value.siteName.trim(),
    logo_text: trimOrNull(value.logoText),
    tagline: trimOrNull(value.tagline),
    contact_email: trimOrNull(contactEmail),
    contact_phone: trimOrNull(value.contactPhone),
    instagram_url: instagramUrl,
    default_seo_title: trimOrNull(value.defaultSeoTitle),
    default_seo_description: trimOrNull(value.defaultSeoDescription),
    global_seo_image_url: trimOrNull(value.globalSeoImageUrl),
    reservation_notification_email: trimOrNull(reservationEmail),
    header_navigation: headerNavigation,
    footer_legal_links: footerLegalLinks,
    social_links: socialLinks,
    notification_settings: notificationSettings,
    footer_newsletter_enabled: value.footerNewsletterEnabled,
    updated_by: adminUserId,
  };
}

export async function saveSiteSettings(
  value: SiteSettingsEditorValue,
  adminUserId: string,
): Promise<void> {
  const supabase = getSupabaseBrowserClient();
  const rows = [
    sanitizeLocaleRow(value.tr, adminUserId),
    sanitizeLocaleRow(value.en, adminUserId),
  ];

  const { error } = await supabase
    .from("site_settings")
    .upsert(rows, { onConflict: "locale" });
  if (error) {
    throw new Error(error.message);
  }
}
