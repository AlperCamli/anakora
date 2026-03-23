-- ANAKORA content model foundation
-- Supports: multilingual editorial content (TR/EN), program operations, and CMS-ready structures

create extension if not exists pgcrypto;

do $$
begin
  create type public.app_locale as enum ('tr', 'en');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.program_status as enum ('upcoming', 'published', 'completed', 'cancelled');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.booking_mode as enum ('direct', 'application', 'external');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.media_type as enum ('image', 'video');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.journal_post_status as enum ('draft', 'published', 'archived');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.homepage_section_key as enum (
    'hero',
    'brand_manifesto',
    'experience_categories',
    'upcoming_programs',
    'why_anakora',
    'archive_preview',
    'testimonials',
    'journal_preview',
    'final_cta'
  );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.lead_source as enum (
    'newsletter',
    'program_booking',
    'journal_newsletter',
    'general_contact',
    'waitlist'
  );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.lead_status as enum (
    'new',
    'reviewed',
    'contacted',
    'qualified',
    'converted',
    'archived',
    'spam'
  );
exception
  when duplicate_object then null;
end $$;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- 1) admin_profiles
create table if not exists public.admin_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  full_name text,
  role text not null default 'editor' check (role in ('owner', 'editor', 'author', 'operations')),
  avatar_url text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 10) guides
create table if not exists public.guides (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  email text,
  instagram_handle text,
  avatar_url text,
  is_featured boolean not null default false,
  is_active boolean not null default true,
  created_by uuid references public.admin_profiles(id) on delete set null,
  updated_by uuid references public.admin_profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 7) program_categories
create table if not exists public.program_categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  sort_order integer not null default 0,
  is_featured boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 16) journal_categories
create table if not exists public.journal_categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  sort_order integer not null default 0,
  is_featured boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2) programs
create table if not exists public.programs (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  status public.program_status not null default 'upcoming',
  booking_mode public.booking_mode not null default 'application',
  external_booking_url text,
  starts_at timestamptz not null,
  ends_at timestamptz,
  location_name text not null,
  city text,
  country_code char(2),
  duration_days integer check (duration_days is null or duration_days > 0),
  duration_nights integer check (duration_nights is null or duration_nights >= 0),
  capacity integer check (capacity is null or capacity > 0),
  spots_left integer check (spots_left is null or spots_left >= 0),
  price_amount numeric(12,2) check (price_amount is null or price_amount >= 0),
  price_currency char(3) not null default 'TRY',
  cover_image_url text,
  is_featured boolean not null default false,
  primary_guide_id uuid references public.guides(id) on delete set null,
  cancelled_at timestamptz,
  cancellation_reason text,
  published_at timestamptz,
  created_by uuid references public.admin_profiles(id) on delete set null,
  updated_by uuid references public.admin_profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint programs_booking_external_url_ck check (
    (booking_mode = 'external' and external_booking_url is not null)
    or (booking_mode <> 'external')
  ),
  constraint programs_end_after_start_ck check (
    ends_at is null or ends_at >= starts_at
  ),
  constraint programs_spots_capacity_ck check (
    spots_left is null or capacity is null or spots_left <= capacity
  )
);

-- 3) program_translations
create table if not exists public.program_translations (
  id uuid primary key default gen_random_uuid(),
  program_id uuid not null references public.programs(id) on delete cascade,
  locale public.app_locale not null,
  title text not null,
  subtitle text,
  summary text,
  story_markdown text,
  cover_image_alt text,
  who_is_it_for jsonb not null default '[]'::jsonb,
  itinerary_json jsonb not null default '[]'::jsonb,
  included_items jsonb not null default '[]'::jsonb,
  excluded_items jsonb not null default '[]'::jsonb,
  seo_title text,
  seo_description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (program_id, locale),
  constraint program_translations_who_is_it_for_array_ck check (jsonb_typeof(who_is_it_for) = 'array'),
  constraint program_translations_itinerary_array_ck check (jsonb_typeof(itinerary_json) = 'array'),
  constraint program_translations_included_array_ck check (jsonb_typeof(included_items) = 'array'),
  constraint program_translations_excluded_array_ck check (jsonb_typeof(excluded_items) = 'array')
);

