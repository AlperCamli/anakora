# Programs CMS Module

This document describes the implemented Programs CMS for ANAKORA admin.

## Delivered capabilities

## 1) Programs list (`/admin/programs`)
- Full program listing from Supabase.
- Filtering:
  - status
  - booking mode
  - featured only
  - free-text search (slug/title/location)
- Sorting:
  - starts date (newest/oldest)
  - recently updated
  - title A-Z
- Quick actions:
  - edit program
  - preview public URL (`/deneyimler/:slug`)
  - create new program

## 2) Program create/edit (`/admin/programs/new`, `/admin/programs/:programId`)

### General fields
- slug
- status
- booking mode
- external booking URL (required when mode is `external`)
- location name, city, country code
- featured state
- cover image upload/select with preview (stored as URL in `cover_image_url`)

### Type/scope and operations fields
- start/end datetime
- duration days/nights
- price amount/currency
- capacity/spots left
- linked primary guide
- type/scope via `program_categories` assignments

### TR/EN translation editing
For both locales:
- title
- subtitle
- summary
- story markdown
- cover image alt
- who-is-it-for list (line-based)
- itinerary JSON array
- included/excluded lists (line-based)
- SEO title/description

### FAQ editing
- Add/remove FAQ items
- Active/inactive state per FAQ
- TR and EN question/answer fields
- Persisted through:
  - `program_faqs`
  - `program_faq_translations`

### Publish/update flow
- `Save changes` keeps chosen status.
- `Publish` forces status to `published` and saves.

### Preview
- Preview button opens public detail route based on current slug.

### Gallery hooks/placeholders
- Editor shows current `program_gallery_items` count when editing existing program.
- Includes clear hook to continue with full gallery CRUD later.

## Data persistence tables touched
- `programs`
- `program_translations`
- `program_category_assignments`
- `program_faqs`
- `program_faq_translations`
- read-only lookups from `guides`, `guide_translations`, `program_categories`, `program_category_translations`

## Key files
- `src/app/admin/pages/AdminProgramsPage.tsx`
- `src/app/admin/pages/AdminProgramEditorPage.tsx`
- `src/app/admin/data/programs.ts`
- `src/app/admin/types.ts`

## Validation highlights
- Slug normalization and required checks.
- Required TR/EN titles.
- Required external booking URL for external mode.
- Date parsing and numeric field parsing.
- Itinerary JSON must be a valid array.

## Notes for next iteration
- Add dedicated gallery CRUD UI over `program_gallery_items`.
- Add explicit publish history / draft revisions if editorial workflow expands.
- Add optimistic updates or query caching for larger datasets.
