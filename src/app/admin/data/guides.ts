import { getSupabaseBrowserClient } from "../../../lib/supabase/browser-client";
import type { GuideEditorValue, GuideListItem } from "../types";

function trimOrNull(value: string): string | null {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
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

export function createEmptyGuideEditorValue(): GuideEditorValue {
  return {
    slug: "",
    email: "",
    instagramHandle: "",
    avatarUrl: "",
    isFeatured: false,
    isActive: true,
    tr: {
      fullName: "",
      title: "",
      bio: "",
    },
    en: {
      fullName: "",
      title: "",
      bio: "",
    },
  };
}

export async function listGuides(): Promise<GuideListItem[]> {
  const supabase = getSupabaseBrowserClient();

  const [{ data: guidesData, error: guidesError }, { data: translationData, error: translationError }, { data: programData, error: programError }] = await Promise.all([
    supabase
      .from("guides")
      .select(
        "id, slug, email, instagram_handle, avatar_url, is_featured, is_active, updated_at",
      )
      .order("updated_at", { ascending: false }),
    supabase
      .from("guide_translations")
      .select("guide_id, locale, full_name")
      .in("locale", ["tr", "en"]),
    supabase.from("programs").select("primary_guide_id").not("primary_guide_id", "is", null),
  ]);

  if (guidesError) {
    throw new Error(guidesError.message);
  }
  if (translationError) {
    throw new Error(translationError.message);
  }
  if (programError) {
    throw new Error(programError.message);
  }

  const translationMap = new Map<string, { tr?: string; en?: string }>();
  for (const row of (translationData ?? []) as Array<Record<string, unknown>>) {
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

  const linkedProgramMap = new Map<string, number>();
  for (const row of (programData ?? []) as Array<Record<string, unknown>>) {
    const guideId = String(row.primary_guide_id);
    linkedProgramMap.set(guideId, (linkedProgramMap.get(guideId) ?? 0) + 1);
  }

  return ((guidesData ?? []) as Array<Record<string, unknown>>).map((row) => {
    const id = String(row.id);
    const translation = translationMap.get(id);

    return {
      id,
      slug: String(row.slug),
      email: typeof row.email === "string" ? row.email : null,
      instagramHandle:
        typeof row.instagram_handle === "string" ? row.instagram_handle : null,
      avatarUrl: typeof row.avatar_url === "string" ? row.avatar_url : null,
      isFeatured: Boolean(row.is_featured),
      isActive: Boolean(row.is_active),
      trName: translation?.tr ?? null,
      enName: translation?.en ?? null,
      linkedProgramCount: linkedProgramMap.get(id) ?? 0,
      updatedAt: String(row.updated_at ?? ""),
    };
  });
}

export async function getGuideEditorById(guideId: string): Promise<GuideEditorValue> {
  const supabase = getSupabaseBrowserClient();
  const { data: guideData, error: guideError } = await supabase
    .from("guides")
    .select(
      "id, slug, email, instagram_handle, avatar_url, is_featured, is_active",
    )
    .eq("id", guideId)
    .maybeSingle();

  if (guideError) {
    throw new Error(guideError.message);
  }
  if (!guideData) {
    throw new Error("Guide not found.");
  }

  const { data: translationData, error: translationError } = await supabase
    .from("guide_translations")
    .select("locale, full_name, title, bio")
    .eq("guide_id", guideId)
    .in("locale", ["tr", "en"]);

  if (translationError) {
    throw new Error(translationError.message);
  }

  const tr = (translationData ?? []).find(
    (row: Record<string, unknown>) => row.locale === "tr",
  ) as Record<string, unknown> | undefined;
  const en = (translationData ?? []).find(
    (row: Record<string, unknown>) => row.locale === "en",
  ) as Record<string, unknown> | undefined;

  return {
    id: String(guideData.id),
    slug: String(guideData.slug),
    email: String(guideData.email ?? ""),
    instagramHandle: String(guideData.instagram_handle ?? ""),
    avatarUrl: String(guideData.avatar_url ?? ""),
    isFeatured: Boolean(guideData.is_featured),
    isActive: Boolean(guideData.is_active),
    tr: {
      fullName: String(tr?.full_name ?? ""),
      title: String(tr?.title ?? ""),
      bio: String(tr?.bio ?? ""),
    },
    en: {
      fullName: String(en?.full_name ?? ""),
      title: String(en?.title ?? ""),
      bio: String(en?.bio ?? ""),
    },
  };
}

export async function getGuideLinkedPrograms(guideId: string): Promise<
  Array<{ id: string; slug: string; status: string }>
> {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("programs")
    .select("id, slug, status")
    .eq("primary_guide_id", guideId)
    .order("starts_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return ((data ?? []) as Array<Record<string, unknown>>).map((row) => ({
    id: String(row.id),
    slug: String(row.slug),
    status: String(row.status),
  }));
}

export async function saveGuide(
  values: GuideEditorValue,
  adminUserId: string,
): Promise<string> {
  const supabase = getSupabaseBrowserClient();

  const slug = normalizeSlug(values.slug || values.tr.fullName || values.en.fullName);
  if (!slug) {
    throw new Error("Guide slug is required.");
  }
  if (!values.tr.fullName.trim() || !values.en.fullName.trim()) {
    throw new Error("Both TR and EN full names are required.");
  }

  const payload = {
    slug,
    email: trimOrNull(values.email),
    instagram_handle: trimOrNull(values.instagramHandle),
    avatar_url: trimOrNull(values.avatarUrl),
    is_featured: values.isFeatured,
    is_active: values.isActive,
    updated_by: adminUserId,
  };

  let guideId = values.id;

  if (guideId) {
    const { data, error } = await supabase
      .from("guides")
      .update(payload)
      .eq("id", guideId)
      .select("id")
      .single();

    if (error) {
      throw new Error(error.message);
    }

    guideId = String(data.id);
  } else {
    const { data, error } = await supabase
      .from("guides")
      .insert({
        ...payload,
        created_by: adminUserId,
      })
      .select("id")
      .single();

    if (error) {
      throw new Error(error.message);
    }

    guideId = String(data.id);
  }

  const { error: translationError } = await supabase
    .from("guide_translations")
    .upsert(
      [
        {
          guide_id: guideId,
          locale: "tr",
          full_name: values.tr.fullName.trim(),
          title: trimOrNull(values.tr.title),
          bio: trimOrNull(values.tr.bio),
        },
        {
          guide_id: guideId,
          locale: "en",
          full_name: values.en.fullName.trim(),
          title: trimOrNull(values.en.title),
          bio: trimOrNull(values.en.bio),
        },
      ],
      { onConflict: "guide_id,locale" },
    );

  if (translationError) {
    throw new Error(translationError.message);
  }

  return guideId;
}
