import { useEffect, useState } from "react";
import { Link, useParams } from "react-router";
import { getLeadDetail, updateLead } from "../data/leads";
import type { LeadDetail, LeadStatus } from "../types";
import { AdminStateCard } from "../components/AdminStateCard";

const STATUS_OPTIONS: LeadStatus[] = [
  "new",
  "reviewed",
  "contacted",
  "qualified",
  "converted",
  "archived",
  "spam",
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

export function AdminLeadDetailPage() {
  const { leadId } = useParams();

  const [detail, setDetail] = useState<LeadDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [status, setStatus] = useState<LeadStatus>("new");
  const [internalNote, setInternalNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function run() {
      setLoading(true);
      setError(null);
      try {
        const data = await getLeadDetail(leadId);
        if (!mounted) {
          return;
        }
        setDetail(data);
        setStatus(data.status);
        setInternalNote(data.internalNote);
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
  }, [leadId]);

  async function handleSave() {
    if (!detail) {
      return;
    }

    setSaving(true);
    setSaveError(null);
    setSaveMessage(null);

    try {
      await updateLead(detail.id, {
        status,
        internalNote,
        metadata: detail.metadata,
      });

      setDetail((prev) =>
        prev
          ? {
              ...prev,
              status,
              internalNote,
              metadata: {
                ...prev.metadata,
                internal_note: internalNote,
              },
            }
          : prev,
      );
      setSaveMessage("Lead status and note updated.");
    } catch (persistError) {
      setSaveError(
        persistError instanceof Error ? persistError.message : "Could not save lead update.",
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <AdminStateCard
        title="Loading lead"
        message="Retrieving submission detail and current status..."
      />
    );
  }

  if (error || !detail) {
    return (
      <AdminStateCard
        title="Lead unavailable"
        message={error ?? "Lead could not be found."}
        tone="error"
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
              Lead detail
            </p>
            <h3 className="text-lg font-medium">{detail.fullName || detail.email}</h3>
            <p className="text-sm text-muted-foreground">{detail.email}</p>
          </div>
          <Link
            to="/admin/leads"
            className="rounded-md border border-border px-3 py-2 text-sm hover:bg-muted"
          >
            Back to inbox
          </Link>
        </div>
      </div>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
          <h4 className="mb-3 text-base font-medium">Submission</h4>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Source</dt>
              <dd className="font-medium uppercase tracking-wide">{detail.source}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Locale</dt>
              <dd className="font-medium uppercase tracking-wide">{detail.locale}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Program</dt>
              <dd className="font-medium">{detail.programSlug || "-"}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Phone</dt>
              <dd className="font-medium">{detail.phone || "-"}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Submitted</dt>
              <dd className="font-medium">{formatDate(detail.submittedAt)}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Marketing consent</dt>
              <dd className="font-medium">{detail.consentMarketing ? "yes" : "no"}</dd>
            </div>
          </dl>

          <div className="mt-4 rounded-md border border-border bg-background p-3">
            <p className="mb-2 text-xs uppercase tracking-[0.12em] text-muted-foreground">
              Message
            </p>
            <p className="whitespace-pre-wrap text-sm text-foreground/90">
              {detail.message || "No message provided."}
            </p>
          </div>
        </div>

        <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
          <h4 className="mb-3 text-base font-medium">Ops actions</h4>
          <div className="space-y-3">
            <label className="block space-y-1 text-sm">
              <span>Status</span>
              <select
                value={status}
                onChange={(event) => setStatus(event.target.value as LeadStatus)}
                className="w-full rounded-md border border-border bg-background px-3 py-2"
              >
                {STATUS_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>

            <label className="block space-y-1 text-sm">
              <span>Internal note</span>
              <textarea
                value={internalNote}
                onChange={(event) => setInternalNote(event.target.value)}
                rows={8}
                placeholder="Add qualification notes, follow-up outcomes, or operational context."
                className="w-full rounded-md border border-border bg-background px-3 py-2"
              />
            </label>

            <button
              type="button"
              onClick={() => void handleSave()}
              disabled={saving}
              className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground disabled:opacity-70"
            >
              {saving ? "Saving..." : "Update lead"}
            </button>

            {(saveMessage || saveError) && (
              <p
                className={`rounded-md px-3 py-2 text-sm ${
                  saveError
                    ? "border border-destructive/20 bg-destructive/5 text-destructive"
                    : "border border-primary/20 bg-primary/10 text-primary"
                }`}
              >
                {saveError || saveMessage}
              </p>
            )}
          </div>
        </div>
      </section>

      <section className="rounded-lg border border-border bg-card p-4 shadow-sm">
        <h4 className="mb-2 text-base font-medium">Metadata snapshot</h4>
        <pre className="overflow-auto rounded-md bg-background p-3 text-xs text-muted-foreground">
          {JSON.stringify(detail.metadata, null, 2)}
        </pre>
      </section>
    </div>
  );
}
