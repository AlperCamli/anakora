# Deployment Notes (MVP Staging)

## Pre-deploy Checklist
- All Supabase migrations are applied in order.
- Admin users exist in `auth.users` and `public.admin_profiles`.
- RLS policies are active for:
  - public reads
  - admin role-aware writes
  - storage access
- Buckets exist:
  - `public-assets`
  - `admin-uploads`

## Build/Release
- Build command: `npm run build`
- Output directory: `dist/`
- Deploy static frontend as usual for Vite output.

## Runtime Config
- Ensure staging/prod environment variables match `docs/environment-setup.md`.
- Verify bucket override vars if custom bucket IDs are used.

## Validation Pass Before Go-live
- Admin:
  - create/edit testimonial
  - create/edit journal post and categories
  - update homepage section and payload
  - update site settings
  - upload/select media asset
- Public:
  - homepage content reflects section changes
  - journal list/detail reflects publish state
  - testimonials render from DB
  - header/footer values come from site settings

## Known Build Note
- Current bundle reports a large chunk warning.
- It does not block MVP staging, but code-splitting is a recommended follow-up.
