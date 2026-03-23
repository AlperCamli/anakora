-- Optional seed scaffold for local development
-- Keep this file as scaffolding and adapt with real ANAKORA content via CMS/import scripts.

-- Example locale-aware site settings
insert into public.site_settings (
  locale,
  site_name,
  logo_text,
  tagline,
  contact_email,
  instagram_url,
  header_navigation,
  footer_legal_links
)
values
(
  'tr',
  'ANAKORA',
  'ANAKORA',
  'Kokten gelen, yolda devam eden.',
  'hello@anakora.com',
  'https://instagram.com/anakora',
  '[{"label":"Deneyimler","href":"/deneyimler"},{"label":"Arsiv","href":"/arsiv"},{"label":"Jurnal","href":"/jurnal"},{"label":"Hakkinda","href":"/hakkinda"}]'::jsonb,
  '[{"label":"Gizlilik Politikasi","href":"/gizlilik"},{"label":"Kullanim Sartlari","href":"/sartlar"}]'::jsonb
),
(
  'en',
  'ANAKORA',
  'ANAKORA',
  'Rooted in origin, moving through the journey.',
  'hello@anakora.com',
  'https://instagram.com/anakora',
  '[{"label":"Experiences","href":"/deneyimler"},{"label":"Archive","href":"/arsiv"},{"label":"Journal","href":"/jurnal"},{"label":"About","href":"/hakkinda"}]'::jsonb,
  '[{"label":"Privacy Policy","href":"/gizlilik"},{"label":"Terms","href":"/sartlar"}]'::jsonb
)
on conflict (locale) do update
set
  site_name = excluded.site_name,
  logo_text = excluded.logo_text,
  tagline = excluded.tagline,
  contact_email = excluded.contact_email,
  instagram_url = excluded.instagram_url,
  header_navigation = excluded.header_navigation,
  footer_legal_links = excluded.footer_legal_links;

-- Example homepage section payload scaffold
insert into public.homepage_sections (
  section_key,
  locale,
  title,
  subtitle,
  payload_json,
  is_active,
  sort_order
)
values
(
  'hero',
  'tr',
  'ANAKORA',
  'Biz tur satmiyoruz, birlikte yasanacak bir deneyim sunuyoruz.',
  '{"primaryCta":{"label":"Programlari Kesfet","href":"/deneyimler"},"secondaryCta":{"label":"Hikayemizi Oku","href":"/hakkinda"}}'::jsonb,
  true,
  10
),
(
  'hero',
  'en',
  'ANAKORA',
  'We do not sell trips; we curate experiences to live together.',
  '{"primaryCta":{"label":"Explore Programs","href":"/deneyimler"},"secondaryCta":{"label":"Read Our Story","href":"/hakkinda"}}'::jsonb,
  true,
  10
)
on conflict (section_key, locale) do update
set
  title = excluded.title,
  subtitle = excluded.subtitle,
  payload_json = excluded.payload_json,
  is_active = excluded.is_active,
  sort_order = excluded.sort_order;
