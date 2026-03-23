import { getDataClient, type DataClient } from "../client";
import type {
  GuideRow,
  GuideTranslationRow,
  ProgramCategoryAssignmentRow,
  ProgramCategoryRow,
  ProgramCategoryTranslationRow,
  ProgramFaqRow,
  ProgramFaqTranslationRow,
  ProgramGalleryItemRow,
  ProgramGuideAssignmentRow,
  ProgramRow,
  ProgramTestimonialAssignmentRow,
  ProgramTranslationRow,
  TestimonialRow,
  TestimonialTranslationRow,
} from "../db-rows";
import { DataLayerError, throwIfQueryError } from "../errors";
import {
  mapGuidePreview,
  mapProgramCardDTO,
  mapProgramCategory,
  mapProgramDetailDTO,
  mapProgramFaq,
  mapProgramGalleryItem,
  mapTestimonial,
} from "../mappers/program.mapper";
import {
  DEFAULT_LOCALE,
  type CategoryDTO,
  type GuidePreviewDTO,
  type Locale,
  type ProgramCardDTO,
  type ProgramDetailDTO,
  type ProgramFAQDTO,
  type ProgramGalleryItemDTO,
  type TestimonialDTO,
} from "../types";
import { groupBy, localeCandidates, pickTranslation } from "../utils";
import { asRows, uniqueIds } from "./_shared";

interface ProgramSupplementalMaps {
  categoriesByProgramId: Record<string, CategoryDTO[]>;
  guidesByProgramId: Record<string, GuidePreviewDTO[]>;
}

async function loadProgramCategories(
  programIds: string[],
  locale: Locale,
  client: DataClient,
): Promise<Record<string, CategoryDTO[]>> {
  if (programIds.length === 0) {
    return {};
  }

  const { data: assignmentData, error: assignmentError } = await client
    .from("program_category_assignments")
    .select("program_id, category_id, sort_order")
    .in("program_id", programIds);
  throwIfQueryError(
    "loadProgramCategories:program_category_assignments",
    assignmentError,
  );

  const assignments = asRows(assignmentData as ProgramCategoryAssignmentRow[]);
  const categoryIds = uniqueIds(assignments.map((row) => row.category_id));
  if (categoryIds.length === 0) {
    return {};
  }

  const { data: categoryData, error: categoryError } = await client
    .from("program_categories")
    .select("id, slug, sort_order, is_featured, is_active")
    .in("id", categoryIds)
    .eq("is_active", true);
  throwIfQueryError("loadProgramCategories:program_categories", categoryError);

  const categories = asRows(categoryData as ProgramCategoryRow[]);
  const categoryById = categories.reduce<Record<string, ProgramCategoryRow>>(
    (acc, row) => {
      acc[row.id] = row;
      return acc;
    },
    {},
  );

  const { data: translationData, error: translationError } = await client
    .from("program_category_translations")
    .select("id, category_id, locale, name, description")
    .in("category_id", categoryIds)
    .in("locale", localeCandidates(locale));
  throwIfQueryError(
    "loadProgramCategories:program_category_translations",
    translationError,
  );

  const translations = asRows(
    translationData as ProgramCategoryTranslationRow[],
  );
  const translationsByCategory = groupBy(translations, (row) => row.category_id);

  const categoriesByProgram: Record<string, CategoryDTO[]> = {};

  for (const assignment of assignments.sort(
    (a, b) => a.sort_order - b.sort_order,
  )) {
    const category = categoryById[assignment.category_id];
    if (!category) {
      continue;
    }
    const mapped = mapProgramCategory(
      category,
      pickTranslation(translationsByCategory[category.id] ?? [], locale),
    );

    if (!categoriesByProgram[assignment.program_id]) {
      categoriesByProgram[assignment.program_id] = [];
    }
    categoriesByProgram[assignment.program_id].push(mapped);
  }

  return categoriesByProgram;
}

