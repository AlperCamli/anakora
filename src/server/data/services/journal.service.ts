import { getDataClient, type DataClient } from "../client";
import type {
  GuideRow,
  GuideTranslationRow,
  JournalCategoryAssignmentRow,
  JournalCategoryRow,
  JournalCategoryTranslationRow,
  JournalPostRow,
  JournalPostTranslationRow,
} from "../db-rows";
import { DataLayerError, throwIfQueryError } from "../errors";
import { mapGuidePreview } from "../mappers/program.mapper";
import {
  mapJournalCategory,
  mapJournalPostDTO,
  mapJournalPostPreviewDTO,
} from "../mappers/journal.mapper";
import {
  DEFAULT_LOCALE,
  type CategoryDTO,
  type JournalListDTO,
  type JournalPostDTO,
  type JournalPostPreviewDTO,
  type Locale,
} from "../types";
import { groupBy, localeCandidates, pickTranslation } from "../utils";
import { asRows, uniqueIds } from "./_shared";

async function loadJournalCategoriesForPosts(
  postIds: string[],
  locale: Locale,
  client: DataClient,
): Promise<Record<string, CategoryDTO[]>> {
  if (postIds.length === 0) {
    return {};
  }

  const { data: assignmentData, error: assignmentError } = await client
    .from("journal_category_assignments")
    .select("post_id, category_id, sort_order")
    .in("post_id", postIds);
  throwIfQueryError(
    "loadJournalCategoriesForPosts:journal_category_assignments",
    assignmentError,
  );
  const assignments = asRows(assignmentData as JournalCategoryAssignmentRow[]);

  const categoryIds = uniqueIds(assignments.map((row) => row.category_id));
  if (categoryIds.length === 0) {
    return {};
  }

  const { data: categoryData, error: categoryError } = await client
    .from("journal_categories")
    .select("id, slug, sort_order, is_featured, is_active")
    .in("id", categoryIds)
    .eq("is_active", true);
  throwIfQueryError("loadJournalCategoriesForPosts:journal_categories", categoryError);
  const categories = asRows(categoryData as JournalCategoryRow[]);
  const categoryById = categories.reduce<Record<string, JournalCategoryRow>>(
    (acc, row) => {
      acc[row.id] = row;
      return acc;
    },
    {},
  );

  const { data: translationData, error: translationError } = await client
    .from("journal_category_translations")
    .select("id, category_id, locale, name, description")
    .in("category_id", categoryIds)
    .in("locale", localeCandidates(locale));
  throwIfQueryError(
    "loadJournalCategoriesForPosts:journal_category_translations",
    translationError,
  );
  const translations = asRows(translationData as JournalCategoryTranslationRow[]);
  const translationsByCategory = groupBy(translations, (row) => row.category_id);

  const categoriesByPost: Record<string, CategoryDTO[]> = {};
  for (const assignment of assignments.sort((a, b) => a.sort_order - b.sort_order)) {
    const category = categoryById[assignment.category_id];
    if (!category) {
      continue;
    }

    const mapped = mapJournalCategory(
      category,
      pickTranslation(translationsByCategory[category.id] ?? [], locale),
    );
    if (!categoriesByPost[assignment.post_id]) {
      categoriesByPost[assignment.post_id] = [];
    }
    categoriesByPost[assignment.post_id].push(mapped);
  }

  return categoriesByPost;
}

async function loadJournalAuthorGuide(
  guideId: string | null,
  locale: Locale,
  client: DataClient,
) {
  if (!guideId) {
    return null;
  }

  const { data: guideData, error: guideError } = await client
    .from("guides")
    .select("id, slug, avatar_url, is_featured, is_active")
    .eq("id", guideId)
    .eq("is_active", true)
    .maybeSingle();
  throwIfQueryError("loadJournalAuthorGuide:guides", guideError);
  if (!guideData) {
    return null;
  }

  const guide = guideData as GuideRow;
  const { data: translationData, error: translationError } = await client
    .from("guide_translations")
    .select("id, guide_id, locale, full_name, title, bio")
    .eq("guide_id", guide.id)
    .in("locale", localeCandidates(locale));
  throwIfQueryError("loadJournalAuthorGuide:guide_translations", translationError);
  const translation = pickTranslation(
    asRows(translationData as GuideTranslationRow[]),
    locale,
  );

  return mapGuidePreview(guide, translation);
}