-- 4) program_gallery_items
create table if not exists public.program_gallery_items (
  id uuid primary key default gen_random_uuid(),
  program_id uuid not null references public.programs(id) on delete cascade,
  media_type public.media_type not null default 'image',
  media_url text not null,
  alt_translations jsonb not null default '{}'::jsonb,
  caption_translations jsonb not null default '{}'::jsonb,
  sort_order integer not null default 0,
  is_featured boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint program_gallery_items_alt_obj_ck check (jsonb_typeof(alt_translations) = 'object'),
  constraint program_gallery_items_caption_obj_ck check (jsonb_typeof(caption_translations) = 'object')
);

-- 5) program_faqs
create table if not exists public.program_faqs (
  id uuid primary key default gen_random_uuid(),
  program_id uuid not null references public.programs(id) on delete cascade,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 6) program_faq_translations
create table if not exists public.program_faq_translations (
  id uuid primary key default gen_random_uuid(),
  faq_id uuid not null references public.program_faqs(id) on delete cascade,
  locale public.app_locale not null,
  question text not null,
  answer text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (faq_id, locale)
);

-- 8) program_category_translations
create table if not exists public.program_category_translations (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.program_categories(id) on delete cascade,
  locale public.app_locale not null,
  name text not null,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (category_id, locale)
);

-- 9) program_category_assignments
create table if not exists public.program_category_assignments (
  program_id uuid not null references public.programs(id) on delete cascade,
  category_id uuid not null references public.program_categories(id) on delete cascade,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  primary key (program_id, category_id)
);

-- 11) guide_translations
create table if not exists public.guide_translations (
  id uuid primary key default gen_random_uuid(),
  guide_id uuid not null references public.guides(id) on delete cascade,
  locale public.app_locale not null,
  full_name text not null,
  title text,
  bio text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (guide_id, locale)
);

-- 13) testimonial_translations requires 12) testimonials first
-- 12) testimonials
create table if not exists public.testimonials (
  id uuid primary key default gen_random_uuid(),
  slug text unique check (slug is null or slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  program_id uuid references public.programs(id) on delete set null,
  guide_id uuid references public.guides(id) on delete set null,
  author_image_url text,
  rating integer not null default 5 check (rating between 1 and 5),
  testimonial_date date,
  is_featured boolean not null default false,
  is_published boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.testimonial_translations (
  id uuid primary key default gen_random_uuid(),
  testimonial_id uuid not null references public.testimonials(id) on delete cascade,
  locale public.app_locale not null,
  author_name text not null,
  author_title text,
  quote text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (testimonial_id, locale)
);

-- 14) journal_posts
create table if not exists public.journal_posts (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  status public.journal_post_status not null default 'draft',
  cover_image_url text,
  is_featured boolean not null default false,
  reading_time_minutes integer check (reading_time_minutes is null or reading_time_minutes > 0),
  published_at timestamptz,
  author_profile_id uuid references public.admin_profiles(id) on delete set null,
  primary_guide_id uuid references public.guides(id) on delete set null,
  created_by uuid references public.admin_profiles(id) on delete set null,
  updated_by uuid references public.admin_profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 15) journal_post_translations
create table if not exists public.journal_post_translations (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.journal_posts(id) on delete cascade,
  locale public.app_locale not null,
  title text not null,
  excerpt text,
  content_markdown text not null,
  cover_image_alt text,
  seo_title text,
  seo_description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (post_id, locale)
);

-- 17) journal_category_translations
create table if not exists public.journal_category_translations (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.journal_categories(id) on delete cascade,
  locale public.app_locale not null,
  name text not null,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (category_id, locale)
);

-- 18) journal_category_assignments
create table if not exists public.journal_category_assignments (
  post_id uuid not null references public.journal_posts(id) on delete cascade,
  category_id uuid not null references public.journal_categories(id) on delete cascade,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  primary key (post_id, category_id)
);

