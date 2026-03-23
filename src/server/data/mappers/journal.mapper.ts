import type {
  JournalCategoryRow,
  JournalCategoryTranslationRow,
  JournalPostRow,
  JournalPostTranslationRow,
} from "../db-rows";
import type {
  CategoryDTO,
  JournalPostDTO,
  JournalPostPreviewDTO,
} from "../types";
import { normalizeMedia } from "../utils";
import type { GuidePreviewDTO } from "../types";

export function mapJournalCategory(
  category: JournalCategoryRow,
  translation: JournalCategoryTranslationRow | null,
): CategoryDTO {
  return {
    slug: category.slug,
    name: translation?.name ?? category.slug,
    description: translation?.description ?? null,
  };
}

interface JournalPreviewInput {
  post: JournalPostRow;
  translation: JournalPostTranslationRow | null;
  categories: CategoryDTO[];
}

export function mapJournalPostPreviewDTO({
  post,
  translation,
  categories,
}: JournalPreviewInput): JournalPostPreviewDTO {
  return {
    slug: post.slug,
    title: translation?.title ?? post.slug,
    excerpt: translation?.excerpt ?? null,
    publishedAt: post.published_at,
    readTimeMinutes: post.reading_time_minutes,
    coverImage: normalizeMedia(
      post.cover_image_url,
      translation?.cover_image_alt ?? translation?.title ?? null,
    ),
    categories,
    isFeatured: post.is_featured,
  };
}

interface JournalDetailInput extends JournalPreviewInput {
  authorGuide: GuidePreviewDTO | null;
}

export function mapJournalPostDTO({
  post,
  translation,
  categories,
  authorGuide,
}: JournalDetailInput): JournalPostDTO {
  return {
    slug: post.slug,
    title: translation?.title ?? post.slug,
    excerpt: translation?.excerpt ?? null,
    contentMarkdown: translation?.content_markdown ?? "",
    publishedAt: post.published_at,
    readTimeMinutes: post.reading_time_minutes,
    coverImage: normalizeMedia(
      post.cover_image_url,
      translation?.cover_image_alt ?? translation?.title ?? null,
    ),
    categories,
    seoTitle: translation?.seo_title ?? null,
    seoDescription: translation?.seo_description ?? null,
    authorGuide,
  };
}
