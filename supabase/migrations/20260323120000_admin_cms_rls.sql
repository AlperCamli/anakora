-- Admin CMS access layer for ANAKORA
-- Grants authenticated admin_profiles users full editorial and operations access via RLS.

create or replace function public.is_admin_user()
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
      and ap.role in ('owner', 'editor', 'author', 'operations')
  );
$$;

revoke all on function public.is_admin_user() from public;
grant execute on function public.is_admin_user() to authenticated;
grant execute on function public.is_admin_user() to service_role;

-- admin_profiles: self-read + admin management foundation

drop policy if exists admin_profiles_self_read on public.admin_profiles;
create policy admin_profiles_self_read
on public.admin_profiles
for select
to authenticated
using (id = auth.uid());

drop policy if exists admin_profiles_admin_manage on public.admin_profiles;
create policy admin_profiles_admin_manage
on public.admin_profiles
for all
to authenticated
using (public.is_admin_user())
with check (public.is_admin_user());

-- Core CMS and operations tables used by admin dashboard

drop policy if exists programs_admin_all on public.programs;
create policy programs_admin_all
on public.programs
for all
to authenticated
using (public.is_admin_user())
with check (public.is_admin_user());

drop policy if exists program_translations_admin_all on public.program_translations;
create policy program_translations_admin_all
on public.program_translations
for all
to authenticated
using (public.is_admin_user())
with check (public.is_admin_user());

drop policy if exists program_gallery_items_admin_all on public.program_gallery_items;
create policy program_gallery_items_admin_all
on public.program_gallery_items
for all
to authenticated
using (public.is_admin_user())
with check (public.is_admin_user());

drop policy if exists program_faqs_admin_all on public.program_faqs;
create policy program_faqs_admin_all
on public.program_faqs
for all
to authenticated
using (public.is_admin_user())
with check (public.is_admin_user());

drop policy if exists program_faq_translations_admin_all on public.program_faq_translations;
create policy program_faq_translations_admin_all
on public.program_faq_translations
for all
to authenticated
using (public.is_admin_user())
with check (public.is_admin_user());

drop policy if exists program_categories_admin_all on public.program_categories;
create policy program_categories_admin_all
on public.program_categories
for all
to authenticated
using (public.is_admin_user())
with check (public.is_admin_user());

drop policy if exists program_category_translations_admin_all on public.program_category_translations;
create policy program_category_translations_admin_all
on public.program_category_translations
for all
to authenticated
using (public.is_admin_user())
with check (public.is_admin_user());

drop policy if exists program_category_assignments_admin_all on public.program_category_assignments;
create policy program_category_assignments_admin_all
on public.program_category_assignments
for all
to authenticated
using (public.is_admin_user())
with check (public.is_admin_user());

drop policy if exists guides_admin_all on public.guides;
create policy guides_admin_all
on public.guides
for all
to authenticated
using (public.is_admin_user())
with check (public.is_admin_user());

drop policy if exists guide_translations_admin_all on public.guide_translations;
create policy guide_translations_admin_all
on public.guide_translations
for all
to authenticated
using (public.is_admin_user())
with check (public.is_admin_user());

drop policy if exists lead_submissions_admin_all on public.lead_submissions;
create policy lead_submissions_admin_all
on public.lead_submissions
for all
to authenticated
using (public.is_admin_user())
with check (public.is_admin_user());
