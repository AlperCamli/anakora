import { getSupabaseBrowserClient } from "../../../lib/supabase/browser-client";
import type { DashboardOverview } from "../types";

async function countRows(
  table: string,
  apply?: (query: any) => any,
): Promise<number> {
  const supabase = getSupabaseBrowserClient();
  let query = supabase.from(table).select("*", { count: "exact", head: true });

  if (apply) {
    query = apply(query);
  }

  const { count, error } = await query;
  if (error) {
    throw new Error(error.message);
  }

  return count ?? 0;
}

export async function getDashboardOverview(): Promise<DashboardOverview> {
  const [
    totalPrograms,
    draftPrograms,
    featuredPrograms,
    totalGuides,
    activeGuides,
    totalLeads,
    newLeads,
    inProgressLeads,
  ] = await Promise.all([
    countRows("programs"),
    countRows("programs", (query) => query.eq("status", "upcoming")),
    countRows("programs", (query) => query.eq("is_featured", true)),
    countRows("guides"),
    countRows("guides", (query) => query.eq("is_active", true)),
    countRows("lead_submissions"),
    countRows("lead_submissions", (query) => query.eq("status", "new")),
    countRows("lead_submissions", (query) =>
      query.in("status", ["reviewed", "contacted", "qualified"]),
    ),
  ]);

  return {
    totalPrograms,
    draftPrograms,
    featuredPrograms,
    totalGuides,
    activeGuides,
    totalLeads,
    newLeads,
    inProgressLeads,
  };
}
