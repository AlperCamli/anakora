import { getSupabaseBrowserClient } from "../../../lib/supabase/browser-client";
import type {
  HomepageSectionEditorValue,
  HomepageSectionKey,
  HomepageSectionLocaleValue,
} from "../types";
import { parseInteger, parseJsonObject, stringifyJson, trimOrNull } from "./_helpers";

export const HOMEPAGE_SECTION_ORDER: HomepageSectionKey[] = [
  "hero",
  "brand_manifesto",
  "experience_categories",
  "upcoming_programs",
  "why_anakora",
  "archive_preview",
  "testimonials",
  "journal_preview",
  "final_cta",
];

const SECTION_HINTS: Record<HomepageSectionKey, string> = {
  hero: 'Sadece `primaryCta` ve `secondaryCta` link nesneleri desteklenir: {"label":"...","href":"..."}',
  brand_manifesto: "Mevcut public arayuzde ozel payload alani kullanilmiyor.",
  experience_categories: "Mevcut public arayuzde ozel payload alani kullanilmiyor.",
  upcoming_programs: "Mevcut public arayuzde ozel payload alani kullanilmiyor.",
  why_anakora: 'Sadece `items` dizisi desteklenir: [{"title":"...","description":"..."}]',
  archive_preview: "Mevcut public arayuzde ozel payload alani kullanilmiyor.",
  testimonials: "Mevcut public arayuzde ozel payload alani kullanilmiyor.",
  journal_preview: "Mevcut public arayuzde ozel payload alani kullanilmiyor.",
  final_cta: "Mevcut public arayuzde ozel payload alani kullanilmiyor.",
};

const DEFAULT_PAYLOADS: Record<HomepageSectionKey, Record<string, unknown>> = {
  hero: {
    primaryCta: { label: "", href: "/deneyimler" },
    secondaryCta: { label: "", href: "/hakkinda" },
  },
  brand_manifesto: {},
  experience_categories: {},
  upcoming_programs: {},
  why_anakora: {
    items: [],
  },
  archive_preview: {},
  testimonials: {},
  journal_preview: {},
  final_cta: {},
};

function asRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }
  return value as Record<string, unknown>;
}

function sanitizeLink(value: unknown) {
  const obj = asRecord(value);
  const label = typeof obj.label === "string" ? obj.label.trim() : "";
  const href = typeof obj.href === "string" ? obj.href.trim() : "";
  if (!label || !href) {
    return null;
  }
  return { label, href };
}

function sanitizeWhyItems(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => {
      const obj = asRecord(item);
      const title = typeof obj.title === "string" ? obj.title.trim() : "";
      const description =
        typeof obj.description === "string" ? obj.description.trim() : "";
      if (!title || !description) {
        return null;
      }
      return { title, description };
    })
    .filter((item): item is { title: string; description: string } => Boolean(item));
}

export function sanitizeHomepagePayload(
  sectionKey: HomepageSectionKey,
  payload: Record<string, unknown>,
): Record<string, unknown> {
  if (sectionKey === "hero") {
    const primaryCta = sanitizeLink(payload.primaryCta);
    const secondaryCta = sanitizeLink(payload.secondaryCta);
    const safePayload: Record<string, unknown> = {};
    if (primaryCta) {
      safePayload.primaryCta = primaryCta;
    }
    if (secondaryCta) {
      safePayload.secondaryCta = secondaryCta;
    }
    return safePayload;
  }

  if (sectionKey === "why_anakora") {
    return {
      items: sanitizeWhyItems(payload.items),
    };
  }

  return {};
}

function createLocaleValue(sortOrder: number): HomepageSectionLocaleValue {
  return {
    title: "",
    subtitle: "",
    payloadJson: "{}",
    mediaUrl: "",
    mediaAlt: "",
    isActive: true,
    sortOrder: String(sortOrder),
  };
}

