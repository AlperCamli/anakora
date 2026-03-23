-- Admin role-aware hardening + storage workflows for ANAKORA CMS

-- Extend site_settings for MVP settings management.
alter table public.site_settings
  add column if not exists social_links jsonb not null default '{}'::jsonb,
  add column if not exists notification_settings jsonb not null default '{}'::jsonb,
  add column if not exists global_seo_image_url text,
  add column if not exists reservation_notification_email text;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'site_settings_social_links_obj_ck'
  ) then
    alter table public.site_settings
      add constraint site_settings_social_links_obj_ck
      check (jsonb_typeof(social_links) = 'object');
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'site_settings_notification_settings_obj_ck'
  ) then
    alter table public.site_settings
      add constraint site_settings_notification_settings_obj_ck
      check (jsonb_typeof(notification_settings) = 'object');
  end if;
end $$;

-- Role helper for table and storage policies.
create or replace function public.has_admin_role(allowed_roles text[])
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.admin_profiles ap
    where ap.id = auth.uid()
      and ap.is_active = true
      and ap.role = any (allowed_roles)
  );
$$;

revoke all on function public.has_admin_role(text[]) from public;
grant execute on function public.has_admin_role(text[]) to authenticated;
grant execute on function public.has_admin_role(text[]) to service_role;

-- Replace broad admin policies with role-aware policies.
drop policy if exists programs_admin_all on public.programs;
create policy programs_admin_all
on public.programs
for all
to authenticated
using (public.has_admin_role(array['owner', 'editor', 'author']))
with check (public.has_admin_role(array['owner', 'editor', 'author']));

drop policy if exists program_translations_admin_all on public.program_translations;
create policy program_translations_admin_all
on public.program_translations
for all
to authenticated
using (public.has_admin_role(array['owner', 'editor', 'author']))
with check (public.has_admin_role(array['owner', 'editor', 'author']));

drop policy if exists program_gallery_items_admin_all on public.program_gallery_items;
create policy program_gallery_items_admin_all
on public.program_gallery_items
for all
to authenticated
using (public.has_admin_role(array['owner', 'editor', 'author']))
with check (public.has_admin_role(array['owner', 'editor', 'author']));

drop policy if exists program_faqs_admin_all on public.program_faqs;
create policy program_faqs_admin_all
on public.program_faqs
for all
to authenticated
using (public.has_admin_role(array['owner', 'editor', 'author']))
with check (public.has_admin_role(array['owner', 'editor', 'author']));

drop policy if exists program_faq_translations_admin_all on public.program_faq_translations;
create policy program_faq_translations_admin_all
on public.program_faq_translations
for all
to authenticated
using (public.has_admin_role(array['owner', 'editor', 'author']))
with check (public.has_admin_role(array['owner', 'editor', 'author']));

drop policy if exists program_categories_admin_all on public.program_categories;
create policy program_categories_admin_all
on public.program_categories
for all
to authenticated
using (public.has_admin_role(array['owner', 'editor', 'author']))
with check (public.has_admin_role(array['owner', 'editor', 'author']));

drop policy if exists program_category_translations_admin_all on public.program_category_translations;
create policy program_category_translations_admin_all
on public.program_category_translations
for all
to authenticated
using (public.has_admin_role(array['owner', 'editor', 'author']))
with check (public.has_admin_role(array['owner', 'editor', 'author']));

drop policy if exists program_category_assignments_admin_all on public.program_category_assignments;
create policy program_category_assignments_admin_all
on public.program_category_assignments
for all
to authenticated
using (public.has_admin_role(array['owner', 'editor', 'author']))
with check (public.has_admin_role(array['owner', 'editor', 'author']));

drop policy if exists guides_admin_all on public.guides;
create policy guides_admin_all
on public.guides
for all
to authenticated
using (public.has_admin_role(array['owner', 'editor', 'author']))
with check (public.has_admin_role(array['owner', 'editor', 'author']));

drop policy if exists guide_translations_admin_all on public.guide_translations;
create policy guide_translations_admin_all
on public.guide_translations
for all
to authenticated
using (public.has_admin_role(array['owner', 'editor', 'author']))
with check (public.has_admin_role(array['owner', 'editor', 'author']));

drop policy if exists lead_submissions_admin_all on public.lead_submissions;
create policy lead_submissions_admin_all
on public.lead_submissions
for all
to authenticated
using (public.has_admin_role(array['owner', 'editor', 'operations']))
with check (public.has_admin_role(array['owner', 'editor', 'operations']));

drop policy if exists testimonials_admin_content on public.testimonials;
create policy testimonials_admin_content
on public.testimonials
for all
to authenticated
using (public.has_admin_role(array['owner', 'editor', 'author']))
with check (public.has_admin_role(array['owner', 'editor', 'author']));

