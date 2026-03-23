import type { SiteSettingsRow } from "../db-rows";
import type { LayoutDTO, LinkDTO, Locale } from "../types";
import { asArray } from "../utils";

function isLinkDTO(value: unknown): value is LinkDTO {
  if (!value || typeof value !== "object") {
    return false;
  }
  const v = value as Record<string, unknown>;
  return typeof v.label === "string" && typeof v.href === "string";
}

export function mapSiteSettingsToLayoutDTO(
  row: SiteSettingsRow,
  locale: Locale,
): LayoutDTO {
  const navigation = asArray<LinkDTO>(row.header_navigation, [], isLinkDTO);
  const legalLinks = asArray<LinkDTO>(row.footer_legal_links, [], isLinkDTO);

  return {
    locale,
    siteName: row.site_name,
    logoText: row.logo_text,
    tagline: row.tagline,
    contactEmail: row.contact_email,
    contactPhone: row.contact_phone,
    instagramUrl: row.instagram_url,
    navigation,
    legalLinks,
    footerNewsletterEnabled: row.footer_newsletter_enabled,
  };
}
