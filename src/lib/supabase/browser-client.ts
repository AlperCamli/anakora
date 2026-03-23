import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { requireEnv } from "./env";

let browserClient: SupabaseClient | undefined;

function getBrowserEnv() {
  return {
    supabaseUrl: requireEnv(
      import.meta.env.VITE_SUPABASE_URL,
      "VITE_SUPABASE_URL",
    ),
    supabaseAnonKey: requireEnv(
      import.meta.env.VITE_SUPABASE_ANON_KEY,
      "VITE_SUPABASE_ANON_KEY",
    ),
  };
}

export function getSupabaseBrowserClient(): SupabaseClient {
  if (browserClient) {
    return browserClient;
  }

  const { supabaseUrl, supabaseAnonKey } = getBrowserEnv();

  browserClient = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
  });

  return browserClient;
}
