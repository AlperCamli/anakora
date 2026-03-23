import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { assertServerOnly, readServerEnv, requireEnv } from "./env";

export interface SupabaseAdminClientOptions {
  supabaseUrl?: string;
  serviceRoleKey?: string;
}

export function createSupabaseAdminClient(
  options: SupabaseAdminClientOptions = {},
): SupabaseClient {
  assertServerOnly("createSupabaseAdminClient");

  const supabaseUrl = requireEnv(
    options.supabaseUrl ?? readServerEnv("SUPABASE_URL"),
    "SUPABASE_URL",
  );
  const serviceRoleKey = requireEnv(
    options.serviceRoleKey ?? readServerEnv("SUPABASE_SERVICE_ROLE_KEY"),
    "SUPABASE_SERVICE_ROLE_KEY",
  );

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  });
}
