# Environment Setup

## 1) Install
- `npm install`

## 2) Configure env
- Copy `.env.example` to `.env.local`.

Required browser-safe values:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_ENABLE_CAPTCHA` (optional)
- `VITE_SUPABASE_STORAGE_BUCKET_PUBLIC` (optional override)
- `VITE_SUPABASE_STORAGE_BUCKET_PRIVATE` (optional override)

Required server/trusted values:
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

Optional server storage aliases:
- `SUPABASE_STORAGE_BUCKET_PUBLIC`
- `SUPABASE_STORAGE_BUCKET_PRIVATE`

## 3) Supabase schema/migrations
- Apply all migrations in `supabase/migrations`.
- Includes:
  - content model
  - public RLS
  - admin RLS
  - role-aware/storage hardening

## 4) Run app
- Dev: `npm run dev`
- Production build: `npm run build`

## 5) Seed (optional)
- Use `supabase/seeds/20260323051000_anakora_seed_scaffold.sql` as starter data.
