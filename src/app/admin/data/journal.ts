import { getSupabaseBrowserClient } from "../../../lib/supabase/browser-client";
import type {
  GuideOption,
  JournalCategoryEditorValue,
  JournalCategoryListItem,
  JournalPostEditorValue,
  JournalPostListItem,
} from "../types";
import {
  normalizeSlug,
  parseInteger,
  toDateTimeLocal,
  toIsoFromDateTimeLocal,
  trimOrNull,
} from "./_helpers";

function createEmptyTranslation() {
  return {
    title: "",
    excerpt: "",
    contentMarkdown: "",
    coverImageAlt: "",
    seoTitle: "",
    seoDescription: "",
  };
}

export function createEmptyJournalPostEditorValue(): JournalPostEditorValue {
  return {
    slug: "",
    status: "draft",
    coverImageUrl: "",
    isFeatured: false,
    readingTimeMinutes: "",
    publishedAt: "",
    primaryGuideId: "",
    categoryIds: [],
    tr: createEmptyTranslation(),
    en: createEmptyTranslation(),
  };
}

export function createEmptyJournalCategoryEditorValue(): JournalCategoryEditorValue {
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

export async function getJournalFormLookups(): Promise<{
  guides: GuideOption[];
  categories: JournalCategoryListItem[];
}> {
  const [guides, categories] = await Promise.all([
    listGuideOptions(),
    listJournalCategories(),
  ]);
  return { guides, categories };
}

async function listGuideOptions(): Promise<GuideOption[]> {
  const supabase = getSupabaseBrowserClient();
  const [{ data: guideRows, error: guidesError }, { data: translationRows, error: translationsError }] =
    await Promise.all([
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

  if (guidesError) {
    throw new Error(guidesError.message);
  }
  if (translationsError) {
    throw new Error(translationsError.message);
  }

  const translationMap = new Map<string, { tr?: string; en?: string }>();
  for (const row of (translationRows ?? []) as Array<Record<string, unknown>>) {
    const guideId = String(row.guide_id);
    const locale = String(row.locale);
    const fullName = String(row.full_name ?? "");
    const current = translationMap.get(guideId) ?? {};
    if (locale === "tr") {
      current.tr = fullName;
    }
    if (locale === "en") {
      current.en = fullName;
    }
    translationMap.set(guideId, current);
  }

  return ((guideRows ?? []) as Array<Record<string, unknown>>).map((row) => {
    const id = String(row.id);
    const labels = translationMap.get(id);
    return {
      id,
      slug: String(row.slug),
      name: labels?.tr || labels?.en || String(row.slug),
    };
  });
}

export async function listJournalPosts(): Promise<JournalPostListItem[]> {
  const supabase = getSupabaseBrowserClient();
  const [{ data: postRows, error: postsError }, { data: translationRows, error: translationsError }, { data: assignmentRows, error: assignmentsError }] =
    await Promise.all([
      supabase
        .from("journal_posts")
        .select(
          "id, slug, status, cover_image_url, is_featured, reading_time_minutes, published_at, updated_at",
        )
        .order("published_at", { ascending: false })
        .order("created_at", { ascending: false }),
      supabase
        .from("journal_post_translations")
        .select("post_id, locale, title")
        .in("locale", ["tr", "en"]),
      supabase
        .from("journal_category_assignments")
        .select("post_id, category_id"),
    ]);

  if (postsError) {
    throw new Error(postsError.message);
  }
  if (translationsError) {
    throw new Error(translationsError.message);
  }
  if (assignmentsError) {
    throw new Error(assignmentsError.message);
  }

  const translationMap = new Map<string, { tr?: string; en?: string }>();
  for (const row of (translationRows ?? []) as Array<Record<string, unknown>>) {
    const postId = String(row.post_id);
    const locale = String(row.locale);
    const title = String(row.title ?? "");
    const current = translationMap.get(postId) ?? {};
    if (locale === "tr") {
      current.tr = title;
    }
    if (locale === "en") {
      current.en = title;
    }
    translationMap.set(postId, current);
  }

  const categoryCountMap = new Map<string, number>();
  for (const row of (assignmentRows ?? []) as Array<Record<string, unknown>>) {
    const postId = String(row.post_id);
    categoryCountMap.set(postId, (categoryCountMap.get(postId) ?? 0) + 1);
  }

  return ((postRows ?? []) as Array<Record<string, unknown>>).map((row) => {
    const id = String(row.id);
    const translated = translationMap.get(id);
    return {
      id,
      slug: String(row.slug),
      status: String(row.status) as JournalPostListItem["status"],
      coverImageUrl: typeof row.cover_image_url === "string" ? row.cover_image_url : null,
      isFeatured: Boolean(row.is_featured),
      readingTimeMinutes:
        typeof row.reading_time_minutes === "number" ? row.reading_time_minutes : null,
      publishedAt: typeof row.published_at === "string" ? row.published_at : null,
      categoryCount: categoryCountMap.get(id) ?? 0,
      trTitle: translated?.tr ?? null,
      enTitle: translated?.en ?? null,
      updatedAt: String(row.updated_at ?? ""),
    };
  });
}

export async function getJournalPostEditorById(postId: string): Promise<JournalPostEditorValue> {
  const supabase = getSupabaseBrowserClient();
  const [{ data: postRow, error: postError }, { data: translationRows, error: translationError }, { data: assignmentRows, error: assignmentError }] =
    await Promise.all([
      supabase
        .from("journal_posts")
        .select(
          "id, slug, status, cover_image_url, is_featured, reading_time_minutes, published_at, primary_guide_id",
        )
        .eq("id", postId)
        .maybeSingle(),
      supabase
        .from("journal_post_translations")
        .select(
          "post_id, locale, title, excerpt, content_markdown, cover_image_alt, seo_title, seo_description",
        )
        .eq("post_id", postId)
        .in("locale", ["tr", "en"]),
      supabase
        .from("journal_category_assignments")
        .select("category_id, sort_order")
        .eq("post_id", postId)
        .order("sort_order", { ascending: true }),
    ]);

  if (postError) {
    throw new Error(postError.message);
  }
  if (translationError) {
    throw new Error(translationError.message);
  }
  if (assignmentError) {
    throw new Error(assignmentError.message);
  }
  if (!postRow) {
    throw new Error("Journal post not found.");
  }

  const trRow = ((translationRows ?? []) as Array<Record<string, unknown>>).find(
    (row) => row.locale === "tr",
  );
  const enRow = ((translationRows ?? []) as Array<Record<string, unknown>>).find(
    (row) => row.locale === "en",
  );

  return {
    id: String(postRow.id),
    slug: String(postRow.slug),
    status: String(postRow.status) as JournalPostEditorValue["status"],
    coverImageUrl: String(postRow.cover_image_url ?? ""),
    isFeatured: Boolean(postRow.is_featured),
    readingTimeMinutes:
      typeof postRow.reading_time_minutes === "number"
        ? String(postRow.reading_time_minutes)
        : "",
    publishedAt: toDateTimeLocal(
      typeof postRow.published_at === "string" ? postRow.published_at : null,
    ),
    primaryGuideId: String(postRow.primary_guide_id ?? ""),
    categoryIds: ((assignmentRows ?? []) as Array<Record<string, unknown>>).map((row) =>
      String(row.category_id),
    ),
    tr: {
      title: String(trRow?.title ?? ""),
      excerpt: String(trRow?.excerpt ?? ""),
      contentMarkdown: String(trRow?.content_markdown ?? ""),
      coverImageAlt: String(trRow?.cover_image_alt ?? ""),
      seoTitle: String(trRow?.seo_title ?? ""),
      seoDescription: String(trRow?.seo_description ?? ""),
    },
    en: {
      title: String(enRow?.title ?? ""),
      excerpt: String(enRow?.excerpt ?? ""),
      contentMarkdown: String(enRow?.content_markdown ?? ""),
      coverImageAlt: String(enRow?.cover_image_alt ?? ""),
      seoTitle: String(enRow?.seo_title ?? ""),
      seoDescription: String(enRow?.seo_description ?? ""),
    },
  };
}

export async function saveJournalPost(
  values: JournalPostEditorValue,
  adminUserId: string,
): Promise<string> {
  const supabase = getSupabaseBrowserClient();

  const slug = normalizeSlug(values.slug || values.tr.title || values.en.title);
  if (!slug) {
    throw new Error("Slug is required.");
  }
  if (!values.tr.title.trim() || !values.en.title.trim()) {
    throw new Error("Both TR and EN titles are required.");
  }
  if (!values.tr.contentMarkdown.trim() || !values.en.contentMarkdown.trim()) {
    throw new Error("Both TR and EN markdown content fields are required.");
  }

  const readingTimeMinutes = parseInteger(values.readingTimeMinutes, "Reading time");
  if (readingTimeMinutes !== null && readingTimeMinutes <= 0) {
    throw new Error("Reading time must be greater than zero.");
  }

  const explicitPublishedAt = toIsoFromDateTimeLocal(values.publishedAt, "Published at");
  let publishedAt = explicitPublishedAt;
  if (values.status === "published" && !publishedAt) {
    publishedAt = new Date().toISOString();
  }
  if (values.status !== "published") {
    publishedAt = null;
  }

  const payload = {
    slug,
    status: values.status,
    cover_image_url: trimOrNull(values.coverImageUrl),
    is_featured: values.isFeatured,
    reading_time_minutes: readingTimeMinutes,
    published_at: publishedAt,
    primary_guide_id: trimOrNull(values.primaryGuideId),
    author_profile_id: adminUserId,
    updated_by: adminUserId,
  };

  let postId = values.id;
  if (postId) {
    const { data, error } = await supabase
      .from("journal_posts")
      .update(payload)
      .eq("id", postId)
      .select("id")
      .single();
    if (error) {
      throw new Error(error.message);
    }
    postId = String(data.id);
  } else {
    const { data, error } = await supabase
      .from("journal_posts")
      .insert({
        ...payload,
        created_by: adminUserId,
      })
      .select("id")
      .single();
    if (error) {
      throw new Error(error.message);
    }
    postId = String(data.id);
  }

  const { error: translationError } = await supabase
    .from("journal_post_translations")
    .upsert(
      [
        {
          post_id: postId,
          locale: "tr",
          title: values.tr.title.trim(),
          excerpt: trimOrNull(values.tr.excerpt),
          content_markdown: values.tr.contentMarkdown.trim(),
          cover_image_alt: trimOrNull(values.tr.coverImageAlt),
          seo_title: trimOrNull(values.tr.seoTitle),
          seo_description: trimOrNull(values.tr.seoDescription),
        },
        {
          post_id: postId,
          locale: "en",
          title: values.en.title.trim(),
          excerpt: trimOrNull(values.en.excerpt),
          content_markdown: values.en.contentMarkdown.trim(),
          cover_image_alt: trimOrNull(values.en.coverImageAlt),
          seo_title: trimOrNull(values.en.seoTitle),
          seo_description: trimOrNull(values.en.seoDescription),
        },
      ],
      { onConflict: "post_id,locale" },
    );
  if (translationError) {
    throw new Error(translationError.message);
  }

  const { error: deleteAssignmentsError } = await supabase
    .from("journal_category_assignments")
    .delete()
    .eq("post_id", postId);
  if (deleteAssignmentsError) {
    throw new Error(deleteAssignmentsError.message);
  }

  const uniqueCategoryIds = [...new Set(values.categoryIds.map((item) => item.trim()).filter(Boolean))];
  if (uniqueCategoryIds.length > 0) {
    const { error: assignmentError } = await supabase
      .from("journal_category_assignments")
      .insert(
        uniqueCategoryIds.map((categoryId, index) => ({
          post_id: postId,
          category_id: categoryId,
          sort_order: index,
        })),
      );
    if (assignmentError) {
      throw new Error(assignmentError.message);
    }
  }

  return postId;
}

export async function listJournalCategories(): Promise<JournalCategoryListItem[]> {
  const supabase = getSupabaseBrowserClient();
  const [{ data: categoryRows, error: categoriesError }, { data: translationRows, error: translationsError }] =
    await Promise.all([
      supabase
        .from("journal_categories")
        .select("id, slug, sort_order, is_featured, is_active, updated_at")
        .order("sort_order", { ascending: true })
        .order("slug", { ascending: true }),
      supabase
        .from("journal_category_translations")
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

export async function getJournalCategoryEditorById(
  categoryId: string,
): Promise<JournalCategoryEditorValue> {
  const supabase = getSupabaseBrowserClient();
  const [{ data: categoryRow, error: categoryError }, { data: translationRows, error: translationError }] =
    await Promise.all([
      supabase
        .from("journal_categories")
        .select("id, slug, sort_order, is_featured, is_active")
        .eq("id", categoryId)
        .maybeSingle(),
      supabase
        .from("journal_category_translations")
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
    throw new Error("Journal category not found.");
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

export async function saveJournalCategory(
  values: JournalCategoryEditorValue,
): Promise<string> {
  const supabase = getSupabaseBrowserClient();
  const slug = normalizeSlug(values.slug || values.trName || values.enName);
  if (!slug) {
    throw new Error("Category slug is required.");
  }
  if (!values.trName.trim() || !values.enName.trim()) {
    throw new Error("Both TR and EN category names are required.");
  }

  const sortOrder = parseInteger(values.sortOrder, "Category sort order") ?? 0;

  const payload = {
    slug,
    sort_order: sortOrder,
    is_featured: values.isFeatured,
    is_active: values.isActive,
  };

  let categoryId = values.id;
  if (categoryId) {
    const { data, error } = await supabase
      .from("journal_categories")
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
      .from("journal_categories")
      .insert(payload)
      .select("id")
      .single();
    if (error) {
      throw new Error(error.message);
    }
    categoryId = String(data.id);
  }

  const { error: translationError } = await supabase
    .from("journal_category_translations")
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
