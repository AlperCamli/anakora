import { getSupabaseBrowserClient } from "../../../lib/supabase/browser-client";
import type {
  GuideOption,
  ProgramOption,
  TestimonialEditorValue,
  TestimonialListItem,
  TestimonialTranslationValue,
} from "../types";
import { normalizeSlug, parseInteger, trimOrNull } from "./_helpers";

const EMPTY_TRANSLATION: TestimonialTranslationValue = {
  authorName: "",
  authorTitle: "",
  quote: "",
};

function mapTranslationRows(rows: Array<Record<string, unknown>>) {
  const map = new Map<
    string,
    {
      tr?: TestimonialTranslationValue;
      en?: TestimonialTranslationValue;
    }
  >();

  for (const row of rows) {
    const testimonialId = String(row.testimonial_id);
    const locale = String(row.locale);
    const item: TestimonialTranslationValue = {
      authorName: String(row.author_name ?? ""),
      authorTitle: String(row.author_title ?? ""),
      quote: String(row.quote ?? ""),
    };

    const current = map.get(testimonialId) ?? {};
    if (locale === "tr") {
      current.tr = item;
    }
    if (locale === "en") {
      current.en = item;
    }
    map.set(testimonialId, current);
  }

  return map;
}

export function createEmptyTestimonialEditorValue(): TestimonialEditorValue {
  return {
    slug: "",
    primaryProgramId: "",
    linkedProgramIds: [],
    guideId: "",
    authorImageUrl: "",
    rating: "5",
    testimonialDate: "",
    isFeatured: false,
    isPublished: true,
    sortOrder: "0",
    tr: { ...EMPTY_TRANSLATION },
    en: { ...EMPTY_TRANSLATION },
  };
}

export async function getTestimonialFormLookups(): Promise<{
  programs: ProgramOption[];
  guides: GuideOption[];
}> {
  const supabase = getSupabaseBrowserClient();
  const [
    { data: programRows, error: programsError },
    { data: programTranslationRows, error: programTranslationsError },
    { data: guideRows, error: guidesError },
    { data: guideTranslationRows, error: guideTranslationsError },
  ] = await Promise.all([
    supabase
      .from("programs")
      .select("id, slug, starts_at")
      .order("starts_at", { ascending: false }),
    supabase
      .from("program_translations")
      .select("program_id, locale, title")
      .in("locale", ["tr", "en"]),
    supabase
      .from("guides")
      .select("id, slug, is_active")
      .eq("is_active", true)
      .order("slug", { ascending: true }),
    supabase
      .from("guide_translations")
      .select("guide_id, locale, full_name")
      .in("locale", ["tr", "en"]),
  ]);

  if (programsError) {
    throw new Error(programsError.message);
  }
  if (programTranslationsError) {
    throw new Error(programTranslationsError.message);
  }
  if (guidesError) {
    throw new Error(guidesError.message);
  }
  if (guideTranslationsError) {
    throw new Error(guideTranslationsError.message);
  }

  const programTitleMap = new Map<string, { tr?: string; en?: string }>();
  for (const row of (programTranslationRows ?? []) as Array<Record<string, unknown>>) {
    const programId = String(row.program_id);
    const locale = String(row.locale);
    const title = String(row.title ?? "");
    const current = programTitleMap.get(programId) ?? {};
    if (locale === "tr") {
      current.tr = title;
    }
    if (locale === "en") {
      current.en = title;
    }
    programTitleMap.set(programId, current);
  }

  const programs: ProgramOption[] = ((programRows ?? []) as Array<Record<string, unknown>>).map(
    (row) => {
      const id = String(row.id);
      const labels = programTitleMap.get(id);
      return {
        id,
        slug: String(row.slug),
        title: labels?.tr || labels?.en || String(row.slug),
      };
    },
  );

  const guideNameMap = new Map<string, { tr?: string; en?: string }>();
  for (const row of (guideTranslationRows ?? []) as Array<Record<string, unknown>>) {
    const guideId = String(row.guide_id);
    const locale = String(row.locale);
    const fullName = String(row.full_name ?? "");
    const current = guideNameMap.get(guideId) ?? {};
    if (locale === "tr") {
      current.tr = fullName;
    }
    if (locale === "en") {
      current.en = fullName;
    }
    guideNameMap.set(guideId, current);
  }

  const guides: GuideOption[] = ((guideRows ?? []) as Array<Record<string, unknown>>).map(
    (row) => {
      const id = String(row.id);
      const label = guideNameMap.get(id);
      return {
        id,
        slug: String(row.slug),
        name: label?.tr || label?.en || String(row.slug),
      };
    },
  );

  return {
    programs,
    guides,
  };
}

