# Supabase Integration Plan (UI-Preserving)

## Objective
Integrate Supabase as backend foundation without redesigning or materially changing the current Figma-generated public website.

## Current frontend architecture summary
- Public site is a React Router SPA with one global shell (`Layout`) and page-level components.
- Pages currently own their content via local arrays/objects.
- No live API/data fetching, no auth wiring, and no storage integration yet.
- Existing UI components are reusable enough to switch from local constants to Supabase-backed view models with minimal markup changes.

## Content domains to move into database
- `program_categories`
  - Adult camp, family camp, natural journeys, workshop classes.
- `programs`
  - Card/list fields: title, slug, category, location, date range, duration, image, spots left.
  - Detail fields: subtitle, story, who-is-it-for, daily flow, included/not included, pricing, guide, FAQs.
- `archive_entries`
  - Year, title, location, participants, hero image, summary.
- `journal_posts`
  - Slug, title, excerpt, body, author, read time, category, cover image, publish date, featured flag.
- `testimonials`
  - Quote, author, related program, optional image, publish/visibility status.
- `site_settings`
  - Header/footer nav labels, contact values, CTA labels, legal links, homepage hero and section copy.
- `newsletter_submissions` and `booking_inquiries`
  - Form submissions from existing public forms.

## Supabase integration points in current UI
- `HomePage`
  - Replace local arrays with Supabase reads for experience categories/program previews/testimonials/journal previews.
- `ExperiencesPage`
  - Filters sourced from `program_categories`; cards from `programs` with client-side or query-level filtering.
- `ProgramDetailPage`
  - Use `:id` (prefer migration to slug) to query a single `program`.
  - Booking form writes to `booking_inquiries`.
- `ArchivePage`
  - Year list and entries from `archive_entries`.
- `JournalPage` (+ future `/jurnal/:slug`)
  - Featured and regular posts from `journal_posts`.
  - Newsletter form writes to `newsletter_submissions`.
- `Header` and `Footer`
  - Keep structure and styles; optionally source nav/contact/copy from `site_settings` in later phase.

## What should remain static for now
- Visual design system and motion behavior (Tailwind classes, spacing, typography, color tokens).
- Layout composition and section ordering on public pages.
- Static brand storytelling text in `AboutPage` for phase 1 unless editorial team requests CMS control.
- UI component library under `src/app/components/ui/*`.

## Recommended migration phases
1. Foundation
   - Supabase clients, env scaffolding, and setup documentation.
   - Define schema and RLS strategy.
2. Read-only content migration
   - Programs, journal posts, archive entries, testimonials.
   - Wire pages to read data while preserving existing component markup.
3. Form writes + storage
   - Newsletter and booking submissions.
   - Media asset migration to Supabase Storage with URL mapping.
4. Auth + custom admin dashboard
   - Supabase Auth for admin users.
   - Service-role backed server endpoints for privileged operations.
5. Settings and localization expansion
   - Move header/footer/site copy to `site_settings`.
   - Add structured multi-language content if needed.

## Auth and security baseline
- Public website:
  - Use anon key only (`VITE_SUPABASE_ANON_KEY`) with RLS-protected read/write policies.
- Server/admin operations:
  - Use service role key only in trusted server runtime.
  - Never import service-role client into browser code.
- Storage:
  - Public buckets for public images.
  - Private buckets for admin uploads/drafts where needed.

## Data access pattern recommendation
- Keep UI components dumb/presentational.
- Create page-level query mappers that transform Supabase rows into current component prop shapes.
- Use graceful fallback (loading states and empty states) without changing section layout.

## Immediate follow-up backlog
1. Add typed table definitions (generated or hand-maintained).
2. Create initial SQL migrations for core content tables and RLS policies.
3. Implement first read integration on `/deneyimler` and `/deneyimler/:id`.
4. Add `/jurnal/:slug` route and wire post detail data.
