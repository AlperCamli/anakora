# ANAKORA Supabase Schema

This document describes the backend content model implemented in:

- `supabase/migrations/20260323050000_anakora_content_model.sql`
- `supabase/migrations/20260323101500_public_site_rls.sql`
- `supabase/migrations/20260323120000_admin_cms_rls.sql`
- `supabase/migrations/20260323133000_admin_role_storage_hardening.sql`
- Optional seed scaffold: `supabase/seeds/20260323051000_anakora_seed_scaffold.sql`

## Design goals
- Preserve ANAKORA's curated editorial model (not a generic page builder).
- Support TR/EN with dedicated translation tables for structured domains.
- Separate publishable public content from operational lead data.
- Keep schema CMS-friendly for future admin dashboard workflows.

## Enums
- `app_locale`: `tr`, `en`
- `program_status`: `upcoming`, `published`, `completed`, `cancelled`
- `booking_mode`: `direct`, `application`, `external`
- `media_type`: `image`, `video`
- `journal_post_status`: `draft`, `published`, `archived`
- `homepage_section_key`: curated homepage section keys
- `lead_source`: `newsletter`, `program_booking`, `journal_newsletter`, `general_contact`, `waitlist`
- `lead_status`: `new`, `reviewed`, `contacted`, `qualified`, `converted`, `archived`, `spam`

## Tables (required domains)
1. `admin_profiles`
2. `programs`
3. `program_translations`
4. `program_gallery_items`
5. `program_faqs`
6. `program_faq_translations`
7. `program_categories`
8. `program_category_translations`
9. `program_category_assignments`
10. `guides`
11. `guide_translations`
12. `testimonials`
13. `testimonial_translations`
14. `journal_posts`
15. `journal_post_translations`
16. `journal_categories`
17. `journal_category_translations`
18. `journal_category_assignments`
19. `homepage_sections`
20. `site_settings`
21. `lead_submissions`

### Additional helper relation tables
- `program_guide_assignments`: many-to-many linking for programs <-> guides.
- `program_testimonial_assignments`: explicit curation of testimonial ordering per program.

## Translation strategy
- Program content: `program_translations`, `program_faq_translations`
- Program taxonomy: `program_category_translations`
- Guide content: `guide_translations`
- Testimonial content: `testimonial_translations`
- Journal content: `journal_post_translations`, `journal_category_translations`
- Homepage sections and site settings are localized with `locale` per row.
- Fallback strategy in data layer: requested locale -> fallback locale (`tr`) -> first available.

## Key constraints and checks
- Slug format checks on slug-bearing tables.
- Program booking constraint:
  - `booking_mode = external` requires `external_booking_url`.
- Program date integrity:
  - `ends_at >= starts_at`.
- Capacity integrity:
  - `spots_left <= capacity` when both exist.
- JSON structure checks:
  - arrays for `who_is_it_for`, itinerary/included/excluded lists.
  - objects for homepage payload and gallery translation JSON.
  - arrays for navigations/legal links in `site_settings`.
- Lead contact integrity:
  - at least one of `email` or `phone` must be present in `lead_submissions`.

## Featured content support
- `is_featured` on:
  - `programs`
  - `program_categories`
  - `guides`
  - `testimonials`
  - `journal_posts`
  - `journal_categories`

## Indexing strategy (highlights)
- Program discovery:
  - `(status, starts_at)`
  - featured partial index
- Journal listing:
  - `(status, published_at desc)`
  - featured partial index
- Translation lookups:
  - `(foreign_id, locale)` indexes across translation tables
- Lead pipeline:
  - `(status, submitted_at desc)`
  - source/program indexes

## Timestamp behavior
- `created_at` and `updated_at` on editorial/operational tables.
- `public.set_updated_at()` trigger applied to update-aware tables.

## RLS policy layer
- RLS enabled across content and operational tables.
- Public site reads (`anon`/`authenticated`) are limited to publishable content:
  - active homepage sections/site settings
  - programs in `upcoming|published|completed`
  - published testimonials and journal posts
  - active categories/guides and linked translation/assignment rows
- Public writes are limited to `lead_submissions` inserts with `status='new'`.
- No public select/update/delete policy is defined for `lead_submissions`.

## Notes for CMS implementation
- Status fields and structured translation tables support editorial workflows.
- `homepage_sections.payload_json` intentionally allows controlled section-specific payloads.
- `site_settings` now includes MVP extension columns:
  - `social_links` (jsonb object)
  - `notification_settings` (jsonb object)
  - `global_seo_image_url` (text)
  - `reservation_notification_email` (text)
- Storage buckets used by admin media workflows:
  - `public-assets`
  - `admin-uploads`
- `site_settings` is global per locale and designed for layout/header/footer configuration.
