import { getDataClient, type DataClient } from "../client";
import type { GuideRow, GuideTranslationRow } from "../db-rows";
import { throwIfQueryError } from "../errors";
import { mapGuideDTO } from "../mappers/guide.mapper";
import { DEFAULT_LOCALE, type GuideDTO, type Locale } from "../types";
import { groupBy, localeCandidates, pickTranslation } from "../utils";
import { asRows } from "./_shared";

export async function getGuides(
  locale: Locale = DEFAULT_LOCALE,
  client: DataClient = getDataClient(),
): Promise<GuideDTO[]> {
  const { data: guidesData, error: guidesError } = await client
    .from("guides")
    .select("id, slug, avatar_url, is_featured, is_active")
    .eq("is_active", true)
    .order("is_featured", { ascending: false })
    .order("created_at", { ascending: false });

  throwIfQueryError("getGuides:guides", guidesError);
  const guides = asRows(guidesData as GuideRow[]);

  if (guides.length === 0) {
    return [];
  }

  const guideIds = guides.map((guide) => guide.id);
  const { data: translationsData, error: translationsError } = await client
    .from("guide_translations")
    .select("id, guide_id, locale, full_name, title, bio")
    .in("guide_id", guideIds)
    .in("locale", localeCandidates(locale));

  throwIfQueryError("getGuides:guide_translations", translationsError);
  const translations = asRows(translationsData as GuideTranslationRow[]);
  const translationsByGuide = groupBy(translations, (row) => row.guide_id);

  return guides.map((guide) =>
    mapGuideDTO(
      guide,
      pickTranslation(translationsByGuide[guide.id] ?? [], locale),
    ),
  );
}
