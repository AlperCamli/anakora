# Future Extensibility Notes

## Short-term Enhancements
- Add dedicated `/admin/testimonials/new` and `/admin/journal/new` routes (currently in-page editors).
- Add reusable media picker modal for direct integration in all image URL fields.
- Add delete/archive actions with confirmation flows for editorial entities.
- Add richer locale completeness scoring per field group.

## Data/Workflow Enhancements
- Add audit trail table for admin mutations (who/what/when snapshots).
- Add revision history for homepage and journal content.
- Add scheduled publishing for journal posts.
- Add webhook/automation hooks from `notification_settings`.

## Platform Hardening
- Add transactional server-side mutation endpoints for multi-table writes.
- Add integration tests for role/RLS matrix.
- Add observability around Supabase errors and storage failures.

## Public-site Improvements
- Consume `global_seo_image_url` and locale SEO defaults in meta tags.
- Expand homepage payload usage to support section-level CTA/variant rendering.
- Move more static sections (About, legal pages) to CMS-managed content where needed.
