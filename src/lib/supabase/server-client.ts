import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { assertServerOnly, readServerEnv, requireEnv } from "./env";

export interface SupabaseServerClientOptions {
  supabaseUrl?: string;
  supabaseAnonKey?: string;
  accessToken?: string;
}

export function createSupabaseServerClient(
  options: SupabaseServerClientOptions = {},
): SupabaseClient {
  assertServerOnly("createSupabaseServerClient");

  const supabaseUrl = requireEnv(
    options.supabaseUrl ?? readServerEnv("SUPABASE_URL"),
    "SUPABASE_URL",
  );
  const supabaseAnonKey = requireEnv(
    options.supabaseAnonKey ?? readServerEnv("SUPABASE_ANON_KEY"),
    "SUPABASE_ANON_KEY",
  );

  const accessToken = options.accessToken;

  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
    global: accessToken
      ? {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      : undefined,
  });
}
