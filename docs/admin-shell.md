# Admin Shell (`/admin`)

This document describes the custom CMS dashboard shell and access model for ANAKORA.

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
  - Testimonials
  - Journal
  - Homepage
  - Site Settings
  - Media

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
- `/admin/testimonials`
- `/admin/journal`
- `/admin/homepage`
- `/admin/site-settings`
- `/admin/media`

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
- Role-aware module access:
  - content modules: `owner`, `editor`, `author`
  - leads + settings: `owner`, `editor`, `operations`
  - media: all admin roles

## RLS support for dashboard
Migrations:
- `supabase/migrations/20260323120000_admin_cms_rls.sql`
- `supabase/migrations/20260323133000_admin_role_storage_hardening.sql`

Includes:
- `public.is_admin_user()` helper function (security definer).
- `public.has_admin_role(...)` helper for role-aware policies.
- Role-aware admin policies across CMS and lead workflows.
- Storage bucket + RLS policy scaffolding for media uploads.
- `admin_profiles` self-read + admin management policies.

## Notes
- Public website routes and visuals remain isolated under existing public layout.
- Admin shell intentionally uses practical internal-tool styling while staying clean and brand-aligned.
- Shell navigation hides inaccessible modules based on role.