export async function getJournalList(
  locale: Locale = DEFAULT_LOCALE,
  client: DataClient = getDataClient(),
): Promise<JournalListDTO> {
  const { data: postData, error: postError } = await client
    .from("journal_posts")
    .select(
      "id, slug, status, cover_image_url, is_featured, reading_time_minutes, published_at, primary_guide_id",
    )
    .eq("status", "published")
    .order("published_at", { ascending: false });
  throwIfQueryError("getJournalList:journal_posts", postError);
  const posts = asRows(postData as JournalPostRow[]);

  if (posts.length === 0) {
    return {
      locale,
      categories: [],
      featuredPost: null,
      posts: [],
    };
  }

  const postIds = posts.map((post) => post.id);
  const { data: translationData, error: translationError } = await client
    .from("journal_post_translations")
    .select(
      "id, post_id, locale, title, excerpt, content_markdown, cover_image_alt, seo_title, seo_description",
    )
    .in("post_id", postIds)
    .in("locale", localeCandidates(locale));
  throwIfQueryError("getJournalList:journal_post_translations", translationError);
  const translations = asRows(translationData as JournalPostTranslationRow[]);
  const translationByPost = groupBy(translations, (row) => row.post_id);

  const categoriesByPost = await loadJournalCategoriesForPosts(
    postIds,
    locale,
    client,
  );

  const previews: JournalPostPreviewDTO[] = posts.map((post) =>
    mapJournalPostPreviewDTO({
      post,
      translation: pickTranslation(translationByPost[post.id] ?? [], locale),
      categories: categoriesByPost[post.id] ?? [],
    }),
  );

  const featuredPost = previews.find((post) => post.isFeatured) ?? previews[0] ?? null;

  const categoryMap = previews
    .flatMap((post) => post.categories)
    .reduce<Record<string, CategoryDTO>>((acc, category) => {
      acc[category.slug] = category;
      return acc;
    }, {});

  return {
    locale,
    categories: Object.values(categoryMap),
    featuredPost,
    posts: previews,
  };
}

export async function getJournalDetailBySlug(
  slug: string,
  locale: Locale = DEFAULT_LOCALE,
  client: DataClient = getDataClient(),
): Promise<JournalPostDTO | null> {
  const { data: postData, error: postError } = await client
    .from("journal_posts")
    .select(
      "id, slug, status, cover_image_url, is_featured, reading_time_minutes, published_at, primary_guide_id",
    )
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();
  throwIfQueryError("getJournalDetailBySlug:journal_posts", postError);

  if (!postData) {
    return null;
  }
  const post = postData as JournalPostRow;

  const { data: translationData, error: translationError } = await client
    .from("journal_post_translations")
    .select(
      "id, post_id, locale, title, excerpt, content_markdown, cover_image_alt, seo_title, seo_description",
    )
    .eq("post_id", post.id)
    .in("locale", localeCandidates(locale));
  throwIfQueryError(
    "getJournalDetailBySlug:journal_post_translations",
    translationError,
  );
  const translation = pickTranslation(
    asRows(translationData as JournalPostTranslationRow[]),
    locale,
  );
  if (!translation) {
    throw new DataLayerError(
      "getJournalDetailBySlug:translation",
      `Journal post ${slug} has no translations for requested locale or fallback.`,
    );
  }

  const categoriesByPost = await loadJournalCategoriesForPosts(
    [post.id],
    locale,
    client,
  );
  const authorGuide = await loadJournalAuthorGuide(
    post.primary_guide_id,
    locale,
    client,
  );

  return mapJournalPostDTO({
    post,
    translation,
    categories: categoriesByPost[post.id] ?? [],
    authorGuide,
  });
}
