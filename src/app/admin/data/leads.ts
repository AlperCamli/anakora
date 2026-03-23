import { getSupabaseBrowserClient } from "../../../lib/supabase/browser-client";
import type { LeadDetail, LeadListItem, LeadSource, LeadStatus } from "../types";

interface ListLeadsOptions {
  source?: LeadSource | "all";
  status?: LeadStatus | "all";
}

function asRecord(value: unknown): Record<string, unknown> {
  if (typeof value === "object" && value !== null && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return {};
}

async function fetchProgramSlugMap(programIds: string[]): Promise<Map<string, string>> {
  const uniqueIds = Array.from(new Set(programIds.filter(Boolean)));
  if (uniqueIds.length === 0) {
    return new Map<string, string>();
  }

  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("programs")
    .select("id, slug")
    .in("id", uniqueIds);

  if (error) {
    throw new Error(error.message);
  }

  const map = new Map<string, string>();
  for (const row of (data ?? []) as Array<Record<string, unknown>>) {
    map.set(String(row.id), String(row.slug));
  }
  return map;
}

export async function listLeads(
  options: ListLeadsOptions = {},
): Promise<LeadListItem[]> {
  const supabase = getSupabaseBrowserClient();

  let query = supabase
    .from("lead_submissions")
    .select(
      "id, source, status, locale, program_id, full_name, email, phone, submitted_at, updated_at",
    )
    .order("submitted_at", { ascending: false })
    .limit(500);

  if (options.source && options.source !== "all") {
    query = query.eq("source", options.source);
  }

  if (options.status && options.status !== "all") {
    query = query.eq("status", options.status);
  }

  const { data, error } = await query;
  if (error) {
    throw new Error(error.message);
  }

  const rows = (data ?? []) as Array<Record<string, unknown>>;
  const programSlugMap = await fetchProgramSlugMap(
    rows.map((row) => String(row.program_id ?? "")),
  );

  return rows.map((row) => {
    const programId = typeof row.program_id === "string" ? row.program_id : null;
    return {
      id: String(row.id),
      source: String(row.source) as LeadListItem["source"],
      status: String(row.status) as LeadListItem["status"],
      locale: String(row.locale) as LeadListItem["locale"],
      programId,
      programSlug: programId ? programSlugMap.get(programId) ?? null : null,
      fullName: typeof row.full_name === "string" ? row.full_name : null,
      email: String(row.email),
      phone: typeof row.phone === "string" ? row.phone : null,
      submittedAt: String(row.submitted_at),
      updatedAt: String(row.updated_at),
    };
  });
}

export async function getLeadDetail(leadId: string): Promise<LeadDetail> {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("lead_submissions")
    .select(
      "id, source, status, locale, program_id, full_name, email, phone, message, metadata, consent_marketing, submitted_at, updated_at",
    )
    .eq("id", leadId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    throw new Error("Lead not found.");
  }

  const programSlugMap = await fetchProgramSlugMap([
    String((data as Record<string, unknown>).program_id ?? ""),
  ]);

  const row = data as Record<string, unknown>;
  const programId = typeof row.program_id === "string" ? row.program_id : null;
  const metadata = asRecord(row.metadata);

  return {
    id: String(row.id),
    source: String(row.source) as LeadDetail["source"],
    status: String(row.status) as LeadDetail["status"],
    locale: String(row.locale) as LeadDetail["locale"],
    programId,
    programSlug: programId ? programSlugMap.get(programId) ?? null : null,
    fullName: typeof row.full_name === "string" ? row.full_name : null,
    email: String(row.email),
    phone: typeof row.phone === "string" ? row.phone : null,
    submittedAt: String(row.submitted_at),
    updatedAt: String(row.updated_at),
    message: typeof row.message === "string" ? row.message : null,
    metadata,
    consentMarketing: Boolean(row.consent_marketing),
    internalNote:
      typeof metadata.internal_note === "string" ? metadata.internal_note : "",
  };
}

export async function updateLead(
  leadId: string,
  updates: {
    status: LeadStatus;
    internalNote: string;
    metadata: Record<string, unknown>;
  },
): Promise<void> {
  const supabase = getSupabaseBrowserClient();
  const metadata = {
    ...updates.metadata,
    internal_note: updates.internalNote.trim(),
  };

  const { error } = await supabase
    .from("lead_submissions")
    .update({
      status: updates.status,
      metadata,
    })
    .eq("id", leadId);

  if (error) {
    throw new Error(error.message);
  }
}
