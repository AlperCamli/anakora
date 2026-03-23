/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
  readonly VITE_ENABLE_CAPTCHA?: string;
  readonly VITE_SUPABASE_STORAGE_BUCKET_PUBLIC?: string;
  readonly VITE_SUPABASE_STORAGE_BUCKET_PRIVATE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
