import { getDataClient, type DataClient } from "../client";
import type { SiteSettingsRow } from "../db-rows";
import { DataLayerError, throwIfQueryError } from "../errors";
import { mapSiteSettingsToLayoutDTO } from "../mappers/layout.mapper";
import { DEFAULT_LOCALE, type LayoutDTO, type Locale } from "../types";
import { localeCandidates } from "../utils";
import { asRows } from "./_shared";

export async function getLayout(
  locale: Locale = DEFAULT_LOCALE,
  client: DataClient = getDataClient(),
): Promise<LayoutDTO> {
  const { data, error } = await client
    .from("site_settings")
    .select(
      "id, locale, site_name, logo_text, tagline, contact_email, contact_phone, instagram_url, header_navigation, footer_legal_links, footer_newsletter_enabled",
    )
    .in("locale", localeCandidates(locale));

  throwIfQueryError("getLayout:site_settings", error);

  const rows = asRows(data as SiteSettingsRow[]);
  if (rows.length === 0) {
    throw new DataLayerError(
      "getLayout:site_settings",
      "No site_settings row found for requested locale or fallback.",
    );
  }

  const selected =
    rows.find((row) => row.locale === locale) ??
    rows.find((row) => row.locale === DEFAULT_LOCALE) ??
    rows[0];

  return mapSiteSettingsToLayoutDTO(selected, locale);
}