export async function listTestimonials(): Promise<TestimonialListItem[]> {
  const supabase = getSupabaseBrowserClient();
  const [{ data: testimonialRows, error: testimonialError }, { data: translationRows, error: translationError }, { data: assignmentRows, error: assignmentError }] =
    await Promise.all([
      supabase
        .from("testimonials")
        .select(
          "id, slug, program_id, guide_id, rating, testimonial_date, is_featured, is_published, sort_order, updated_at",
        )
        .order("is_featured", { ascending: false })
        .order("sort_order", { ascending: true })
        .order("updated_at", { ascending: false }),
      supabase
        .from("testimonial_translations")
        .select("testimonial_id, locale, author_name, quote")
        .in("locale", ["tr", "en"]),
      supabase
        .from("program_testimonial_assignments")
        .select("testimonial_id, program_id"),
    ]);

  if (testimonialError) {
    throw new Error(testimonialError.message);
  }
  if (translationError) {
    throw new Error(translationError.message);
  }
  if (assignmentError) {
    throw new Error(assignmentError.message);
  }

  const translationMap = mapTranslationRows(
    (translationRows ?? []) as Array<Record<string, unknown>>,
  );

  const linkedProgramMap = new Map<string, Set<string>>();
  for (const row of (assignmentRows ?? []) as Array<Record<string, unknown>>) {
    const testimonialId = String(row.testimonial_id);
    const programId = String(row.program_id);
    const current = linkedProgramMap.get(testimonialId) ?? new Set<string>();
    current.add(programId);
    linkedProgramMap.set(testimonialId, current);
  }

  return ((testimonialRows ?? []) as Array<Record<string, unknown>>).map((row) => {
    const id = String(row.id);
    const translated = translationMap.get(id);
    const linkedPrograms = linkedProgramMap.get(id) ?? new Set<string>();
    const primaryProgramId = typeof row.program_id === "string" ? row.program_id : null;
    if (primaryProgramId) {
      linkedPrograms.add(primaryProgramId);
    }

    return {
      id,
      slug: typeof row.slug === "string" ? row.slug : null,
      primaryProgramId,
      linkedProgramCount: linkedPrograms.size,
      guideId: typeof row.guide_id === "string" ? row.guide_id : null,
      rating: Number(row.rating ?? 5),
      testimonialDate: typeof row.testimonial_date === "string" ? row.testimonial_date : null,
      isFeatured: Boolean(row.is_featured),
      isPublished: Boolean(row.is_published),
      sortOrder: Number(row.sort_order ?? 0),
      trAuthorName: translated?.tr?.authorName ?? null,
      enAuthorName: translated?.en?.authorName ?? null,
      trQuote: translated?.tr?.quote ?? null,
      enQuote: translated?.en?.quote ?? null,
      updatedAt: String(row.updated_at ?? ""),
    };
  });
}

export async function getTestimonialEditorById(
  testimonialId: string,
): Promise<TestimonialEditorValue> {
  const supabase = getSupabaseBrowserClient();
  const [{ data: testimonialRow, error: testimonialError }, { data: translationRows, error: translationError }, { data: assignmentRows, error: assignmentError }] =
    await Promise.all([
      supabase
        .from("testimonials")
        .select(
          "id, slug, program_id, guide_id, author_image_url, rating, testimonial_date, is_featured, is_published, sort_order",
        )
        .eq("id", testimonialId)
        .maybeSingle(),
      supabase
        .from("testimonial_translations")
        .select("testimonial_id, locale, author_name, author_title, quote")
        .eq("testimonial_id", testimonialId)
        .in("locale", ["tr", "en"]),
      supabase
        .from("program_testimonial_assignments")
        .select("program_id, sort_order")
        .eq("testimonial_id", testimonialId)
        .order("sort_order", { ascending: true }),
    ]);

  if (testimonialError) {
    throw new Error(testimonialError.message);
  }
  if (translationError) {
    throw new Error(translationError.message);
  }
  if (assignmentError) {
    throw new Error(assignmentError.message);
  }
  if (!testimonialRow) {
    throw new Error("Yorum bulunamadi.");
  }

  const translationMap = mapTranslationRows(
    (translationRows ?? []) as Array<Record<string, unknown>>,
  ).get(String(testimonialRow.id));

  const linkedProgramIds = [
    ...new Set<string>([
      ...((assignmentRows ?? []) as Array<Record<string, unknown>>).map((row) =>
        String(row.program_id),
      ),
      typeof testimonialRow.program_id === "string" ? testimonialRow.program_id : "",
    ].filter(Boolean)),
  ];

  return {
    id: String(testimonialRow.id),
    slug: String(testimonialRow.slug ?? ""),
    primaryProgramId: String(testimonialRow.program_id ?? ""),
    linkedProgramIds,
    guideId: String(testimonialRow.guide_id ?? ""),
    authorImageUrl: String(testimonialRow.author_image_url ?? ""),
    rating: String(testimonialRow.rating ?? 5),
    testimonialDate: String(testimonialRow.testimonial_date ?? ""),
    isFeatured: Boolean(testimonialRow.is_featured),
    isPublished: Boolean(testimonialRow.is_published),
    sortOrder: String(testimonialRow.sort_order ?? 0),
    tr: translationMap?.tr ?? { ...EMPTY_TRANSLATION },
    en: translationMap?.en ?? { ...EMPTY_TRANSLATION },
  };
}