function createDefaultSection(key: HomepageSectionKey, index: number): HomepageSectionEditorValue {
  return {
    key,
    tr: {
      ...createLocaleValue((index + 1) * 10),
      payloadJson: stringifyJson(DEFAULT_PAYLOADS[key], "object"),
    },
    en: {
      ...createLocaleValue((index + 1) * 10),
      payloadJson: stringifyJson(DEFAULT_PAYLOADS[key], "object"),
    },
  };
}

export function getHomepageSectionHint(sectionKey: HomepageSectionKey) {
  return SECTION_HINTS[sectionKey];
}

export async function listHomepageSections(): Promise<HomepageSectionEditorValue[]> {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("homepage_sections")
    .select(
      "id, section_key, locale, title, subtitle, payload_json, media_url, media_alt, is_active, sort_order",
    )
    .in("locale", ["tr", "en"])
    .order("sort_order", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  const rows = (data ?? []) as Array<Record<string, unknown>>;
  const map = new Map<HomepageSectionKey, HomepageSectionEditorValue>();
  for (const [index, key] of HOMEPAGE_SECTION_ORDER.entries()) {
    map.set(key, createDefaultSection(key, index));
  }

  for (const row of rows) {
    const key = String(row.section_key) as HomepageSectionKey;
    const locale = String(row.locale);
    const current = map.get(key);
    if (!current || (locale !== "tr" && locale !== "en")) {
      continue;
    }

    const nextLocaleValue: HomepageSectionLocaleValue = {
      id: String(row.id),
      title: String(row.title ?? ""),
      subtitle: String(row.subtitle ?? ""),
      payloadJson: stringifyJson(row.payload_json, "object"),
      mediaUrl: String(row.media_url ?? ""),
      mediaAlt: String(row.media_alt ?? ""),
      isActive: Boolean(row.is_active),
      sortOrder: String(row.sort_order ?? current.tr.sortOrder),
    };

    map.set(key, {
      ...current,
      [locale]: nextLocaleValue,
    });
  }

  return HOMEPAGE_SECTION_ORDER.map((key) => map.get(key)!).sort((a, b) => {
    const sortA = parseInteger(a.tr.sortOrder, "Siralama") ?? 0;
    const sortB = parseInteger(b.tr.sortOrder, "Siralama") ?? 0;
    return sortA - sortB;
  });
}

export async function saveHomepageSections(
  sections: HomepageSectionEditorValue[],
  adminUserId: string,
): Promise<void> {
  const supabase = getSupabaseBrowserClient();
  const upsertRows: Array<Record<string, unknown>> = [];

  for (const section of sections) {
    const globalSortOrder = parseInteger(section.tr.sortOrder, `${section.key} siralama`) ?? 0;
    const globalActive = section.tr.isActive;

    const trPayload = sanitizeHomepagePayload(
      section.key,
      parseJsonObject(section.tr.payloadJson, `${section.key} TR payload`),
    );
    const enPayload = sanitizeHomepagePayload(
      section.key,
      parseJsonObject(section.en.payloadJson, `${section.key} EN payload`),
    );

    upsertRows.push(
      {
        section_key: section.key,
        locale: "tr",
        title: trimOrNull(section.tr.title),
        subtitle: trimOrNull(section.tr.subtitle),
        payload_json: trPayload,
        media_url: trimOrNull(section.tr.mediaUrl),
        media_alt: trimOrNull(section.tr.mediaAlt),
        is_active: globalActive,
        sort_order: globalSortOrder,
        updated_by: adminUserId,
      },
      {
        section_key: section.key,
        locale: "en",
        title: trimOrNull(section.en.title),
        subtitle: trimOrNull(section.en.subtitle),
        payload_json: enPayload,
        media_url: trimOrNull(section.en.mediaUrl),
        media_alt: trimOrNull(section.en.mediaAlt),
        is_active: globalActive,
        sort_order: globalSortOrder,
        updated_by: adminUserId,
      },
    );
  }

  const { error } = await supabase
    .from("homepage_sections")
    .upsert(upsertRows, { onConflict: "section_key,locale" });
  if (error) {
    throw new Error(error.message);
  }
}
