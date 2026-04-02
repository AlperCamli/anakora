import type {
  HomepageSectionRow,
  HomepageTrustedOrganizationRow,
} from "../db-rows";
import type { HomePageSectionDTO, TrustedOrganizationDTO } from "../types";
import { asObject, normalizeMedia } from "../utils";

export function mapHomepageSectionDTO(row: HomepageSectionRow): HomePageSectionDTO {
  return {
    key: row.section_key,
    title: row.title,
    subtitle: row.subtitle,
    media: normalizeMedia(row.media_url, row.media_alt),
    payload: asObject(row.payload_json),
    sortOrder: row.sort_order,
  };
}

export function mapTrustedOrganizationDTO(
  row: HomepageTrustedOrganizationRow,
): TrustedOrganizationDTO {
  return {
    id: row.id,
    organizationName: row.organization_name,
    logo: {
      url: row.logo_url,
      alt: row.logo_alt ?? row.organization_name,
      type: "image",
    },
    websiteUrl: row.website_url,
    sortOrder: row.sort_order,
  };
}
