# Media Upload Flow

## Storage Buckets
- Public bucket: `public-assets`
- Private bucket: `admin-uploads`
- Bucket names can be overridden via env vars:
  - `VITE_SUPABASE_STORAGE_BUCKET_PUBLIC`
  - `VITE_SUPABASE_STORAGE_BUCKET_PRIVATE`

## Upload Path Convention
- Generated path format:
  - `images/<module>/<year>/<month>/[locale]/[entity]/<unique>.<ext>`
- Examples:
  - `images/journal/2026/03/en/post-abc/1711150000-a1b2c3.jpg`
  - `images/homepage/2026/03/1711151000-d4e5f6.webp`

## Admin Media Module
- Route: `/admin/media`
- Features:
  - upload with visibility + module + optional locale/entity context
  - browse by prefix
  - select asset and read reference outputs
  - delete asset

## Reference Patterns
- Public URL (for direct image fields):
  - `https://<project>.supabase.co/storage/v1/object/public/<bucket>/<path>`
- Storage reference (for internal/reference workflows):
  - `storage://<bucket>/<path>`

## Implementation Notes
- Upload/list/remove logic lives in:
  - `src/app/admin/data/media.ts`
- Helpers include:
  - path generation
  - reference parsing
  - bucket resolution by visibility
