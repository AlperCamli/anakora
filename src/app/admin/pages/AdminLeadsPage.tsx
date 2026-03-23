import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router";
import { listLeads } from "../data/leads";
import type { LeadListItem, LeadSource, LeadStatus } from "../types";
import { AdminStateCard } from "../components/AdminStateCard";

const SOURCE_OPTIONS: Array<{ label: string; value: LeadSource | "all" }> = [
  { label: "All sources", value: "all" },
  { label: "Newsletter", value: "newsletter" },
  { label: "Program booking", value: "program_booking" },
  { label: "Journal newsletter", value: "journal_newsletter" },
  { label: "General contact", value: "general_contact" },
  { label: "Waitlist", value: "waitlist" },
];

const STATUS_OPTIONS: Array<{ label: string; value: LeadStatus | "all" }> = [
  { label: "All statuses", value: "all" },
  { label: "New", value: "new" },
  { label: "Reviewed", value: "reviewed" },
  { label: "Contacted", value: "contacted" },
  { label: "Qualified", value: "qualified" },
  { label: "Converted", value: "converted" },
  { label: "Archived", value: "archived" },
  { label: "Spam", value: "spam" },
];

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "-";
  }
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function statusColor(status: LeadStatus): string {
  if (status === "new") {
    return "bg-terracotta/20 text-terracotta";
  }
  if (status === "converted") {
    return "bg-primary/10 text-primary";
  }
  if (status === "spam") {
    return "bg-destructive/10 text-destructive";
  }
  return "bg-muted text-muted-foreground";
}

export function AdminLeadsPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const [items, setItems] = useState<LeadListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const sourceFilter = (searchParams.get("source") as LeadSource | "all") || "all";
  const statusFilter = (searchParams.get("status") as LeadStatus | "all") || "all";

  useEffect(() => {
    let mounted = true;

    async function run() {
      setLoading(true);
      setError(null);

      try {
        const data = await listLeads({
          source: sourceFilter,
          status: statusFilter,
        });

        if (!mounted) {
          return;
        }

        setItems(data);
      } catch (fetchError) {
        if (!mounted) {
          return;
        }
        setError(fetchError instanceof Error ? fetchError.message : "Unknown error");
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    void run();
    return () => {
      mounted = false;
    };
  }, [sourceFilter, statusFilter]);

  const grouped = useMemo(() => {
    const countByStatus = new Map<LeadStatus, number>();
    for (const item of items) {
      countByStatus.set(item.status, (countByStatus.get(item.status) ?? 0) + 1);
    }
    return countByStatus;
  }, [items]);

  function setFilter(key: "source" | "status", value: string) {
    const next = new URLSearchParams(searchParams);
    if (!value || value === "all") {
      next.delete(key);
    } else {
      next.set(key, value);
    }
    setSearchParams(next);
  }

  if (loading) {
    return (
      <AdminStateCard
        title="Loading leads"
        message="Fetching submissions and pipeline statuses..."
      />
    );
  }

  if (error) {
    return <AdminStateCard title="Leads unavailable" message={error} tone="error" />;
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
        <h3 className="text-lg font-medium">Leads inbox</h3>
        <p className="text-sm text-muted-foreground">
          {items.length} submissions in current view.
        </p>
        <div className="mt-3 flex flex-wrap gap-2 text-xs">
          {STATUS_OPTIONS.filter((option) => option.value !== "all").map((option) => (
            <span key={option.value} className="rounded-full bg-muted px-2 py-1">
              {option.label}: {grouped.get(option.value as LeadStatus) ?? 0}
            </span>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 rounded-lg border border-border bg-card p-4 shadow-sm md:grid-cols-2">
        <select
          value={sourceFilter}
          onChange={(event) => setFilter("source", event.target.value)}
          className="rounded-md border border-border bg-background px-3 py-2 text-sm"
        >
          {SOURCE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        <select
          value={statusFilter}
          onChange={(event) => setFilter("status", event.target.value)}
          className="rounded-md border border-border bg-background px-3 py-2 text-sm"
        >
          {STATUS_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
        <table className="min-w-full divide-y divide-border text-sm">
          <thead className="bg-muted/40 text-left text-xs uppercase tracking-[0.08em] text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Lead</th>
              <th className="px-4 py-3">Source</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Submitted</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {items.map((item) => (
              <tr key={item.id}>
                <td className="px-4 py-3">
                  <p className="font-medium">{item.fullName || item.email}</p>
                  <p className="text-xs text-muted-foreground">{item.email}</p>
                  {item.phone && <p className="text-xs text-muted-foreground">{item.phone}</p>}
                  {item.programSlug && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      Program: {item.programSlug}
                    </p>
                  )}
                </td>
                <td className="px-4 py-3 text-xs uppercase tracking-wide text-muted-foreground">
                  {item.source}
                </td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2 py-1 text-xs ${statusColor(item.status)}`}>
                    {item.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs text-muted-foreground">
                  {formatDate(item.submittedAt)}
                </td>
                <td className="px-4 py-3 text-xs">
                  <Link to={`/admin/leads/${item.id}`} className="text-primary hover:underline">
                    Open
                  </Link>
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-sm text-muted-foreground">
                  No leads found for selected filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
