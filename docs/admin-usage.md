# ANAKORA Admin Usage

## Access and Roles
- Login route: `/admin/login`.
- Roles come from `public.admin_profiles.role`.
- Role-aware access is enforced in the shell and module pages.
- Admin UI language is Turkish (TR/EN content entry fields remain available).

### Role capability map
- `owner`: all modules.
- `editor`: all modules.
- `author`: content + media modules.
- `operations`: leads + site settings + media.

## Module Workflows

### Programs / Guides / Leads
- Existing modules remain available with list and editor flows.

### Testimonials
- Route: `/admin/testimonials`.
- Supports list + create + edit in one screen.
- Supports:
  - optional program linking (`program_id` + `program_testimonial_assignments`)
  - optional guide link
  - TR/EN content
  - featured toggle
  - published toggle
  - sort order

### Journal
- Route: `/admin/journal`.
- Supports:
  - post list + create + edit
  - TR/EN content
  - TR/EN markdown live preview in editor
  - publish flow (`draft` / `published` / `archived`)
  - category assignment
  - cover image upload/select flow with preview
- Category panel in same route supports create/edit for journal taxonomy.

### Homepage
- Route: `/admin/homepage`.
- Manages structured homepage sections:
  - enable/disable
  - sort order
  - TR/EN title/subtitle/media
  - controlled payload JSON (sanitized by section schema)

### Site Settings
- Route: `/admin/site-settings`.
- Manages:
  - contact info
  - social links JSON
  - global SEO defaults
  - global SEO image URL
  - reservation notification email placeholder
  - notification settings JSON placeholder
  - header/footer link arrays

### Media
- Route: `/admin/media`.
- Supports:
  - Supabase Storage uploads
  - bucket visibility switch (`public` / `private`)
  - module-based browsing (`journal`, `program`, `guide`, `testimonials`, `homepage`)
  - recursive listing to include legacy deep-path assets
  - object deletion
  - URL/reference output for content fields

## Editorial Safety
- Locale completeness badges are shown in key content lists.
- Save flows validate required fields and JSON inputs before mutation.
- Empty, loading, and error states are explicit in all CMS modules.
