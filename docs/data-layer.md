# Server Data Layer

The typed server-side data access layer is implemented under:

- `src/server/data`

## Goals
- Keep public UI independent from raw table shapes.
- Expose stable DTO contracts for page rendering.
- Centralize locale fallback, media normalization, and query error handling.

## Folder structure
- `client.ts`:
  - creates server-side Supabase client for data services.
- `db-rows.ts`:
  - typed row contracts for queried tables.
- `types.ts`:
  - DTO contracts used by public rendering layer.
- `errors.ts`:
  - `DataLayerError` and query error wrapper.
- `utils.ts`:
  - locale candidates, translation fallback, json/media helpers.
- `mappers/*`:
  - conversion functions from DB rows -> DTOs.
- `services/*`:
  - query/service modules for each domain.
- `index.ts`:
  - public exports.

## Exposed DTOs
- `LayoutDTO`
- `HomePageDTO`
- `ProgramCardDTO`
- `ProgramDetailDTO`
- `ArchiveDTO`
- `JournalListDTO`
- `JournalPostDTO`
- plus supporting `GuideDTO`, `TestimonialDTO`, category/media/link DTOs.

## Service/query modules
- `layout.service.ts`
  - `getLayout(locale)`
  - reads `site_settings` with locale fallback.
- `site-settings.service.ts`
  - `getSiteSettings(locale)`
  - alias for explicit site settings access.
- `homepage.service.ts`
  - `getHomepage(locale)`
  - combines homepage sections + featured programs/testimonials + journal preview.
- `programs.service.ts`
  - `getProgramsList(locale, options)`
  - `getProgramDetailBySlug(slug, locale)`
  - includes categories, guides, FAQs, gallery, testimonials.
- `archive.service.ts`
  - `getArchive(locale)`
  - returns grouped completed programs by year.
- `journal.service.ts`
  - `getJournalList(locale)`
  - `getJournalDetailBySlug(slug, locale)`
- `guides.service.ts`
  - `getGuides(locale)`
- `testimonials.service.ts`
  - `getTestimonials(locale, options)`

## Mapping and fallback behavior
- Translation fallback order:
  1. requested locale
  2. default locale (`tr`)
  3. first available translation
- Media handling:
  - all media fields normalized through `normalizeMedia(...)` to `MediaDTO`.
- JSON fields:
  - validated/normalized via helper functions (`asArray`, `asObject`).

## Error-safe query patterns
- Every query path checks Supabase errors via `throwIfQueryError(context, error)`.
- Domain-level failures throw `DataLayerError` with context for observability.
- Missing critical translation/content cases throw explicit data-layer errors.

## Usage example
```ts
import { getHomepage, getProgramDetailBySlug } from "@/server/data";

const homepage = await getHomepage("tr");
const program = await getProgramDetailBySlug("kapadokya-bahar", "tr");
```

## Why this protects the UI
- UI pages can consume stable DTOs rather than table rows.
- Schema evolution can be absorbed in mappers/services without forcing immediate UI rewrites.
- Locale, media, and content shape decisions stay centralized in one server data boundary.
