-- Lead submissions: allow phone-only contact for specific public flows.

alter table public.lead_submissions
  alter column email drop not null;

alter table public.lead_submissions
  drop constraint if exists lead_submissions_email_or_phone_ck;

alter table public.lead_submissions
  add constraint lead_submissions_email_or_phone_ck
  check (
    nullif(btrim(coalesce(email, '')), '') is not null
    or nullif(btrim(coalesce(phone, '')), '') is not null
  );
