# Public Form Flows

This document describes the implemented public submission flows and protections.

## Implemented flows

### 1) Booking / application interest
- Surface: `ProgramDetailPage` booking modal.
- Storage: `lead_submissions`
- `source`: `program_booking`
- Captures:
  - `full_name`
  - `email`
  - `phone`
  - `message`
  - `program_id`
  - metadata including booking mode + surface tag.

### 2) Contact form
- Surface: `ExperiencesPage` bottom CTA section.
- Storage: `lead_submissions`
- `source`: `general_contact`
- Captures:
  - `full_name`
  - `email`
  - `message`
  - metadata surface tag.

### 3) Newsletter signup
- Surfaces:
  - Footer newsletter
  - Journal newsletter section
- Storage: `lead_submissions`
- `source`:
  - footer: `newsletter`
  - journal: `journal_newsletter`
- Captures:
  - `email`
  - `consent_marketing=true`
  - metadata surface tag.

## Validation

Validation is centralized in:
- `src/app/lib/lead-submissions.ts`

Rules:
- Email required and format-validated.
- Name required for non-newsletter flows.
- Optional CAPTCHA enforcement when enabled.
- Actionable per-field errors are returned and shown in UI.

## Spam mitigation

Implemented:
- Hidden honeypot field on all forms.
  - If filled, submission is silently ignored as spam.

Prepared for future CAPTCHA/Turnstile:
- Env toggle: `VITE_ENABLE_CAPTCHA`
- Placeholder metadata + validation hook for future token checks.

## UX states

Each form includes:
- submitting state (`Sending...`/`Gonderiliyor...`)
- inline error state
- inline success confirmation
- clear, low-friction layout consistent with existing visual system

## Environment additions

`.env.example` now includes:
- `VITE_ENABLE_CAPTCHA=false`

## Database access policy note
- Public form writes rely on `lead_submissions` RLS insert policy from:
  - `supabase/migrations/20260323101500_public_site_rls.sql`

## Relevant implementation files
- `src/app/lib/lead-submissions.ts`
- `src/app/components/Footer.tsx`
- `src/app/pages/ProgramDetailPage.tsx`
- `src/app/pages/ExperiencesPage.tsx`
- `src/app/pages/JournalPage.tsx`