-- 19) homepage_sections
create table if not exists public.homepage_sections (
  id uuid primary key default gen_random_uuid(),
  section_key public.homepage_section_key not null,
  locale public.app_locale not null,
  title text,
  subtitle text,
  payload_json jsonb not null default '{}'::jsonb,
  media_url text,
  media_alt text,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_by uuid references public.admin_profiles(id) on delete set null,
  updated_by uuid references public.admin_profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (section_key, locale),
  constraint homepage_sections_payload_obj_ck check (jsonb_typeof(payload_json) = 'object')
);

-- 20) site_settings
create table if not exists public.site_settings (
  id uuid primary key default gen_random_uuid(),
  locale public.app_locale not null unique,
  site_name text not null,
  logo_text text,
  tagline text,
  contact_email text,
  contact_phone text,
  instagram_url text,
  default_seo_title text,
  default_seo_description text,
  header_navigation jsonb not null default '[]'::jsonb,
  footer_legal_links jsonb not null default '[]'::jsonb,
  footer_newsletter_enabled boolean not null default true,
  created_by uuid references public.admin_profiles(id) on delete set null,
  updated_by uuid references public.admin_profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint site_settings_header_nav_array_ck check (jsonb_typeof(header_navigation) = 'array'),
  constraint site_settings_footer_links_array_ck check (jsonb_typeof(footer_legal_links) = 'array')
);

-- 21) lead_submissions
create table if not exists public.lead_submissions (
  id uuid primary key default gen_random_uuid(),
  source public.lead_source not null,
  status public.lead_status not null default 'new',
  locale public.app_locale not null default 'tr',
  program_id uuid references public.programs(id) on delete set null,
  full_name text,
  email text not null,
  phone text,
  message text,
  metadata jsonb not null default '{}'::jsonb,
  consent_marketing boolean not null default false,
  submitted_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint lead_submissions_metadata_obj_ck check (jsonb_typeof(metadata) = 'object')
);

-- Additional helper relations to support explicit guide/testimonial linking
create table if not exists public.program_guide_assignments (
  program_id uuid not null references public.programs(id) on delete cascade,
  guide_id uuid not null references public.guides(id) on delete cascade,
  role_label text,
  is_primary boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  primary key (program_id, guide_id)
);

create table if not exists public.program_testimonial_assignments (
  program_id uuid not null references public.programs(id) on delete cascade,
  testimonial_id uuid not null references public.testimonials(id) on delete cascade,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  primary key (program_id, testimonial_id)
);

-- Indexes
create index if not exists idx_programs_status_starts_at on public.programs (status, starts_at);
create index if not exists idx_programs_featured on public.programs (is_featured) where is_featured = true;
create index if not exists idx_programs_primary_guide on public.programs (primary_guide_id);

create index if not exists idx_program_translations_program_locale on public.program_translations (program_id, locale);
create index if not exists idx_program_gallery_program_sort on public.program_gallery_items (program_id, sort_order);
create index if not exists idx_program_faqs_program_sort on public.program_faqs (program_id, sort_order);
create index if not exists idx_program_faq_translations_faq_locale on public.program_faq_translations (faq_id, locale);
create index if not exists idx_program_category_assignments_category on public.program_category_assignments (category_id);
create index if not exists idx_program_category_translations_cat_locale on public.program_category_translations (category_id, locale);
create index if not exists idx_guide_translations_guide_locale on public.guide_translations (guide_id, locale);

create index if not exists idx_testimonials_program on public.testimonials (program_id);
create index if not exists idx_testimonials_featured on public.testimonials (is_featured) where is_featured = true;
create index if not exists idx_testimonial_translations_testimonial_locale on public.testimonial_translations (testimonial_id, locale);

create index if not exists idx_journal_posts_status_published_at on public.journal_posts (status, published_at desc);
create index if not exists idx_journal_posts_featured on public.journal_posts (is_featured) where is_featured = true;
create index if not exists idx_journal_post_translations_post_locale on public.journal_post_translations (post_id, locale);
create index if not exists idx_journal_category_assignments_category on public.journal_category_assignments (category_id);
create index if not exists idx_journal_category_translations_cat_locale on public.journal_category_translations (category_id, locale);