drop policy if exists testimonial_translations_admin_content on public.testimonial_translations;
create policy testimonial_translations_admin_content
on public.testimonial_translations
for all
to authenticated
using (public.has_admin_role(array['owner', 'editor', 'author']))
with check (public.has_admin_role(array['owner', 'editor', 'author']));

drop policy if exists program_guide_assignments_admin_content on public.program_guide_assignments;
create policy program_guide_assignments_admin_content
on public.program_guide_assignments
for all
to authenticated
using (public.has_admin_role(array['owner', 'editor', 'author']))
with check (public.has_admin_role(array['owner', 'editor', 'author']));

drop policy if exists program_testimonial_assignments_admin_content on public.program_testimonial_assignments;
create policy program_testimonial_assignments_admin_content
on public.program_testimonial_assignments
for all
to authenticated
using (public.has_admin_role(array['owner', 'editor', 'author']))
with check (public.has_admin_role(array['owner', 'editor', 'author']));

drop policy if exists journal_posts_admin_content on public.journal_posts;
create policy journal_posts_admin_content
on public.journal_posts
for all
to authenticated
using (public.has_admin_role(array['owner', 'editor', 'author']))
with check (public.has_admin_role(array['owner', 'editor', 'author']));

drop policy if exists journal_post_translations_admin_content on public.journal_post_translations;
create policy journal_post_translations_admin_content
on public.journal_post_translations
for all
to authenticated
using (public.has_admin_role(array['owner', 'editor', 'author']))
with check (public.has_admin_role(array['owner', 'editor', 'author']));

drop policy if exists journal_categories_admin_content on public.journal_categories;
create policy journal_categories_admin_content
on public.journal_categories
for all
to authenticated
using (public.has_admin_role(array['owner', 'editor', 'author']))
with check (public.has_admin_role(array['owner', 'editor', 'author']));

drop policy if exists journal_category_translations_admin_content on public.journal_category_translations;
create policy journal_category_translations_admin_content
on public.journal_category_translations
for all
to authenticated
using (public.has_admin_role(array['owner', 'editor', 'author']))
with check (public.has_admin_role(array['owner', 'editor', 'author']));

drop policy if exists journal_category_assignments_admin_content on public.journal_category_assignments;
create policy journal_category_assignments_admin_content
on public.journal_category_assignments
for all
to authenticated
using (public.has_admin_role(array['owner', 'editor', 'author']))
with check (public.has_admin_role(array['owner', 'editor', 'author']));

drop policy if exists homepage_sections_admin_content on public.homepage_sections;
create policy homepage_sections_admin_content
on public.homepage_sections
for all
to authenticated
using (public.has_admin_role(array['owner', 'editor', 'author']))
with check (public.has_admin_role(array['owner', 'editor', 'author']));

drop policy if exists site_settings_admin_settings on public.site_settings;
create policy site_settings_admin_settings
on public.site_settings
for all
to authenticated
using (public.has_admin_role(array['owner', 'editor', 'operations']))
with check (public.has_admin_role(array['owner', 'editor', 'operations']));

-- Storage bucket scaffolding.
insert into storage.buckets (id, name, public)
values ('public-assets', 'public-assets', true)
on conflict (id) do update set public = excluded.public;

insert into storage.buckets (id, name, public)
values ('admin-uploads', 'admin-uploads', false)
on conflict (id) do update set public = excluded.public;



drop policy if exists public_assets_read on storage.objects;
create policy public_assets_read
on storage.objects
for select
to anon, authenticated
using (bucket_id = 'public-assets');

drop policy if exists private_assets_admin_read on storage.objects;
create policy private_assets_admin_read
on storage.objects
for select
to authenticated
using (
  bucket_id = 'admin-uploads'
  and public.has_admin_role(array['owner', 'editor', 'author', 'operations'])
);

drop policy if exists media_assets_admin_insert on storage.objects;
create policy media_assets_admin_insert
on storage.objects
for insert
to authenticated
with check (
  bucket_id in ('public-assets', 'admin-uploads')
  and public.has_admin_role(array['owner', 'editor', 'author', 'operations'])
);

drop policy if exists media_assets_admin_update on storage.objects;
create policy media_assets_admin_update
on storage.objects
for update
to authenticated
using (
  bucket_id in ('public-assets', 'admin-uploads')
  and public.has_admin_role(array['owner', 'editor', 'author', 'operations'])
)
with check (
  bucket_id in ('public-assets', 'admin-uploads')
  and public.has_admin_role(array['owner', 'editor', 'author', 'operations'])
);

drop policy if exists media_assets_admin_delete on storage.objects;
create policy media_assets_admin_delete
on storage.objects
for delete
to authenticated
using (
  bucket_id in ('public-assets', 'admin-uploads')
  and public.has_admin_role(array['owner', 'editor', 'author', 'operations'])
);
