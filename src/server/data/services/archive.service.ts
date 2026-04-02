import { getDataClient, type DataClient } from "../client";
import { throwIfQueryError } from "../errors";
import {
  DEFAULT_LOCALE,
  type ArchiveDTO,
  type ArchiveProgramDTO,
  type Locale,
} from "../types";
import { asArray, localeCandidates, normalizeMedia, pickTranslation } from "../utils";
import { asRows } from "./_shared";

interface ArchiveProgramRow {
  id: string;
  slug: string;
  starts_at: string;
  ends_at: string | null;
  location_name: string;
  city: string | null;
  country_code: string | null;
  capacity: number | null;
  cover_image_url: string | null;
}

interface ArchiveProgramTranslationRow {
  program_id: string;
  locale: "tr" | "en";
  title: string;
  summary: string | null;
  cover_image_alt: string | null;
  archive_recap_markdown: string | null;
  archive_highlights: unknown;
}

export async function getArchive(
  locale: Locale = DEFAULT_LOCALE,
  client: DataClient = getDataClient(),
): Promise<ArchiveDTO> {
  const { data: programData, error: programError } = await client
    .from("programs")
    .select(
      "id, slug, starts_at, ends_at, location_name, city, country_code, capacity, cover_image_url",
    )
    .eq("status", "completed")
    .order("starts_at", { ascending: false });
  throwIfQueryError("getArchive:programs", programError);
  const programs = asRows(programData as ArchiveProgramRow[]);

  if (programs.length === 0) {
    return {
      locale,
      years: [],
      totalPrograms: 0,
    };
  }

  const programIds = programs.map((program) => program.id);
  const { data: translationData, error: translationError } = await client
    .from("program_translations")
    .select(
      "program_id, locale, title, summary, cover_image_alt, archive_recap_markdown, archive_highlights",
    )
    .in("program_id", programIds)
    .in("locale", localeCandidates(locale));
  throwIfQueryError("getArchive:program_translations", translationError);
  const translations = asRows(
    translationData as ArchiveProgramTranslationRow[],
  );
  const translationsByProgramId = new Map<string, ArchiveProgramTranslationRow[]>();
  for (const row of translations) {
    const current = translationsByProgramId.get(row.program_id) ?? [];
    current.push(row);
    translationsByProgramId.set(row.program_id, current);
  }

  const archivePrograms: ArchiveProgramDTO[] = programs.map((program) => {
    const translation = pickTranslation(
      translationsByProgramId.get(program.id) ?? [],
      locale,
    );
    const highlights = asArray<string>(translation?.archive_highlights ?? [], [])
      .map((item) => item.trim())
      .filter((item) => item.length > 0);

    return {
      id: program.id,
      slug: program.slug,
      title: translation?.title ?? program.slug,
      summary: translation?.summary ?? null,
      locationName: program.location_name,
      city: program.city,
      countryCode: program.country_code,
      startsAt: program.starts_at,
      endsAt: program.ends_at,
      capacity: program.capacity,
      coverImage: normalizeMedia(
        program.cover_image_url,
        translation?.cover_image_alt ?? translation?.title ?? null,
      ),
      recapMarkdown: translation?.archive_recap_markdown ?? null,
      highlights,
    };
  });

  const byYear = archivePrograms.reduce<Record<number, ArchiveProgramDTO[]>>(
    (acc, card) => {
      const year = new Date(card.startsAt).getUTCFullYear();
      if (!acc[year]) {
        acc[year] = [];
      }
      acc[year].push(card);
      return acc;
    },
    {},
  );

  const years = Object.keys(byYear)
    .map((key) => Number(key))
    .sort((a, b) => b - a)
    .map((year) => ({
      year,
      programs: byYear[year],
    }));

  return {
    locale,
    years,
    totalPrograms: archivePrograms.length,
  };
}
