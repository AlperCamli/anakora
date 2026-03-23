import type { HomepageSectionRow } from "../db-rows";
import type { HomePageSectionDTO } from "../types";
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