export async function saveTestimonial(
  values: TestimonialEditorValue,
): Promise<string> {
  const supabase = getSupabaseBrowserClient();

  const slug = normalizeSlug(values.slug || values.tr.authorName || values.en.authorName);
  if (!slug) {
    throw new Error("Slug alani zorunludur.");
  }
  if (!values.tr.authorName.trim() || !values.en.authorName.trim()) {
    throw new Error("TR ve EN yazar adlari zorunludur.");
  }
  if (!values.tr.quote.trim() || !values.en.quote.trim()) {
    throw new Error("TR ve EN yorum alanlari zorunludur.");
  }

  const rating = parseInteger(values.rating, "Puan") ?? 5;
  if (rating < 1 || rating > 5) {
    throw new Error("Puan 1 ile 5 arasinda olmalidir.");
  }

  const sortOrder = parseInteger(values.sortOrder, "Siralama") ?? 0;
  const testimonialDate = trimOrNull(values.testimonialDate);
  if (testimonialDate && !/^\d{4}-\d{2}-\d{2}$/.test(testimonialDate)) {
    throw new Error("Yorum tarihi YYYY-MM-DD formatinda olmalidir.");
  }

  const primaryProgramId = trimOrNull(values.primaryProgramId);
  const linkedProgramIds = [
    ...new Set(
      [primaryProgramId, ...values.linkedProgramIds.map((item) => item.trim())].filter(
        (item): item is string => Boolean(item),
      ),
    ),
  ];

  const payload = {
    slug,
    program_id: primaryProgramId,
    guide_id: trimOrNull(values.guideId),
    author_image_url: trimOrNull(values.authorImageUrl),
    rating,
    testimonial_date: testimonialDate,
    is_featured: values.isFeatured,
    is_published: values.isPublished,
    sort_order: sortOrder,
  };

  let testimonialId = values.id;
  if (testimonialId) {
    const { data, error } = await supabase
      .from("testimonials")
      .update(payload)
      .eq("id", testimonialId)
      .select("id")
      .single();
    if (error) {
      throw new Error(error.message);
    }
    testimonialId = String(data.id);
  } else {
    const { data, error } = await supabase
      .from("testimonials")
      .insert(payload)
      .select("id")
      .single();
    if (error) {
      throw new Error(error.message);
    }
    testimonialId = String(data.id);
  }

  const { error: translationError } = await supabase
    .from("testimonial_translations")
    .upsert(
      [
        {
          testimonial_id: testimonialId,
          locale: "tr",
          author_name: values.tr.authorName.trim(),
          author_title: trimOrNull(values.tr.authorTitle),
          quote: values.tr.quote.trim(),
        },
        {
          testimonial_id: testimonialId,
          locale: "en",
          author_name: values.en.authorName.trim(),
          author_title: trimOrNull(values.en.authorTitle),
          quote: values.en.quote.trim(),
        },
      ],
      { onConflict: "testimonial_id,locale" },
    );
  if (translationError) {
    throw new Error(translationError.message);
  }

  const { error: deleteAssignmentError } = await supabase
    .from("program_testimonial_assignments")
    .delete()
    .eq("testimonial_id", testimonialId);
  if (deleteAssignmentError) {
    throw new Error(deleteAssignmentError.message);
  }

  if (linkedProgramIds.length > 0) {
    const { error: assignmentError } = await supabase
      .from("program_testimonial_assignments")
      .insert(
        linkedProgramIds.map((programId, index) => ({
          program_id: programId,
          testimonial_id: testimonialId,
          sort_order: index,
        })),
      );
    if (assignmentError) {
      throw new Error(assignmentError.message);
    }
  }

  return testimonialId;
}
