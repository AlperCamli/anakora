# Repository Audit: Public Frontend Baseline

## Scope and constraints
- Public website UI is Figma-generated and should remain visually unchanged.
- This audit maps current structure and identifies where backend integration can happen without redesign.
- Target backend stack: Supabase Postgres, Supabase Auth, Supabase Storage, and a custom admin dashboard.

## Current frontend architecture
- Framework/runtime: Vite + React + React Router SPA.
- Entry point: `src/main.tsx` -> `src/app/App.tsx` -> router in `src/app/routes.tsx`.
- Global layout shell: `src/app/components/Layout.tsx`.
  - Shared across all routed pages: `Header`, `Footer`, `MobileStickyCTA`.
- Styling stack:
  - Tailwind v4 via `@tailwindcss/vite`.
  - Theme tokens and typography in `src/styles/theme.css`.
  - Large generated UI component set in `src/app/components/ui/*`.

## Public routes/pages (currently implemented)
- `/` -> `HomePage`
- `/deneyimler` -> `ExperiencesPage`
- `/deneyimler/:id` -> `ProgramDetailPage`
- `/arsiv` -> `ArchivePage`
- `/jurnal` -> `JournalPage`
- `/hakkinda` -> `AboutPage`

## Linked routes that are not currently implemented in router
- `/jurnal/:id` (linked from Home and Journal cards)
- `/gizlilik` (footer)
- `/sartlar` (footer)

## Shared components and layout structures
- Global shell:
  - `src/app/components/Layout.tsx` (header/main/footer/mobile CTA composition)
  - `src/app/components/Header.tsx` (navigation, language toggle state, top CTA)
  - `src/app/components/Footer.tsx` (links, social/contact, newsletter form)
  - `src/app/components/MobileStickyCTA.tsx` (scroll-triggered CTA on mobile)
- Reusable content cards:
  - `ExperienceCard`, `ProgramCard`, `TestimonialCard`
- Reusable page structure patterns:
  - Hero section + text intro + content grids
  - Sticky filter bars (`ExperiencesPage`, `ArchivePage`)
  - CTA bands near page bottom
  - Program detail split layout: main narrative + sticky sidebar

## Hardcoded or mocked content map
- `HomePage.tsx`
  - Local arrays: `experiences`, `upcomingPrograms`, `testimonials`, `whyAnakora`, `journalPosts`.
  - Hero text, manifesto partner logos, archive preview images, final CTA copy are inline.
- `ExperiencesPage.tsx`
  - Local arrays: `filters`, `programs`.
  - In-memory filter logic only.
- `ProgramDetailPage.tsx`
  - Single hardcoded `program` object.
  - Explicit comment indicates mock data.
  - URL param `id` is read but not used for real lookup.
- `ArchivePage.tsx`
  - Local `years` list and `archiveItems` object keyed by year.
- `JournalPage.tsx`
  - Local `posts` array; featured post picked from `posts[0]`.
- `AboutPage.tsx`
  - Local `values` array plus static founder/story/philosophy copy.
- `Header.tsx` and `Footer.tsx`
  - Hardcoded nav labels, brand copy, contact info, legal links, and newsletter text.

## Current forms and CTA surfaces
- Forms (all presentational, no submit handlers or backend calls):
  - Footer newsletter form (`Footer.tsx`)
  - Journal newsletter form (`JournalPage.tsx`)
  - Program booking modal form (`ProgramDetailPage.tsx`)
- CTA patterns:
  - Route CTAs to `/deneyimler`, `/hakkinda`, `/arsiv`, `/jurnal`
  - `mailto:hello@anakora.com` CTAs
  - Program card/button CTAs ("Yerini Ayirt") are visual only
  - Sticky mobile CTA (hidden on `/deneyimler*`)

## Existing data fetching patterns
- No API/data fetching found (`fetch`, `axios`, query libraries, route loaders not used).
- No persistence for forms.
- No auth session logic or storage integration yet.
- All page content is static in component files.

## Integration readiness observations
- Good separation between route-level pages and reusable cards makes incremental data wiring feasible.
- Main risk is content duplication:
  - Program information appears across `HomePage`, `ExperiencesPage`, and `ProgramDetailPage`.
  - Journal content appears in both `HomePage` and `JournalPage`.
- Suggested first migration targets:
  - Programs, journal posts, archive entries, testimonials, and site settings.
- Suggested static holdouts for phase 1:
  - Brand visual system, layout structure, motion styles, and core theme tokens.
