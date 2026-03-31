# Media Upload Flow

## Storage Buckets
- Public bucket: `public-assets`
- Private bucket: `admin-uploads`
- Bucket names can be overridden via env vars:
  - `VITE_SUPABASE_STORAGE_BUCKET_PUBLIC`
  - `VITE_SUPABASE_STORAGE_BUCKET_PRIVATE`

## Upload Path Convention
- Generated path format:
  - `images/<module>/<unique>.<ext>`
- Examples:
  - `images/journal/1711150000-a1b2c3.jpg`
  - `images/homepage/1711151000-d4e5f6.webp`
- Supported modules:
  - `journal`
  - `program`
  - `guide`
  - `testimonials`
  - `homepage`

## Admin Media Module
- Route: `/admin/media`
- Features:
  - upload with visibility + fixed module selection list
  - browse by module
  - recursive listing for backward compatibility with older deep paths
  - select asset and read reference outputs
  - delete asset

## Program/Journal Editor Image Flow
- Program and Journal admin editors now support:
  - upload from device
  - pick existing image from module media list
  - inline image preview
- Stored field remains URL (`cover_image_url`) for compatibility with existing schema/data layer.

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
