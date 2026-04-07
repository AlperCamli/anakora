import { getSupabaseBrowserClient } from "../../../lib/supabase/browser-client";
import type {
  GuideOption,
  ProgramCategoryEditorValue,
  ProgramCategoryListItem,
  ProgramCategoryOption,
  ProgramEditorValue,
  ProgramFaqValue,
  ProgramListItem,
  ProgramTranslationValue,
} from "../types";

const DEFAULT_TRANSLATION: ProgramTranslationValue = {
  title: "",
  subtitle: "",
  summary: "",
  storyMarkdown: "",
  archiveRecapMarkdown: "",
  archiveHighlights: "",
  coverImageAlt: "",
  whoIsItFor: "",
  itineraryJson: "[]",
  includedItems: "",
  excludedItems: "",
  seoTitle: "",
  seoDescription: "",
};

function parseJsonArray(text: string): unknown[] {
  const trimmed = text.trim();
  if (!trimmed) {
    return [];
  }

  try {
    const parsed = JSON.parse(trimmed);
    if (Array.isArray(parsed)) {
      return parsed;
    }
    throw new Error("JSON degeri bir dizi olmalidir.");
  } catch (error) {
    throw new Error(
      error instanceof Error
        ? `Itinerary JSON gecersiz: ${error.message}`
        : "Itinerary JSON gecersiz",
    );
  }
}

function toLineArray(value: string): string[] {
  return value
    .split("\n")
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}

function stringifyLineArray(value: unknown): string {
  if (!Array.isArray(value)) {
    return "";
  }

  return value
    .map((item) => String(item))
    .map((item) => item.trim())
    .filter((item) => item.length > 0)
    .join("\n");
}

function stringifyJsonArray(value: unknown): string {
  if (!Array.isArray(value) || value.length === 0) {
    return "[]";
  }
  return JSON.stringify(value, null, 2);
}

function toDateTimeLocal(iso: string | null): string {
  if (!iso) {
    return "";
  }

  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const offsetMs = date.getTimezoneOffset() * 60_000;
  const local = new Date(date.getTime() - offsetMs);
  return local.toISOString().slice(0, 16);
}

function toIsoFromDateTimeLocal(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  const date = new Date(trimmed);
  if (Number.isNaN(date.getTime())) {
    throw new Error("Gecersiz tarih degeri.");
  }

  return date.toISOString();
}