async function loadProgramGuides(
  programs: ProgramRow[],
  locale: Locale,
  client: DataClient,
): Promise<Record<string, GuidePreviewDTO[]>> {
  if (programs.length === 0) {
    return {};
  }

  const programIds = programs.map((program) => program.id);
  const { data: assignmentData, error: assignmentError } = await client
    .from("program_guide_assignments")
    .select("program_id, guide_id, role_label, is_primary, sort_order")
    .in("program_id", programIds);
  throwIfQueryError("loadProgramGuides:program_guide_assignments", assignmentError);

  const assignments = asRows(assignmentData as ProgramGuideAssignmentRow[]);
  const guideIds = uniqueIds([
    ...assignments.map((row) => row.guide_id),
    ...programs.map((program) => program.primary_guide_id),
  ]);

  if (guideIds.length === 0) {
    return {};
  }

  const { data: guideData, error: guideError } = await client
    .from("guides")
    .select("id, slug, avatar_url, is_featured, is_active")
    .in("id", guideIds)
    .eq("is_active", true);
  throwIfQueryError("loadProgramGuides:guides", guideError);
  const guides = asRows(guideData as GuideRow[]);

  const { data: translationData, error: translationError } = await client
    .from("guide_translations")
    .select("id, guide_id, locale, full_name, title, bio")
    .in("guide_id", guideIds)
    .in("locale", localeCandidates(locale));
  throwIfQueryError("loadProgramGuides:guide_translations", translationError);
  const translations = asRows(translationData as GuideTranslationRow[]);
  const translationsByGuide = groupBy(translations, (row) => row.guide_id);

  const guidePreviewById = guides.reduce<Record<string, GuidePreviewDTO>>(
    (acc, row) => {
      acc[row.id] = mapGuidePreview(
        row,
        pickTranslation(translationsByGuide[row.id] ?? [], locale),
      );
      return acc;
    },
    {},
  );

  const guidesByProgramId: Record<string, GuidePreviewDTO[]> = {};
  const seenByProgram = new Map<string, Set<string>>();

  for (const assignment of assignments.sort((a, b) => a.sort_order - b.sort_order)) {
    const preview = guidePreviewById[assignment.guide_id];
    if (!preview) {
      continue;
    }
    if (!guidesByProgramId[assignment.program_id]) {
      guidesByProgramId[assignment.program_id] = [];
      seenByProgram.set(assignment.program_id, new Set<string>());
    }
    const seen = seenByProgram.get(assignment.program_id)!;
    if (!seen.has(assignment.guide_id)) {
      guidesByProgramId[assignment.program_id].push(preview);
      seen.add(assignment.guide_id);
    }
  }

  for (const program of programs) {
    if (!program.primary_guide_id) {
      continue;
    }
    const preview = guidePreviewById[program.primary_guide_id];
    if (!preview) {
      continue;
    }
    if (!guidesByProgramId[program.id]) {
      guidesByProgramId[program.id] = [];
      seenByProgram.set(program.id, new Set<string>());
    }
    const seen = seenByProgram.get(program.id)!;
    if (!seen.has(program.primary_guide_id)) {
      guidesByProgramId[program.id].unshift(preview);
      seen.add(program.primary_guide_id);
    }
  }

  return guidesByProgramId;
}

async function loadProgramSupplementalMaps(
  programs: ProgramRow[],
  locale: Locale,
  client: DataClient,
): Promise<ProgramSupplementalMaps> {
  const programIds = programs.map((program) => program.id);
  const [categoriesByProgramId, guidesByProgramId] = await Promise.all([
    loadProgramCategories(programIds, locale, client),
    loadProgramGuides(programs, locale, client),
  ]);

  return {
    categoriesByProgramId,
    guidesByProgramId,
  };
}

