import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseBrowserClient } from "../../lib/supabase/browser-client";
import { createSupabaseServerClient } from "../../lib/supabase/server-client";

export type DataClient = SupabaseClient;

export function getDataClient(): DataClient {
  if (typeof window !== "undefined") {
    return getSupabaseBrowserClient();
  }
  return createSupabaseServerClient();
}
