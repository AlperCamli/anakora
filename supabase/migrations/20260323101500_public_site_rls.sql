-- Public-site RLS policies for ANAKORA
-- Goal:
-- 1) Keep anonymous read access only for publishable public content.
-- 2) Allow anonymous/public lead capture inserts.
-- 3) Keep admin/editorial tables protected for future CMS auth flows.

-- Enable RLS on all application tables in the content model.
alter table public.admin_profiles enable row level security;
alter table public.programs enable row level security;
alter table public.program_translations enable row level security;
alter table public.program_gallery_items enable row level security;
alter table public.program_faqs enable row level security;
alter table public.program_faq_translations enable row level security;
alter table public.program_categories enable row level security;
alter table public.program_category_translations enable row level security;
alter table public.program_category_assignments enable row level security;
alter table public.guides enable row level security;
alter table public.guide_translations enable row level security;
alter table public.testimonials enable row level security;
alter table public.testimonial_translations enable row level security;
alter table public.journal_posts enable row level security;
alter table public.journal_post_translations enable row level security;
alter table public.journal_categories enable row level security;
alter table public.journal_category_translations enable row level security;
alter table public.journal_category_assignments enable row level security;
alter table public.homepage_sections enable row level security;
alter table public.site_settings enable row level security;
alter table public.lead_submissions enable row level security;
alter table public.program_guide_assignments enable row level security;
alter table public.program_testimonial_assignments enable row level security;

-- site_settings
drop policy if exists site_settings_public_read on public.site_settings;
create policy site_settings_public_read
on public.site_settings
for select
to anon, authenticated
using (true);

-- homepage_sections
drop policy if exists homepage_sections_public_read on public.homepage_sections;
create policy homepage_sections_public_read
on public.homepage_sections
for select
to anon, authenticated
using (is_active = true);

-- programs
drop policy if exists programs_public_read on public.programs;
create policy programs_public_read
on public.programs
for select
to anon, authenticated
using (status in ('upcoming', 'published', 'completed'));

-- program_translations
drop policy if exists program_translations_public_read on public.program_translations;
create policy program_translations_public_read
on public.program_translations
for select
to anon, authenticated
using (
  exists (
    select 1
    from public.programs p
    where p.id = program_id
      and p.status in ('upcoming', 'published', 'completed')
  )
);

-- program_gallery_items
drop policy if exists program_gallery_public_read on public.program_gallery_items;
create policy program_gallery_public_read
on public.program_gallery_items
for select
to anon, authenticated
using (
  exists (
    select 1
    from public.programs p
    where p.id = program_id
      and p.status in ('upcoming', 'published', 'completed')
  )
);

-- program_faqs
drop policy if exists program_faqs_public_read on public.program_faqs;
create policy program_faqs_public_read
on public.program_faqs
for select
to anon, authenticated
using (
  is_active = true
  and exists (
    select 1
    from public.programs p
    where p.id = program_id
      and p.status in ('upcoming', 'published', 'completed')
  )
);

-- program_faq_translations
drop policy if exists program_faq_translations_public_read on public.program_faq_translations;
create policy program_faq_translations_public_read
on public.program_faq_translations
for select
to anon, authenticated
using (
  exists (
    select 1
    from public.program_faqs f
    join public.programs p on p.id = f.program_id
    where f.id = faq_id
      and f.is_active = true
      and p.status in ('upcoming', 'published', 'completed')
  )
);

-- program_categories
drop policy if exists program_categories_public_read on public.program_categories;
create policy program_categories_public_read
on public.program_categories
for select
to anon, authenticated
using (is_active = true);

-- program_category_translations
drop policy if exists program_category_translations_public_read on public.program_category_translations;
create policy program_category_translations_public_read
on public.program_category_translations
for select
to anon, authenticated
using (
  exists (
    select 1
    from public.program_categories c
    where c.id = category_id
      and c.is_active = true
  )
);