async function loadProgramTestimonials(
  programId: string,
  locale: Locale,
  client: DataClient,
): Promise<TestimonialDTO[]> {
  const { data: assignmentData, error: assignmentError } = await client
    .from("program_testimonial_assignments")
    .select("program_id, testimonial_id, sort_order")
    .eq("program_id", programId);
  throwIfQueryError(
    "loadProgramTestimonials:program_testimonial_assignments",
    assignmentError,
  );
  const assigned = asRows(assignmentData as ProgramTestimonialAssignmentRow[]);

  const { data: directData, error: directError } = await client
    .from("testimonials")
    .select(
      "id, slug, program_id, guide_id, author_image_url, rating, testimonial_date, is_featured, is_published, sort_order",
    )
    .eq("program_id", programId)
    .eq("is_published", true)
    .order("sort_order", { ascending: true });
  throwIfQueryError("loadProgramTestimonials:testimonials_direct", directError);
  const directTestimonials = asRows(directData as TestimonialRow[]);

  const testimonialIds = uniqueIds([
    ...assigned.map((row) => row.testimonial_id),
    ...directTestimonials.map((row) => row.id),
  ]);

  if (testimonialIds.length === 0) {
    return [];
  }

  const { data: allData, error: allError } = await client
    .from("testimonials")
    .select(
      "id, slug, program_id, guide_id, author_image_url, rating, testimonial_date, is_featured, is_published, sort_order",
    )
    .in("id", testimonialIds)
    .eq("is_published", true);
  throwIfQueryError("loadProgramTestimonials:testimonials_all", allError);
  const testimonials = asRows(allData as TestimonialRow[]);

  const { data: translationsData, error: translationsError } = await client
    .from("testimonial_translations")
    .select("id, testimonial_id, locale, author_name, author_title, quote")
    .in("testimonial_id", testimonialIds)
    .in("locale", localeCandidates(locale));
  throwIfQueryError(
    "loadProgramTestimonials:testimonial_translations",
    translationsError,
  );
  const translations = asRows(translationsData as TestimonialTranslationRow[]);
  const translationsByTestimonial = groupBy(translations, (row) => row.testimonial_id);

  const assignmentSort = assigned.reduce<Record<string, number>>((acc, row) => {
    acc[row.testimonial_id] = row.sort_order;
    return acc;
  }, {});

  return testimonials
    .sort((a, b) => {
      const aOrder = assignmentSort[a.id] ?? a.sort_order ?? 9999;
      const bOrder = assignmentSort[b.id] ?? b.sort_order ?? 9999;
      return aOrder - bOrder;
    })
    .map((testimonial) =>
      mapTestimonial(
        testimonial,
        pickTranslation(translationsByTestimonial[testimonial.id] ?? [], locale),
        null,
      ),
    );
}

async function loadProgramFaqs(
  programId: string,
  locale: Locale,
  client: DataClient,
): Promise<ProgramFAQDTO[]> {
  const { data: faqData, error: faqError } = await client
    .from("program_faqs")
    .select("id, program_id, sort_order, is_active")
    .eq("program_id", programId)
    .eq("is_active", true)
    .order("sort_order", { ascending: true });
  throwIfQueryError("loadProgramFaqs:program_faqs", faqError);
  const faqs = asRows(faqData as ProgramFaqRow[]);

  if (faqs.length === 0) {
    return [];
  }

  const faqIds = faqs.map((faq) => faq.id);
  const { data: translationData, error: translationError } = await client
    .from("program_faq_translations")
    .select("id, faq_id, locale, question, answer")
    .in("faq_id", faqIds)
    .in("locale", localeCandidates(locale));
  throwIfQueryError("loadProgramFaqs:program_faq_translations", translationError);
  const translations = asRows(translationData as ProgramFaqTranslationRow[]);
  const translationByFaq = groupBy(translations, (row) => row.faq_id);

  return faqs.map((faq) =>
    mapProgramFaq(faq, pickTranslation(translationByFaq[faq.id] ?? [], locale)),
  );
}

async function loadProgramGallery(
  programId: string,
  locale: Locale,
  client: DataClient,
): Promise<ProgramGalleryItemDTO[]> {
  const { data, error } = await client
    .from("program_gallery_items")
    .select(
      "id, program_id, media_type, media_url, alt_translations, caption_translations, sort_order, is_featured",
    )
    .eq("program_id", programId)
    .order("sort_order", { ascending: true });
  throwIfQueryError("loadProgramGallery:program_gallery_items", error);

  const rows = asRows(data as ProgramGalleryItemRow[]);
  return rows.map((row) => mapProgramGalleryItem(row, locale));
}

