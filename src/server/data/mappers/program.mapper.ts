import type {
  GuideRow,
  GuideTranslationRow,
  ProgramCategoryRow,
  ProgramCategoryTranslationRow,
  ProgramFaqRow,
  ProgramFaqTranslationRow,
  ProgramGalleryItemRow,
  ProgramRow,
  ProgramTranslationRow,
  TestimonialRow,
  TestimonialTranslationRow,
} from "../db-rows";
import type {
  CategoryDTO,
  GuidePreviewDTO,
  Locale,
  ProgramCardDTO,
  ProgramCategoryFilterDTO,
  ProgramDetailDTO,
  ProgramFAQDTO,
  ProgramGalleryItemDTO,
  TestimonialDTO,
} from "../types";
import {
  asArray,
  normalizeMedia,
  readLocalizedObjectValue,
  toNullableNumber,
} from "../utils";

export function mapGuidePreview(
  guide: GuideRow,
  translation: GuideTranslationRow | null,
): GuidePreviewDTO {
  return {
    slug: guide.slug,
    name: translation?.full_name ?? guide.slug,
    title: translation?.title ?? null,
    avatar: normalizeMedia(guide.avatar_url, translation?.full_name ?? null),
  };
}

export function mapProgramCategory(
  category: ProgramCategoryRow,
  translation: ProgramCategoryTranslationRow | null,
): CategoryDTO {
  return {
    slug: category.slug,
    name: translation?.name ?? category.slug,
    description: translation?.description ?? null,
  };
}

export function mapProgramCategoryFilter(
  category: ProgramCategoryRow,
  translation: ProgramCategoryTranslationRow | null,
): ProgramCategoryFilterDTO {
  return {
    slug: category.slug,
    name: translation?.name ?? category.slug,
    description: translation?.description ?? null,
    sortOrder: category.sort_order,
    isActive: category.is_active,
  };
}

export function mapProgramFaq(
  faq: ProgramFaqRow,
  translation: ProgramFaqTranslationRow | null,
): ProgramFAQDTO {
  return {
    id: faq.id,
    sortOrder: faq.sort_order,
    question: translation?.question ?? "",
    answer: translation?.answer ?? "",
  };
}

export function mapProgramGalleryItem(
  item: ProgramGalleryItemRow,
  locale: Locale,
): ProgramGalleryItemDTO {
  return {
    id: item.id,
    sortOrder: item.sort_order,
    media: {
      url: item.media_url,
      alt: readLocalizedObjectValue(item.alt_translations, locale),
      type: item.media_type,
    },
    caption: readLocalizedObjectValue(item.caption_translations, locale),
    isFeatured: item.is_featured,
  };
}

export function mapTestimonial(
  testimonial: TestimonialRow,
  translation: TestimonialTranslationRow | null,
  relatedProgramSlug: string | null,
): TestimonialDTO {
  return {
    id: testimonial.id,
    slug: testimonial.slug,
    quote: translation?.quote ?? "",
    authorName: translation?.author_name ?? "",
    authorTitle: translation?.author_title ?? null,
    rating: testimonial.rating,
    date: testimonial.testimonial_date,
    image: normalizeMedia(
      testimonial.author_image_url,
      translation?.author_name ?? null,
    ),
    isFeatured: testimonial.is_featured,
    relatedProgramSlug,
  };
}

interface ProgramCardMapInput {
  program: ProgramRow;
  translation: ProgramTranslationRow | null;
  categories: CategoryDTO[];
  guides: GuidePreviewDTO[];
}

export function mapProgramCardDTO({
  program,
  translation,
  categories,
  guides,
}: ProgramCardMapInput): ProgramCardDTO {
  return {
    id: program.id,
    slug: program.slug,
    status: program.status,
    bookingMode: program.booking_mode,
    title: translation?.title ?? program.slug,
    subtitle: translation?.subtitle ?? null,
    summary: translation?.summary ?? null,
    locationName: program.location_name,
    city: program.city,
    countryCode: program.country_code,
    startsAt: program.starts_at,
    endsAt: program.ends_at,
    durationDays: program.duration_days,
    durationNights: program.duration_nights,
    priceAmount: toNullableNumber(program.price_amount),
    priceCurrency: program.price_currency,
    capacity: program.capacity,
    spotsLeft: program.spots_left,
    isFeatured: program.is_featured,
    coverImage: normalizeMedia(
      program.cover_image_url,
      translation?.cover_image_alt ?? translation?.title ?? null,
    ),
    categories,
    guides,
  };
}

interface ProgramDetailMapInput extends ProgramCardMapInput {
  faqs: ProgramFAQDTO[];
  gallery: ProgramGalleryItemDTO[];
  testimonials: TestimonialDTO[];
}

export function mapProgramDetailDTO({
  program,
  translation,
  categories,
  guides,
  faqs,
  gallery,
  testimonials,
}: ProgramDetailMapInput): ProgramDetailDTO {
  const base = mapProgramCardDTO({
    program,
    translation,
    categories,
    guides,
  });

  return {
    ...base,
    storyMarkdown: translation?.story_markdown ?? null,
    archiveRecapMarkdown: translation?.archive_recap_markdown ?? null,
    archiveHighlights: asArray<string>(translation?.archive_highlights ?? [], []),
    whoIsItFor: asArray<string>(translation?.who_is_it_for ?? [], []),
    itinerary: asArray<unknown>(translation?.itinerary_json ?? [], []),
    includedItems: asArray<string>(translation?.included_items ?? [], []),
    excludedItems: asArray<string>(translation?.excluded_items ?? [], []),
    seoTitle: translation?.seo_title ?? null,
    seoDescription: translation?.seo_description ?? null,
    faqs,
    gallery,
    testimonials,
  };
}