-- program_category_assignments
drop policy if exists program_category_assignments_public_read on public.program_category_assignments;
create policy program_category_assignments_public_read
on public.program_category_assignments
for select
to anon, authenticated
using (
  exists (
    select 1
    from public.programs p
    where p.id = program_id
      and p.status in ('upcoming', 'published', 'completed')
  )
  and exists (
    select 1
    from public.program_categories c
    where c.id = category_id
      and c.is_active = true
  )
);

-- guides
drop policy if exists guides_public_read on public.guides;
create policy guides_public_read
on public.guides
for select
to anon, authenticated
using (is_active = true);

-- guide_translations
drop policy if exists guide_translations_public_read on public.guide_translations;
create policy guide_translations_public_read
on public.guide_translations
for select
to anon, authenticated
using (
  exists (
    select 1
    from public.guides g
    where g.id = guide_id
      and g.is_active = true
  )
);

-- testimonials
drop policy if exists testimonials_public_read on public.testimonials;
create policy testimonials_public_read
on public.testimonials
for select
to anon, authenticated
using (is_published = true);

-- testimonial_translations
drop policy if exists testimonial_translations_public_read on public.testimonial_translations;
create policy testimonial_translations_public_read
on public.testimonial_translations
for select
to anon, authenticated
using (
  exists (
    select 1
    from public.testimonials t
    where t.id = testimonial_id
      and t.is_published = true
  )
);

-- program_guide_assignments
drop policy if exists program_guide_assignments_public_read on public.program_guide_assignments;
create policy program_guide_assignments_public_read
on public.program_guide_assignments
for select
to anon, authenticated
using (
  exists (
    select 1
    from public.programs p
    where p.id = program_id
      and p.status in ('upcoming', 'published', 'completed')
  )
  and exists (
    select 1
    from public.guides g
    where g.id = guide_id
      and g.is_active = true
  )
);

-- program_testimonial_assignments
drop policy if exists program_testimonial_assignments_public_read on public.program_testimonial_assignments;
create policy program_testimonial_assignments_public_read
on public.program_testimonial_assignments
for select
to anon, authenticated
using (
  exists (
    select 1
    from public.programs p
    where p.id = program_id
      and p.status in ('upcoming', 'published', 'completed')
  )
  and exists (
    select 1
    from public.testimonials t
    where t.id = testimonial_id
      and t.is_published = true
  )
);

-- journal_posts
drop policy if exists journal_posts_public_read on public.journal_posts;
create policy journal_posts_public_read
on public.journal_posts
for select
to anon, authenticated
using (
  status = 'published'
  and (published_at is null or published_at <= now())
);

-- journal_post_translations
drop policy if exists journal_post_translations_public_read on public.journal_post_translations;
create policy journal_post_translations_public_read
on public.journal_post_translations
for select
to anon, authenticated
using (
  exists (
    select 1
    from public.journal_posts p
    where p.id = post_id
      and p.status = 'published'
      and (p.published_at is null or p.published_at <= now())
  )
);

-- journal_categories
drop policy if exists journal_categories_public_read on public.journal_categories;
create policy journal_categories_public_read
on public.journal_categories
for select
to anon, authenticated
using (is_active = true);

-- journal_category_translations
drop policy if exists journal_category_translations_public_read on public.journal_category_translations;
create policy journal_category_translations_public_read
on public.journal_category_translations
for select
to anon, authenticated
using (
  exists (
    select 1
    from public.journal_categories c
    where c.id = category_id
      and c.is_active = true
  )
);

-- journal_category_assignments
drop policy if exists journal_category_assignments_public_read on public.journal_category_assignments;
create policy journal_category_assignments_public_read
on public.journal_category_assignments
for select
to anon, authenticated
using (
  exists (
    select 1
    from public.journal_posts p
    where p.id = post_id
      and p.status = 'published'
      and (p.published_at is null or p.published_at <= now())
  )
  and exists (
    select 1
    from public.journal_categories c
    where c.id = category_id
      and c.is_active = true
  )
);

-- lead_submissions: public insert only
drop policy if exists lead_submissions_public_insert on public.lead_submissions;
create policy lead_submissions_public_insert
on public.lead_submissions
for insert
to anon, authenticated
with check (
  status = 'new'
  and email is not null
  and length(trim(email)) > 0
  and length(email) <= 320
);

