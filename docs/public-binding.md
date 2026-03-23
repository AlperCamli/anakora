# Public Site Binding (Figma UI Preserved)

This milestone binds the existing ANAKORA public UI to live Supabase-backed content via the typed data layer.

## What was bound to live data

### Global layout/settings
- `Header` now reads:
  - logo text / site name
  - navigation links
  - locale switch (TR/EN)
- `Footer` now reads:
  - tagline
  - contact channels
  - legal links
  - newsletter enabled flag
- Source: `site_settings` through `getLayout(...)`.

### Homepage
- Replaced hardcoded collections with live queries:
  - sections/payloads: `homepage_sections`
  - featured programs: `programs` (+ translations)
  - featured testimonials: `testimonials` (+ translations)
  - journal preview: `journal_posts` (+ translations)
  - archive previews: `programs` with `completed` state via archive service
- Source: `getHomepage(...)`, `getProgramsList(...)`, `getArchive(...)`.

### Experiences listing
- Replaced mock program arrays with live list from `getProgramsList(...)`.
- Filter chips generated from live categories.

### Program detail
- Replaced mock object with live `getProgramDetailBySlug(...)`.
- Includes:
  - main translated content
  - categories
  - guides
  - itinerary, FAQs, gallery
  - pricing and availability

### Archive
- Replaced static year buckets with `getArchive(...)`.
- Grouping is now driven by real completed programs.

### Journal list and detail
- `JournalPage` now uses `getJournalList(...)`.
- Added live detail route/page:
  - `/jurnal/:slug` -> `JournalDetailPage`
  - source: `getJournalDetailBySlug(...)`.

### About page (applicable binding)
- Kept visual structure.
- Bound founder/guide block to live guides (`getGuides(...)`) with fallback.

## Hardcoded content status
- Primary content arrays/objects in public pages were removed and replaced with live service calls.
- Minimal fallback copy remains only for resilience when sections are missing.

## UX and CTA preservation
- Existing CTA placements and responsive layout were preserved:
  - hero actions
  - card CTAs
  - sticky mobile CTA
  - repeated section CTAs
- Users can still reach action points early in page flow.

## Key integration files
- `src/app/context/SiteDataContext.tsx`
- `src/app/pages/HomePage.tsx`
- `src/app/pages/ExperiencesPage.tsx`
- `src/app/pages/ProgramDetailPage.tsx`
- `src/app/pages/ArchivePage.tsx`
- `src/app/pages/JournalPage.tsx`
- `src/app/pages/JournalDetailPage.tsx`
- `src/app/pages/AboutPage.tsx`
- `src/app/routes.tsx`

## Public access policy note
- Public data reads and form inserts are enforced via RLS policies in:
  - `supabase/migrations/20260323101500_public_site_rls.sql`
