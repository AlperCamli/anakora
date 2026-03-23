# ANAKORA Content Model Summary

## Core Patterns
- Locale model: TR/EN via translation tables (`locale` column).
- Editorial entities use normalized base + translation rows.
- Homepage and site settings are localized rows per `locale`.
- Media is URL/reference-based, with Supabase Storage as source of truth.

## Admin-managed entities

### Testimonials
- Base table: `public.testimonials`
- Translation table: `public.testimonial_translations`
- Optional links:
  - `program_id` (primary/legacy direct link)
  - `public.program_testimonial_assignments` (explicit curation links)
- Key fields:
  - `is_featured`
  - `is_published`
  - `sort_order`

### Journal
- Base table: `public.journal_posts`
- Translation table: `public.journal_post_translations`
- Categories:
  - `public.journal_categories`
  - `public.journal_category_translations`
  - `public.journal_category_assignments`
- Publish flow:
  - `status` enum (`draft`, `published`, `archived`)
  - `published_at`

### Homepage
- Table: `public.homepage_sections`
- Key columns:
  - `section_key`
  - `locale`
  - `is_active`
  - `sort_order`
  - `payload_json`
- Payload is controlled by section-specific sanitization in admin.

### Site Settings
- Table: `public.site_settings`
- Existing keys include:
  - contact/navigation/footer/default SEO
- MVP extensions include:
  - `social_links` (jsonb object)
  - `notification_settings` (jsonb object)
  - `global_seo_image_url`
  - `reservation_notification_email`

## Public-site binding
- Public site reads from server data services in `src/server/data/services/*`.
- Homepage, Journal, Program, Testimonial, and layout/header/footer are data-driven from Supabase.
