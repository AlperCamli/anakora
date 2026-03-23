# Admin Shell (`/admin`)

This document describes the custom CMS dashboard foundation implemented for ANAKORA.

## Scope delivered
- Protected `/admin` route tree in the same React app.
- Supabase Auth login flow for admin users.
- Admin role foundation based on `public.admin_profiles`.
- Route protection with session + active admin profile guard.
- Dashboard shell UI with:
  - sidebar navigation
  - sticky top bar
  - overview cards
  - loading/error state handling
- Admin sections wired:
  - Dashboard
  - Programs
  - Guides
  - Leads
  - Placeholder routes for Testimonials, Journal, Homepage, Site Settings, Media

## Route map
- `/admin/login`
- `/admin` (dashboard)
- `/admin/programs`
- `/admin/programs/new`
- `/admin/programs/:programId`
- `/admin/guides`
- `/admin/guides/new`
- `/admin/guides/:guideId`
- `/admin/leads`
- `/admin/leads/:leadId`
- `/admin/testimonials` (placeholder)
- `/admin/journal` (placeholder)
- `/admin/homepage` (placeholder)
- `/admin/site-settings` (placeholder)
- `/admin/media` (placeholder)

## Key frontend files
- `src/app/routes.tsx`
- `src/app/admin/context/AdminAuthContext.tsx`
- `src/app/admin/components/AdminAuthRoot.tsx`
- `src/app/admin/components/AdminProtectedLayout.tsx`
- `src/app/admin/components/AdminShell.tsx`
- `src/app/admin/pages/AdminLoginPage.tsx`
- `src/app/admin/pages/AdminDashboardPage.tsx`

## Auth and role model
- Auth client: Supabase browser client (`@supabase/supabase-js`).
- Login method: `signInWithPassword`.
- Guard checks:
  1. valid authenticated session
  2. matching `admin_profiles` row by `auth.users.id`
  3. `is_active = true`
  4. role in `owner | editor | author | operations`
- Failsafe state:
  - authenticated but no valid admin profile => blocked with explicit access message and sign-out action.

## RLS support for dashboard
Migration added:
- `supabase/migrations/20260323120000_admin_cms_rls.sql`

Includes:
- `public.is_admin_user()` helper function (security definer).
- Admin policies for authenticated users on CMS and leads tables.
- `admin_profiles` self-read + admin management policies.

## Notes
- Public website routes and visuals remain isolated under existing public layout.
- Admin shell intentionally uses practical internal-tool styling while staying clean and brand-aligned.
- Placeholder routes are protected and production-safe entry points for next modules.