create index if not exists idx_homepage_sections_locale_sort on public.homepage_sections (locale, sort_order);
create index if not exists idx_lead_submissions_status_submitted_at on public.lead_submissions (status, submitted_at desc);
create index if not exists idx_lead_submissions_source on public.lead_submissions (source);
create index if not exists idx_lead_submissions_program on public.lead_submissions (program_id);
create index if not exists idx_program_guide_assignments_guide on public.program_guide_assignments (guide_id);
create index if not exists idx_program_testimonial_assignments_testimonial on public.program_testimonial_assignments (testimonial_id);

-- updated_at triggers
drop trigger if exists trg_admin_profiles_updated_at on public.admin_profiles;
create trigger trg_admin_profiles_updated_at
before update on public.admin_profiles
for each row execute function public.set_updated_at();

drop trigger if exists trg_guides_updated_at on public.guides;
create trigger trg_guides_updated_at
before update on public.guides
for each row execute function public.set_updated_at();

drop trigger if exists trg_guide_translations_updated_at on public.guide_translations;
create trigger trg_guide_translations_updated_at
before update on public.guide_translations
for each row execute function public.set_updated_at();

drop trigger if exists trg_program_categories_updated_at on public.program_categories;
create trigger trg_program_categories_updated_at
before update on public.program_categories
for each row execute function public.set_updated_at();

drop trigger if exists trg_program_category_translations_updated_at on public.program_category_translations;
create trigger trg_program_category_translations_updated_at
before update on public.program_category_translations
for each row execute function public.set_updated_at();

drop trigger if exists trg_programs_updated_at on public.programs;
create trigger trg_programs_updated_at
before update on public.programs
for each row execute function public.set_updated_at();

drop trigger if exists trg_program_translations_updated_at on public.program_translations;
create trigger trg_program_translations_updated_at
before update on public.program_translations
for each row execute function public.set_updated_at();

drop trigger if exists trg_program_gallery_items_updated_at on public.program_gallery_items;
create trigger trg_program_gallery_items_updated_at
before update on public.program_gallery_items
for each row execute function public.set_updated_at();

drop trigger if exists trg_program_faqs_updated_at on public.program_faqs;
create trigger trg_program_faqs_updated_at
before update on public.program_faqs
for each row execute function public.set_updated_at();

drop trigger if exists trg_program_faq_translations_updated_at on public.program_faq_translations;
create trigger trg_program_faq_translations_updated_at
before update on public.program_faq_translations
for each row execute function public.set_updated_at();

drop trigger if exists trg_testimonials_updated_at on public.testimonials;
create trigger trg_testimonials_updated_at
before update on public.testimonials
for each row execute function public.set_updated_at();

drop trigger if exists trg_testimonial_translations_updated_at on public.testimonial_translations;
create trigger trg_testimonial_translations_updated_at
before update on public.testimonial_translations
for each row execute function public.set_updated_at();

drop trigger if exists trg_journal_categories_updated_at on public.journal_categories;
create trigger trg_journal_categories_updated_at
before update on public.journal_categories
for each row execute function public.set_updated_at();

drop trigger if exists trg_journal_category_translations_updated_at on public.journal_category_translations;
create trigger trg_journal_category_translations_updated_at
before update on public.journal_category_translations
for each row execute function public.set_updated_at();

drop trigger if exists trg_journal_posts_updated_at on public.journal_posts;
create trigger trg_journal_posts_updated_at
before update on public.journal_posts
for each row execute function public.set_updated_at();

drop trigger if exists trg_journal_post_translations_updated_at on public.journal_post_translations;
create trigger trg_journal_post_translations_updated_at
before update on public.journal_post_translations
for each row execute function public.set_updated_at();

drop trigger if exists trg_homepage_sections_updated_at on public.homepage_sections;
create trigger trg_homepage_sections_updated_at
before update on public.homepage_sections
for each row execute function public.set_updated_at();

drop trigger if exists trg_site_settings_updated_at on public.site_settings;
create trigger trg_site_settings_updated_at
before update on public.site_settings
for each row execute function public.set_updated_at();

drop trigger if exists trg_lead_submissions_updated_at on public.lead_submissions;
create trigger trg_lead_submissions_updated_at
before update on public.lead_submissions
for each row execute function public.set_updated_at();
