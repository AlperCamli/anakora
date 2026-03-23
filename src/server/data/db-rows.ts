export type JsonPrimitive = string | number | boolean | null;
export type JsonValue =
  | JsonPrimitive
  | { [key: string]: JsonValue }
  | JsonValue[];

export interface SiteSettingsRow {
  id: string;
  locale: "tr" | "en";
  site_name: string;
  logo_text: string | null;
  tagline: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  instagram_url: string | null;
  default_seo_title: string | null;
  default_seo_description: string | null;
  global_seo_image_url: string | null;
  reservation_notification_email: string | null;
  header_navigation: JsonValue;
  footer_legal_links: JsonValue;
  social_links: JsonValue;
  notification_settings: JsonValue;
  footer_newsletter_enabled: boolean;
}

export interface HomepageSectionRow {
  id: string;
  section_key:
    | "hero"
    | "brand_manifesto"
    | "experience_categories"
    | "upcoming_programs"
    | "why_anakora"
    | "archive_preview"
    | "testimonials"
    | "journal_preview"
    | "final_cta";
  locale: "tr" | "en";
  title: string | null;
  subtitle: string | null;
  payload_json: JsonValue;
  media_url: string | null;
  media_alt: string | null;
  sort_order: number;
  is_active: boolean;
}

export interface ProgramRow {
  id: string;
  slug: string;
  status: "upcoming" | "published" | "completed" | "cancelled";
  booking_mode: "direct" | "application" | "external";
  starts_at: string;
  ends_at: string | null;
  location_name: string;
  city: string | null;
  country_code: string | null;
  duration_days: number | null;
  duration_nights: number | null;
  capacity: number | null;
  spots_left: number | null;
  price_amount: number | null;
  price_currency: string | null;
  cover_image_url: string | null;
  external_booking_url: string | null;
  primary_guide_id: string | null;
  is_featured: boolean;
}

export interface ProgramTranslationRow {
  id: string;
  program_id: string;
  locale: "tr" | "en";
  title: string;
  subtitle: string | null;
  summary: string | null;
  story_markdown: string | null;
  cover_image_alt: string | null;
  who_is_it_for: JsonValue;
  itinerary_json: JsonValue;
  included_items: JsonValue;
  excluded_items: JsonValue;
  seo_title: string | null;
  seo_description: string | null;
}

export interface ProgramGalleryItemRow {
  id: string;
  program_id: string;
  media_type: "image" | "video";
  media_url: string;
  alt_translations: JsonValue;
  caption_translations: JsonValue;
  sort_order: number;
  is_featured: boolean;
}

export interface ProgramFaqRow {
  id: string;
  program_id: string;
  sort_order: number;
  is_active: boolean;
}

export interface ProgramFaqTranslationRow {
  id: string;
  faq_id: string;
  locale: "tr" | "en";
  question: string;
  answer: string;
}

export interface ProgramCategoryRow {
  id: string;
  slug: string;
  sort_order: number;
  is_featured: boolean;
  is_active: boolean;
}

export interface ProgramCategoryTranslationRow {
  id: string;
  category_id: string;
  locale: "tr" | "en";
  name: string;
  description: string | null;
}

export interface ProgramCategoryAssignmentRow {
  program_id: string;
  category_id: string;
  sort_order: number;
}

export interface ProgramGuideAssignmentRow {
  program_id: string;
  guide_id: string;
  role_label: string | null;
  is_primary: boolean;
  sort_order: number;
}

export interface GuideRow {
  id: string;
  slug: string;
  avatar_url: string | null;
  is_featured: boolean;
  is_active: boolean;
}

export interface GuideTranslationRow {
  id: string;
  guide_id: string;
  locale: "tr" | "en";
  full_name: string;
  title: string | null;
  bio: string | null;
}

export interface TestimonialRow {
  id: string;
  slug: string | null;
  program_id: string | null;
  guide_id: string | null;
  author_image_url: string | null;
  rating: number;
  testimonial_date: string | null;
  is_featured: boolean;
  is_published: boolean;
  sort_order: number;
}

export interface TestimonialTranslationRow {
  id: string;
  testimonial_id: string;
  locale: "tr" | "en";
  author_name: string;
  author_title: string | null;
  quote: string;
}

export interface ProgramTestimonialAssignmentRow {
  program_id: string;
  testimonial_id: string;
  sort_order: number;
}

export interface JournalPostRow {
  id: string;
  slug: string;
  status: "draft" | "published" | "archived";
  cover_image_url: string | null;
  is_featured: boolean;
  reading_time_minutes: number | null;
  published_at: string | null;
  primary_guide_id: string | null;
}

export interface JournalPostTranslationRow {
  id: string;
  post_id: string;
  locale: "tr" | "en";
  title: string;
  excerpt: string | null;
  content_markdown: string;
  cover_image_alt: string | null;
  seo_title: string | null;
  seo_description: string | null;
}

export interface JournalCategoryRow {
  id: string;
  slug: string;
  sort_order: number;
  is_featured: boolean;
  is_active: boolean;
}

export interface JournalCategoryTranslationRow {
  id: string;
  category_id: string;
  locale: "tr" | "en";
  name: string;
  description: string | null;
}

export interface JournalCategoryAssignmentRow {
  post_id: string;
  category_id: string;
  sort_order: number;
}
