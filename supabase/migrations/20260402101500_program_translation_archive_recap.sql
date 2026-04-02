-- Archive recap fields for completed programs (localized)

alter table public.program_translations
  add column if not exists archive_recap_markdown text,
  add column if not exists archive_highlights jsonb not null default '[]'::jsonb;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'program_translations_archive_highlights_array_ck'
  ) then
    alter table public.program_translations
      add constraint program_translations_archive_highlights_array_ck
      check (jsonb_typeof(archive_highlights) = 'array');
  end if;
end $$;