export async function getProgramsList(
  locale: Locale = DEFAULT_LOCALE,
  options: {
    statuses?: Array<ProgramRow["status"]>;
    featuredOnly?: boolean;
  } = {},
  client: DataClient = getDataClient(),
): Promise<ProgramCardDTO[]> {
  const statuses = options.statuses ?? ["upcoming", "published"];

  let query = client
    .from("programs")
    .select(
      "id, slug, status, booking_mode, starts_at, ends_at, location_name, city, country_code, duration_days, duration_nights, capacity, spots_left, price_amount, price_currency, cover_image_url, external_booking_url, primary_guide_id, is_featured",
    )
    .in("status", statuses)
    .order("starts_at", { ascending: true });

  if (options.featuredOnly) {
    query = query.eq("is_featured", true);
  }

  const { data: programData, error: programError } = await query;
  throwIfQueryError("getProgramsList:programs", programError);
  const programs = asRows(programData as ProgramRow[]);

  if (programs.length === 0) {
    return [];
  }

  const programIds = programs.map((program) => program.id);

  const { data: translationData, error: translationError } = await client
    .from("program_translations")
    .select(
      "id, program_id, locale, title, subtitle, summary, story_markdown, cover_image_alt, who_is_it_for, itinerary_json, included_items, excluded_items, seo_title, seo_description",
    )
    .in("program_id", programIds)
    .in("locale", localeCandidates(locale));
  throwIfQueryError("getProgramsList:program_translations", translationError);
  const translations = asRows(translationData as ProgramTranslationRow[]);
  const translationsByProgram = groupBy(translations, (row) => row.program_id);

  const { categoriesByProgramId, guidesByProgramId } =
    await loadProgramSupplementalMaps(programs, locale, client);

  return programs.map((program) =>
    mapProgramCardDTO({
      program,
      translation: pickTranslation(
        translationsByProgram[program.id] ?? [],
        locale,
      ),
      categories: categoriesByProgramId[program.id] ?? [],
      guides: guidesByProgramId[program.id] ?? [],
    }),
  );
}

export async function getProgramDetailBySlug(
  slug: string,
  locale: Locale = DEFAULT_LOCALE,
  client: DataClient = getDataClient(),
): Promise<ProgramDetailDTO | null> {
  const { data: programData, error: programError } = await client
    .from("programs")
    .select(
      "id, slug, status, booking_mode, starts_at, ends_at, location_name, city, country_code, duration_days, duration_nights, capacity, spots_left, price_amount, price_currency, cover_image_url, external_booking_url, primary_guide_id, is_featured",
    )
    .eq("slug", slug)
    .limit(1)
    .maybeSingle();
  throwIfQueryError("getProgramDetailBySlug:programs", programError);

  if (!programData) {
    return null;
  }

  const program = programData as ProgramRow;
  const { data: translationData, error: translationError } = await client
    .from("program_translations")
    .select(
      "id, program_id, locale, title, subtitle, summary, story_markdown, cover_image_alt, who_is_it_for, itinerary_json, included_items, excluded_items, seo_title, seo_description",
    )
    .eq("program_id", program.id)
    .in("locale", localeCandidates(locale));
  throwIfQueryError(
    "getProgramDetailBySlug:program_translations",
    translationError,
  );
  const translation = pickTranslation(
    asRows(translationData as ProgramTranslationRow[]),
    locale,
  );
  if (!translation) {
    throw new DataLayerError(
      "getProgramDetailBySlug:translation",
      `Program ${slug} has no translations for requested locale or fallback.`,
    );
  }

  const { categoriesByProgramId, guidesByProgramId } =
    await loadProgramSupplementalMaps([program], locale, client);

  const [faqs, gallery, testimonials] = await Promise.all([
    loadProgramFaqs(program.id, locale, client),
    loadProgramGallery(program.id, locale, client),
    loadProgramTestimonials(program.id, locale, client),
  ]);

  return mapProgramDetailDTO({
    program,
    translation,
    categories: categoriesByProgramId[program.id] ?? [],
    guides: guidesByProgramId[program.id] ?? [],
    faqs,
    gallery,
    testimonials,
  });
}
