import { getDataClient, type DataClient } from "../client";
import type {
  ProgramRow,
  TestimonialRow,
  TestimonialTranslationRow,
} from "../db-rows";
import { throwIfQueryError } from "../errors";
import { mapTestimonialDTO } from "../mappers/testimonial.mapper";
import { DEFAULT_LOCALE, type Locale, type TestimonialDTO } from "../types";
import { groupBy, localeCandidates, pickTranslation } from "../utils";
import { asRows, uniqueIds } from "./_shared";

export interface GetTestimonialsOptions {
  featuredOnly?: boolean;
  limit?: number;
}

export async function getTestimonials(
  locale: Locale = DEFAULT_LOCALE,
  options: GetTestimonialsOptions = {},
  client: DataClient = getDataClient(),
): Promise<TestimonialDTO[]> {
  let query = client
    .from("testimonials")
    .select(
      "id, slug, program_id, guide_id, author_image_url, rating, testimonial_date, is_featured, is_published, sort_order",
    )
    .eq("is_published", true)
    .order("is_featured", { ascending: false })
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });

  if (options.featuredOnly) {
    query = query.eq("is_featured", true);
  }
  if (options.limit && options.limit > 0) {
    query = query.limit(options.limit);
  }

  const { data: testimonialData, error: testimonialsError } = await query;
  throwIfQueryError("getTestimonials:testimonials", testimonialsError);
  const testimonials = asRows(testimonialData as TestimonialRow[]);

  if (testimonials.length === 0) {
    return [];
  }

  const testimonialIds = testimonials.map((item) => item.id);
  const { data: translationData, error: translationsError } = await client
    .from("testimonial_translations")
    .select("id, testimonial_id, locale, author_name, author_title, quote")
    .in("testimonial_id", testimonialIds)
    .in("locale", localeCandidates(locale));

  throwIfQueryError("getTestimonials:testimonial_translations", translationsError);
  const translations = asRows(translationData as TestimonialTranslationRow[]);
  const translationsByTestimonial = groupBy(translations, (row) => row.testimonial_id);

  const relatedProgramIds = uniqueIds(testimonials.map((item) => item.program_id));
  let programSlugById: Record<string, string> = {};

  if (relatedProgramIds.length > 0) {
    const { data: programData, error: programsError } = await client
      .from("programs")
      .select("id, slug")
      .in("id", relatedProgramIds);

    throwIfQueryError("getTestimonials:programs", programsError);
    const programs = asRows(programData as Pick<ProgramRow, "id" | "slug">[]);
    programSlugById = programs.reduce<Record<string, string>>((acc, row) => {
      acc[row.id] = row.slug;
      return acc;
    }, {});
  }

  return testimonials.map((item) =>
    mapTestimonialDTO(
      item,
      pickTranslation(translationsByTestimonial[item.id] ?? [], locale),
      item.program_id ? programSlugById[item.program_id] ?? null : null,
    ),
  );
}
