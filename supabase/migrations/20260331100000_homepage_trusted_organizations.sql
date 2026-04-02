-- Homepage trusted organizations logo strip content model

create table if not exists public.homepage_trusted_organizations (
  id uuid primary key default gen_random_uuid(),
  organization_name text not null,
  logo_url text not null,
  logo_alt text,
  website_url text,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_by uuid references public.admin_profiles(id) on delete set null,
  updated_by uuid references public.admin_profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_homepage_trusted_orgs_active_sort
  on public.homepage_trusted_organizations (is_active, sort_order);

create index if not exists idx_homepage_trusted_orgs_sort
  on public.homepage_trusted_organizations (sort_order);

drop trigger if exists trg_homepage_trusted_orgs_updated_at on public.homepage_trusted_organizations;
create trigger trg_homepage_trusted_orgs_updated_at
before update on public.homepage_trusted_organizations
for each row execute function public.set_updated_at();

alter table public.homepage_trusted_organizations enable row level security;

drop policy if exists homepage_trusted_orgs_public_read on public.homepage_trusted_organizations;
create policy homepage_trusted_orgs_public_read
on public.homepage_trusted_organizations
for select
to anon, authenticated
using (is_active = true);

drop policy if exists homepage_trusted_orgs_admin_content on public.homepage_trusted_organizations;
create policy homepage_trusted_orgs_admin_content
on public.homepage_trusted_organizations
for all
to authenticated
using (public.has_admin_role(array['owner', 'editor', 'author']))
with check (public.has_admin_role(array['owner', 'editor', 'author']));
