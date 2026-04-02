import { getDataClient, type DataClient } from "../client";
import type {
  HomepageSectionRow,
  HomepageTrustedOrganizationRow,
} from "../db-rows";
import { throwIfQueryError } from "../errors";
import {
  mapHomepageSectionDTO,
  mapTrustedOrganizationDTO,
} from "../mappers/home.mapper";
import { DEFAULT_LOCALE, type HomePageDTO, type Locale } from "../types";
import { getJournalList } from "./journal.service";
import { getProgramsList } from "./programs.service";
import { getTestimonials } from "./testimonials.service";
import { asRows } from "./_shared";

export async function getHomepage(
  locale: Locale = DEFAULT_LOCALE,
  client: DataClient = getDataClient(),
): Promise<HomePageDTO> {
  const { data: sectionData, error: sectionError } = await client
    .from("homepage_sections")
    .select(
      "id, section_key, locale, title, subtitle, payload_json, media_url, media_alt, sort_order, is_active",
    )
    .in("locale", locale === DEFAULT_LOCALE ? [locale] : [locale, DEFAULT_LOCALE])
    .eq("is_active", true)
    .order("sort_order", { ascending: true });
  throwIfQueryError("getHomepage:homepage_sections", sectionError);
  const sectionRows = asRows(sectionData as HomepageSectionRow[]);

  const sectionMap = new Map<string, HomepageSectionRow>();
  for (const row of sectionRows) {
    const existing = sectionMap.get(row.section_key);
    if (!existing) {
      sectionMap.set(row.section_key, row);
      continue;
    }

    const shouldReplace =
      existing.locale !== locale && row.locale === locale;
    if (shouldReplace) {
      sectionMap.set(row.section_key, row);
    }
  }

  const sections = Array.from(sectionMap.values())
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((row) => mapHomepageSectionDTO(row));

  const { data: trustedOrganizationsData, error: trustedOrganizationsError } = await client
    .from("homepage_trusted_organizations")
    .select(
      "id, organization_name, logo_url, logo_alt, website_url, sort_order, is_active",
    )
    .eq("is_active", true)
    .order("sort_order", { ascending: true });
  throwIfQueryError(
    "getHomepage:homepage_trusted_organizations",
    trustedOrganizationsError,
  );
  const trustedOrganizationsRows = asRows(
    trustedOrganizationsData as HomepageTrustedOrganizationRow[],
  );
  const trustedOrganizations = trustedOrganizationsRows.map((row) =>
    mapTrustedOrganizationDTO(row),
  );

  const [featuredPrograms, featuredTestimonials, journalList] =
    await Promise.all([
      getProgramsList(
        locale,
        {
          featuredOnly: true,
          statuses: ["upcoming", "published"],
        },
        client,
      ),
      getTestimonials(locale, { featuredOnly: true, limit: 6 }, client),
      getJournalList(locale, client),
    ]);

  return {
    locale,
    sections,
    trustedOrganizations,
    featuredPrograms,
    featuredTestimonials,
    journalPreview: journalList.posts.slice(0, 3),
  };
}
