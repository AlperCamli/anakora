import type { GuideRow, GuideTranslationRow } from "../db-rows";
import type { GuideDTO } from "../types";
import { normalizeMedia } from "../utils";

export function mapGuideDTO(
  guide: GuideRow,
  translation: GuideTranslationRow | null,
): GuideDTO {
  return {
    slug: guide.slug,
    name: translation?.full_name ?? guide.slug,
    title: translation?.title ?? null,
    bio: translation?.bio ?? null,
    avatar: normalizeMedia(guide.avatar_url, translation?.full_name ?? null),
    isFeatured: guide.is_featured,
  };
}
