# Supabase Setup Guide

## Installed dependency
- `@supabase/supabase-js` added to `package.json`.

## Files added for Supabase foundation
- `src/lib/supabase/env.ts`
  - Shared env helpers and server-only guard.
- `src/lib/supabase/browser-client.ts`
  - Browser-safe singleton client (anon key).
- `src/lib/supabase/server-client.ts`
  - Server-side client factory (anon key, optional user token).
- `src/lib/supabase/admin-client.ts`
  - Service-role client factory for privileged server/admin operations.
- `src/lib/supabase/index.ts`
  - Central exports.
- `src/vite-env.d.ts`
  - Typed `import.meta.env` keys for Vite.
- `.env.example`
  - Required environment variable scaffold.

## Environment variables
Copy `.env.example` to `.env.local` for local development.

Required for browser/public usage:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_ENABLE_CAPTCHA` (optional feature toggle, default `false`)
- `VITE_SUPABASE_STORAGE_BUCKET_PUBLIC` (optional override)
- `VITE_SUPABASE_STORAGE_BUCKET_PRIVATE` (optional override)

Required for trusted server/admin usage:
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

Optional:
- `SUPABASE_STORAGE_BUCKET_PUBLIC`
- `SUPABASE_STORAGE_BUCKET_PRIVATE`

## Usage patterns

### 1) Public browser client (safe in frontend)
```ts
import { getSupabaseBrowserClient } from "@/lib/supabase";

const supabase = getSupabaseBrowserClient();
const { data, error } = await supabase.from("programs").select("*");
```

### 2) Server-side client (user-context queries)
```ts
import { createSupabaseServerClient } from "@/lib/supabase";

const supabase = createSupabaseServerClient({
  accessToken: userJwt, // optional
});
```

### 3) Admin/service-role client (trusted runtime only)
```ts
import { createSupabaseAdminClient } from "@/lib/supabase";

const supabaseAdmin = createSupabaseAdminClient();
```

## Security rules
- Never expose `SUPABASE_SERVICE_ROLE_KEY` to browser code.
- Keep all admin/service-role operations behind server endpoints or server jobs.
- Enforce RLS policies even for anon/public read paths.
- Do not hardcode keys in source files.
- Storage object access in admin UI is controlled by storage RLS policies.

## Local run checklist
1. Create `.env.local` from `.env.example` and fill real values.
2. Install dependencies:
   - `npm install`
3. Start app:
   - `npm run dev`
4. Build verification:
   - `npm run build`

## Notes for custom admin dashboard milestone
- Use Supabase Auth for admin login/session.
- Use server-side utilities for protected create/update/delete operations.
- Keep public website rendering and visual structure unchanged while replacing local mock content with Supabase queries.

## Schema artifacts added
- Migration:
  - `supabase/migrations/20260323050000_anakora_content_model.sql`
  - `supabase/migrations/20260323101500_public_site_rls.sql` (public read + lead insert policies)
  - `supabase/migrations/20260323120000_admin_cms_rls.sql`
  - `supabase/migrations/20260323133000_admin_role_storage_hardening.sql`
- Optional seed scaffold:
  - `supabase/seeds/20260323051000_anakora_seed_scaffold.sql`

If you use Supabase CLI locally, apply migrations/seeds with your normal workflow (for example `supabase db push` and optional seed execution).