function normalizeSlug(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function trimOrNull(value: string): string | null {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function parseNumber(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  const parsed = Number(trimmed);
  if (Number.isNaN(parsed)) {
    throw new Error(`Gecersiz sayi: ${value}`);
  }

  return parsed;
}

function parseInteger(value: string): number | null {
  const parsed = parseNumber(value);
  if (parsed === null) {
    return null;
  }
  if (!Number.isInteger(parsed)) {
    throw new Error(`Tam sayi bekleniyor: ${value}`);
  }
  return parsed;
}

export function createEmptyProgramEditorValue(): ProgramEditorValue {
  return {
    slug: "",
    status: "upcoming",
    bookingMode: "application",
    externalBookingUrl: "",
    startsAt: "",
    endsAt: "",
    locationName: "",
    city: "",
    countryCode: "",
    durationDays: "",
    durationNights: "",
    capacity: "",
    spotsLeft: "",
    priceAmount: "",
    priceCurrency: "TRY",
    primaryGuideId: "",
    isFeatured: false,
    coverImageUrl: "",
    categoryIds: [],
    tr: { ...DEFAULT_TRANSLATION },
    en: { ...DEFAULT_TRANSLATION },
    faqs: [],
  };
}

export function createEmptyProgramCategoryEditorValue(): ProgramCategoryEditorValue {
  return {
    slug: "",
    sortOrder: "0",
    isFeatured: false,
    isActive: true,
    trName: "",
    trDescription: "",
    enName: "",
    enDescription: "",
  };
}

export async function getProgramFormLookups(): Promise<{
  guides: GuideOption[];
  categories: ProgramCategoryOption[];
}> {
  const supabase = getSupabaseBrowserClient();

  const [{ data: guidesData, error: guidesError }, { data: guideTranslationsData, error: guideTranslationsError }, { data: categoriesData, error: categoriesError }, { data: categoryTranslationsData, error: categoryTranslationsError }] = await Promise.all([
    supabase
      .from("guides")
      .select("id, slug, is_active")
      .order("is_active", { ascending: false })
      .order("slug", { ascending: true }),
    supabase
      .from("guide_translations")
      .select("guide_id, locale, full_name")
      .in("locale", ["tr", "en"]),
    supabase
      .from("program_categories")
      .select("id, slug, is_active, sort_order")
      .eq("is_active", true)
      .order("sort_order", { ascending: true }),
    supabase
      .from("program_category_translations")
      .select("category_id, locale, name")
      .in("locale", ["tr", "en"]),
  ]);

  if (guidesError) {
    throw new Error(guidesError.message);
  }
  if (guideTranslationsError) {
    throw new Error(guideTranslationsError.message);
  }
  if (categoriesError) {
    throw new Error(categoriesError.message);
  }
  if (categoryTranslationsError) {
    throw new Error(categoryTranslationsError.message);
  }

  const guideTranslationMap = new Map<string, { tr?: string; en?: string }>();
  for (const row of (guideTranslationsData ?? []) as Array<Record<string, unknown>>) {
    const guideId = String(row.guide_id);
    const locale = String(row.locale);
    const fullName = String(row.full_name ?? "");
    const current = guideTranslationMap.get(guideId) ?? {};
    if (locale === "tr") {
      current.tr = fullName;
    }
    if (locale === "en") {
      current.en = fullName;
    }
    guideTranslationMap.set(guideId, current);
  }

  const guides: GuideOption[] = ((guidesData ?? []) as Array<Record<string, unknown>>)
    .map((row) => {
      const id = String(row.id);
      const translation = guideTranslationMap.get(id);
      return {
        id,
        slug: String(row.slug),
        name: translation?.tr || translation?.en || String(row.slug),
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name));

  const categoryTranslationMap = new Map<string, { tr?: string; en?: string }>();
  for (const row of (categoryTranslationsData ?? []) as Array<Record<string, unknown>>) {
    const categoryId = String(row.category_id);
    const locale = String(row.locale);
    const name = String(row.name ?? "");
    const current = categoryTranslationMap.get(categoryId) ?? {};
    if (locale === "tr") {
      current.tr = name;
    }
    if (locale === "en") {
      current.en = name;
    }
    categoryTranslationMap.set(categoryId, current);
  }

  const categories: ProgramCategoryOption[] = (
    (categoriesData ?? []) as Array<Record<string, unknown>>
  ).map((row) => {
    const id = String(row.id);
    const translation = categoryTranslationMap.get(id);
    return {
      id,
      slug: String(row.slug),
      trName: translation?.tr ?? null,
      enName: translation?.en ?? null,
    };
  });

  return { guides, categories };
}

export async function listPrograms(): Promise<ProgramListItem[]> {
  const supabase = getSupabaseBrowserClient();
  const { data: programsData, error: programsError } = await supabase
    .from("programs")
    .select(
      "id, slug, status, booking_mode, starts_at, ends_at, location_name, city, is_featured, price_amount, price_currency, updated_at",
    )
    .order("starts_at", { ascending: false });

  if (programsError) {
    throw new Error(programsError.message);
  }

  const programIds = (programsData ?? []).map((row: Record<string, unknown>) =>
    String(row.id),
  );

  const translationsByProgram = new Map<string, { tr?: string; en?: string }>();

  if (programIds.length > 0) {
    const { data: translationsData, error: translationsError } = await supabase
      .from("program_translations")
      .select("program_id, locale, title")
      .in("program_id", programIds)
      .in("locale", ["tr", "en"]);

    if (translationsError) {
      throw new Error(translationsError.message);
    }

    for (const row of (translationsData ?? []) as Array<Record<string, unknown>>) {
      const programId = String(row.program_id);
      const locale = String(row.locale);
      const title = String(row.title ?? "");
      const current = translationsByProgram.get(programId) ?? {};
      if (locale === "tr") {
        current.tr = title;
      }
      if (locale === "en") {
        current.en = title;
      }
      translationsByProgram.set(programId, current);
    }
  }

  return ((programsData ?? []) as Array<Record<string, unknown>>).map((row) => {
    const programId = String(row.id);
    const translated = translationsByProgram.get(programId);

    return {
      id: programId,
      slug: String(row.slug),
      status: String(row.status) as ProgramListItem["status"],
      bookingMode: String(row.booking_mode) as ProgramListItem["bookingMode"],
      startsAt: String(row.starts_at),
      endsAt: row.ends_at ? String(row.ends_at) : null,
      locationName: String(row.location_name),
      city: typeof row.city === "string" ? row.city : null,
      isFeatured: Boolean(row.is_featured),
      priceAmount: typeof row.price_amount === "number" ? row.price_amount : null,
      priceCurrency: typeof row.price_currency === "string" ? row.price_currency : null,
      trTitle: translated?.tr ?? null,
      enTitle: translated?.en ?? null,
      updatedAt: String(row.updated_at ?? ""),
    };
  });
}

export async function listProgramCategories(): Promise<ProgramCategoryListItem[]> {
  const supabase = getSupabaseBrowserClient();
  const [{ data: categoryRows, error: categoriesError }, { data: translationRows, error: translationsError }] =
    await Promise.all([
      supabase
        .from("program_categories")
        .select("id, slug, sort_order, is_featured, is_active, updated_at")
        .order("sort_order", { ascending: true })
        .order("slug", { ascending: true }),
      supabase
        .from("program_category_translations")
        .select("category_id, locale, name")
        .in("locale", ["tr", "en"]),
    ]);

  if (categoriesError) {
    throw new Error(categoriesError.message);
  }
  if (translationsError) {
    throw new Error(translationsError.message);
  }

  const translationMap = new Map<string, { tr?: string; en?: string }>();
  for (const row of (translationRows ?? []) as Array<Record<string, unknown>>) {
    const categoryId = String(row.category_id);
    const locale = String(row.locale);
    const name = String(row.name ?? "");
    const current = translationMap.get(categoryId) ?? {};
    if (locale === "tr") {
      current.tr = name;
    }
    if (locale === "en") {
      current.en = name;
    }
    translationMap.set(categoryId, current);
  }

  return ((categoryRows ?? []) as Array<Record<string, unknown>>).map((row) => {
    const id = String(row.id);
    const translated = translationMap.get(id);
    return {
      id,
      slug: String(row.slug),
      sortOrder: Number(row.sort_order ?? 0),
      isFeatured: Boolean(row.is_featured),
      isActive: Boolean(row.is_active),
      trName: translated?.tr ?? null,
      enName: translated?.en ?? null,
      updatedAt: String(row.updated_at ?? ""),
    };
  });
}

export async function getProgramCategoryEditorById(
  categoryId: string,
): Promise<ProgramCategoryEditorValue> {
  const supabase = getSupabaseBrowserClient();
  const [{ data: categoryRow, error: categoryError }, { data: translationRows, error: translationError }] =
    await Promise.all([
      supabase
        .from("program_categories")
        .select("id, slug, sort_order, is_featured, is_active")
        .eq("id", categoryId)
        .maybeSingle(),
      supabase
        .from("program_category_translations")
        .select("category_id, locale, name, description")
        .eq("category_id", categoryId)
        .in("locale", ["tr", "en"]),
    ]);

  if (categoryError) {
    throw new Error(categoryError.message);
  }
  if (translationError) {
    throw new Error(translationError.message);
  }
  if (!categoryRow) {
    throw new Error("Program kategorisi bulunamadi.");
  }

  const tr = ((translationRows ?? []) as Array<Record<string, unknown>>).find(
    (row) => row.locale === "tr",
  );
  const en = ((translationRows ?? []) as Array<Record<string, unknown>>).find(
    (row) => row.locale === "en",
  );

  return {
    id: String(categoryRow.id),
    slug: String(categoryRow.slug),
    sortOrder: String(categoryRow.sort_order ?? 0),
    isFeatured: Boolean(categoryRow.is_featured),
    isActive: Boolean(categoryRow.is_active),
    trName: String(tr?.name ?? ""),
    trDescription: String(tr?.description ?? ""),
    enName: String(en?.name ?? ""),
    enDescription: String(en?.description ?? ""),
  };
}

export async function saveProgramCategory(
  values: ProgramCategoryEditorValue,
): Promise<string> {
  const supabase = getSupabaseBrowserClient();
  const slug = normalizeSlug(values.slug || values.trName || values.enName);
  if (!slug) {
    throw new Error("Kategori slug alani zorunludur.");
  }
  if (!values.trName.trim() || !values.enName.trim()) {
    throw new Error("TR ve EN kategori adlari zorunludur.");
  }

  const sortOrder = parseInteger(values.sortOrder) ?? 0;

  const payload = {
    slug,
    sort_order: sortOrder,
    is_featured: values.isFeatured,
    is_active: values.isActive,
  };

  let categoryId = values.id;
  if (categoryId) {
    const { data, error } = await supabase
      .from("program_categories")
      .update(payload)
      .eq("id", categoryId)
      .select("id")
      .single();
    if (error) {
      throw new Error(error.message);
    }
    categoryId = String(data.id);
  } else {
    const { data, error } = await supabase
      .from("program_categories")
      .insert(payload)
      .select("id")
      .single();
    if (error) {
      throw new Error(error.message);
    }
    categoryId = String(data.id);
  }

  const { error: translationError } = await supabase
    .from("program_category_translations")
    .upsert(
      [
        {
          category_id: categoryId,
          locale: "tr",
          name: values.trName.trim(),
          description: trimOrNull(values.trDescription),
        },
        {
          category_id: categoryId,
          locale: "en",
          name: values.enName.trim(),
          description: trimOrNull(values.enDescription),
        },
      ],
      { onConflict: "category_id,locale" },
    );
  if (translationError) {
    throw new Error(translationError.message);
  }

  return categoryId;
}

function mapTranslation(row?: Record<string, unknown>): ProgramTranslationValue {
  if (!row) {
    return { ...DEFAULT_TRANSLATION };
  }

  return {
    title: String(row.title ?? ""),
    subtitle: String(row.subtitle ?? ""),
    summary: String(row.summary ?? ""),
    storyMarkdown: String(row.story_markdown ?? ""),
    archiveRecapMarkdown: String(row.archive_recap_markdown ?? ""),
    archiveHighlights: stringifyLineArray(row.archive_highlights),
    coverImageAlt: String(row.cover_image_alt ?? ""),
    whoIsItFor: stringifyLineArray(row.who_is_it_for),
    itineraryJson: stringifyJsonArray(row.itinerary_json),
    includedItems: stringifyLineArray(row.included_items),
    excludedItems: stringifyLineArray(row.excluded_items),
    seoTitle: String(row.seo_title ?? ""),
    seoDescription: String(row.seo_description ?? ""),
  };
}

export async function getProgramEditorById(
  programId: string,
): Promise<ProgramEditorValue> {
  const supabase = getSupabaseBrowserClient();
  const { data: programData, error: programError } = await supabase
    .from("programs")
    .select(
      "id, slug, status, booking_mode, external_booking_url, starts_at, ends_at, location_name, city, country_code, duration_days, duration_nights, capacity, spots_left, price_amount, price_currency, primary_guide_id, is_featured, cover_image_url",
    )
    .eq("id", programId)
    .maybeSingle();

  if (programError) {
    throw new Error(programError.message);
  }

  if (!programData) {
    throw new Error("Program bulunamadi.");
  }

  const [translationsResult, assignmentsResult, faqsResult] = await Promise.all([
    supabase
      .from("program_translations")
      .select(
        "id, locale, title, subtitle, summary, story_markdown, archive_recap_markdown, archive_highlights, cover_image_alt, who_is_it_for, itinerary_json, included_items, excluded_items, seo_title, seo_description",
      )
      .eq("program_id", programId)
      .in("locale", ["tr", "en"]),
    supabase
      .from("program_category_assignments")
      .select("category_id, sort_order")
      .eq("program_id", programId)
      .order("sort_order", { ascending: true }),
    supabase
      .from("program_faqs")
      .select("id, sort_order, is_active")
      .eq("program_id", programId)
      .order("sort_order", { ascending: true }),
  ]);

  if (translationsResult.error) {
    throw new Error(translationsResult.error.message);
  }
  if (assignmentsResult.error) {
    throw new Error(assignmentsResult.error.message);
  }
  if (faqsResult.error) {
    throw new Error(faqsResult.error.message);
  }
  const translations = (translationsResult.data ?? []) as Array<Record<string, unknown>>;
  const trTranslation = translations.find((row) => row.locale === "tr");
  const enTranslation = translations.find((row) => row.locale === "en");

  const faqs = (faqsResult.data ?? []) as Array<Record<string, unknown>>;
  const faqIds = faqs.map((faq) => String(faq.id));
  let faqTranslations: Array<Record<string, unknown>> = [];

  if (faqIds.length > 0) {
    const { data: faqTranslationsData, error: faqTranslationsError } = await supabase
      .from("program_faq_translations")
      .select("faq_id, locale, question, answer")
      .in("faq_id", faqIds)
      .in("locale", ["tr", "en"]);

    if (faqTranslationsError) {
      throw new Error(faqTranslationsError.message);
    }

    faqTranslations = (faqTranslationsData ?? []) as Array<Record<string, unknown>>;
  }

  const faqTranslationMap = new Map<string, { tr?: { question: string; answer: string }; en?: { question: string; answer: string } }>();
  for (const row of faqTranslations) {
    const faqId = String(row.faq_id);
    const locale = String(row.locale);
    const payload = {
      question: String(row.question ?? ""),
      answer: String(row.answer ?? ""),
    };

    const current = faqTranslationMap.get(faqId) ?? {};
    if (locale === "tr") {
      current.tr = payload;
    }
    if (locale === "en") {
      current.en = payload;
    }
    faqTranslationMap.set(faqId, current);
  }

  const faqValues: ProgramFaqValue[] = faqs.map((faq) => {
    const faqId = String(faq.id);
    const translated = faqTranslationMap.get(faqId) ?? {};

    return {
      id: faqId,
      sortOrder: Number(faq.sort_order ?? 0),
      isActive: Boolean(faq.is_active),
      trQuestion: translated.tr?.question ?? "",
      trAnswer: translated.tr?.answer ?? "",
      enQuestion: translated.en?.question ?? "",
      enAnswer: translated.en?.answer ?? "",
    };
  });

  return {
    id: String(programData.id),
    slug: String(programData.slug),
    status: String(programData.status) as ProgramEditorValue["status"],
    bookingMode: String(programData.booking_mode) as ProgramEditorValue["bookingMode"],
    externalBookingUrl: String(programData.external_booking_url ?? ""),
    startsAt: toDateTimeLocal(String(programData.starts_at)),
    endsAt: toDateTimeLocal(
      typeof programData.ends_at === "string" ? programData.ends_at : null,
    ),
    locationName: String(programData.location_name ?? ""),
    city: String(programData.city ?? ""),
    countryCode: String(programData.country_code ?? ""),
    durationDays:
      typeof programData.duration_days === "number"
        ? String(programData.duration_days)
        : "",
    durationNights:
      typeof programData.duration_nights === "number"
        ? String(programData.duration_nights)
        : "",
    capacity:
      typeof programData.capacity === "number" ? String(programData.capacity) : "",
    spotsLeft:
      typeof programData.spots_left === "number" ? String(programData.spots_left) : "",
    priceAmount:
      typeof programData.price_amount === "number"
        ? String(programData.price_amount)
        : "",
    priceCurrency: String(programData.price_currency ?? "TRY"),
    primaryGuideId: String(programData.primary_guide_id ?? ""),
    isFeatured: Boolean(programData.is_featured),
    coverImageUrl: String(programData.cover_image_url ?? ""),
    categoryIds: ((assignmentsResult.data ?? []) as Array<Record<string, unknown>>).map(
      (assignment) => String(assignment.category_id),
    ),
    tr: mapTranslation(trTranslation),
    en: mapTranslation(enTranslation),
    faqs: faqValues,
  };
}

function normalizeFaqValues(faqs: ProgramFaqValue[]): ProgramFaqValue[] {
  return faqs
    .map((faq, index) => ({
      ...faq,
      sortOrder: faq.sortOrder || index,
      trQuestion: faq.trQuestion.trim(),
      trAnswer: faq.trAnswer.trim(),
      enQuestion: faq.enQuestion.trim(),
      enAnswer: faq.enAnswer.trim(),
    }))
    .filter((faq) => {
      return (
        faq.trQuestion || faq.trAnswer || faq.enQuestion || faq.enAnswer
      );
    });
}

export async function saveProgram(
  values: ProgramEditorValue,
  adminUserId: string,
): Promise<string> {
  const supabase = getSupabaseBrowserClient();

  const slug = normalizeSlug(values.slug || values.tr.title || values.en.title);
  if (!slug) {
    throw new Error("Program slug alani zorunludur.");
  }
  if (!values.startsAt.trim()) {
    throw new Error("Program baslangic tarihi zorunludur.");
  }
  if (!values.locationName.trim()) {
    throw new Error("Lokasyon adi zorunludur.");
  }
  if (!values.tr.title.trim() || !values.en.title.trim()) {
    throw new Error("TR ve EN baslik alanlari zorunludur.");
  }
  if (values.bookingMode === "external" && !values.externalBookingUrl.trim()) {
    throw new Error("Harici rezervasyon tipi icin harici rezervasyon URL alani zorunludur.");
  }

  const startsAt = toIsoFromDateTimeLocal(values.startsAt);
  const endsAt = toIsoFromDateTimeLocal(values.endsAt);

  const payload = {
    slug,
    status: values.status,
    booking_mode: values.bookingMode,
    external_booking_url:
      values.bookingMode === "external" ? trimOrNull(values.externalBookingUrl) : null,
    starts_at: startsAt,
    ends_at: endsAt,
    location_name: values.locationName.trim(),
    city: trimOrNull(values.city),
    country_code: trimOrNull(values.countryCode)?.toUpperCase() ?? null,
    duration_days: parseInteger(values.durationDays),
    duration_nights: parseInteger(values.durationNights),
    capacity: parseInteger(values.capacity),
    spots_left: parseInteger(values.spotsLeft),
    price_amount: parseNumber(values.priceAmount),
    price_currency: (trimOrNull(values.priceCurrency) ?? "TRY").toUpperCase(),
    cover_image_url: trimOrNull(values.coverImageUrl),
    primary_guide_id: trimOrNull(values.primaryGuideId),
    is_featured: values.isFeatured,
    updated_by: adminUserId,
    published_at: values.status === "published" ? new Date().toISOString() : null,
  };

  let programId = values.id;

  if (programId) {
    const { data, error } = await supabase
      .from("programs")
      .update(payload)
      .eq("id", programId)
      .select("id")
      .single();

    if (error) {
      throw new Error(error.message);
    }
    programId = String(data.id);
  } else {
    const { data, error } = await supabase
      .from("programs")
      .insert({
        ...payload,
        created_by: adminUserId,
      })
      .select("id")
      .single();

    if (error) {
      throw new Error(error.message);
    }
    programId = String(data.id);
  }

  const translationRows = [
    {
      program_id: programId,
      locale: "tr",
      title: values.tr.title.trim(),
      subtitle: trimOrNull(values.tr.subtitle),
      summary: trimOrNull(values.tr.summary),
      story_markdown: trimOrNull(values.tr.storyMarkdown),
      archive_recap_markdown: trimOrNull(values.tr.archiveRecapMarkdown),
      archive_highlights: toLineArray(values.tr.archiveHighlights),
      cover_image_alt: trimOrNull(values.tr.coverImageAlt),
      who_is_it_for: toLineArray(values.tr.whoIsItFor),
      itinerary_json: parseJsonArray(values.tr.itineraryJson),
      included_items: toLineArray(values.tr.includedItems),
      excluded_items: toLineArray(values.tr.excludedItems),
      seo_title: trimOrNull(values.tr.seoTitle),
      seo_description: trimOrNull(values.tr.seoDescription),
    },
    {
      program_id: programId,
      locale: "en",
      title: values.en.title.trim(),
      subtitle: trimOrNull(values.en.subtitle),
      summary: trimOrNull(values.en.summary),
      story_markdown: trimOrNull(values.en.storyMarkdown),
      archive_recap_markdown: trimOrNull(values.en.archiveRecapMarkdown),
      archive_highlights: toLineArray(values.en.archiveHighlights),
      cover_image_alt: trimOrNull(values.en.coverImageAlt),
      who_is_it_for: toLineArray(values.en.whoIsItFor),
      itinerary_json: parseJsonArray(values.en.itineraryJson),
      included_items: toLineArray(values.en.includedItems),
      excluded_items: toLineArray(values.en.excludedItems),
      seo_title: trimOrNull(values.en.seoTitle),
      seo_description: trimOrNull(values.en.seoDescription),
    },
  ];

  const { error: translationError } = await supabase
    .from("program_translations")
    .upsert(translationRows, { onConflict: "program_id,locale" });

  if (translationError) {
    throw new Error(translationError.message);
  }

  const { error: deleteAssignmentsError } = await supabase
    .from("program_category_assignments")
    .delete()
    .eq("program_id", programId);

  if (deleteAssignmentsError) {
    throw new Error(deleteAssignmentsError.message);
  }

  const categoryAssignments = values.categoryIds.map((categoryId, index) => ({
    program_id: programId,
    category_id: categoryId,
    sort_order: index,
  }));

  if (categoryAssignments.length > 0) {
    const { error: insertAssignmentsError } = await supabase
      .from("program_category_assignments")
      .insert(categoryAssignments);
    if (insertAssignmentsError) {
      throw new Error(insertAssignmentsError.message);
    }
  }

  const { error: deleteFaqError } = await supabase
    .from("program_faqs")
    .delete()
    .eq("program_id", programId);
  if (deleteFaqError) {
    throw new Error(deleteFaqError.message);
  }

  const normalizedFaqs = normalizeFaqValues(values.faqs);
  if (normalizedFaqs.length > 0) {
    const { data: insertedFaqs, error: insertFaqError } = await supabase
      .from("program_faqs")
      .insert(
        normalizedFaqs.map((faq, index) => ({
          program_id: programId,
          sort_order: index,
          is_active: faq.isActive,
        })),
      )
      .select("id");

    if (insertFaqError) {
      throw new Error(insertFaqError.message);
    }

    const translationInserts = (insertedFaqs ?? []).flatMap((row, index) => {
      const faq = normalizedFaqs[index];
      const trQuestion = faq.trQuestion || faq.enQuestion || "FAQ";
      const trAnswer = faq.trAnswer || faq.enAnswer || "-";
      const enQuestion = faq.enQuestion || faq.trQuestion || "FAQ";
      const enAnswer = faq.enAnswer || faq.trAnswer || "-";

      return [
        {
          faq_id: String((row as Record<string, unknown>).id),
          locale: "tr",
          question: trQuestion,
          answer: trAnswer,
        },
        {
          faq_id: String((row as Record<string, unknown>).id),
          locale: "en",
          question: enQuestion,
          answer: enAnswer,
        },
      ];
    });

    const { error: faqTranslationError } = await supabase
      .from("program_faq_translations")
      .insert(translationInserts);
    if (faqTranslationError) {
      throw new Error(faqTranslationError.message);
    }
  }

  return programId;
}

export async function getProgramGalleryCount(programId: string): Promise<number> {
  const supabase = getSupabaseBrowserClient();
  const { count, error } = await supabase
    .from("program_gallery_items")
    .select("*", { count: "exact", head: true })
    .eq("program_id", programId);

  if (error) {
    throw new Error(error.message);
  }

  return count ?? 0;
}
