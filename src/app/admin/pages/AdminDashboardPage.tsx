import { useEffect, useState } from "react";
import { Link } from "react-router";
import { getDashboardOverview } from "../data/dashboard";
import type { DashboardOverview } from "../types";
import { AdminStateCard } from "../components/AdminStateCard";

function StatCard({ label, value, hint }: { label: string; value: number; hint: string }) {
  return (
    <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
      <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">{label}</p>
      <p className="mt-2 text-3xl font-semibold">{value}</p>
      <p className="mt-1 text-sm text-muted-foreground">{hint}</p>
    </div>
  );
}

export function AdminDashboardPage() {
  const [overview, setOverview] = useState<DashboardOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function run() {
      setLoading(true);
      setError(null);
      try {
        const data = await getDashboardOverview();
        if (!mounted) {
          return;
        }
        setOverview(data);
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
  }, []);

  if (loading) {
    return (
      <AdminStateCard
        title="Loading dashboard"
        message="Collecting content and operations metrics..."
      />
    );
  }

  if (error || !overview) {
    return (
      <AdminStateCard
        title="Dashboard unavailable"
        message={error ?? "Could not load dashboard metrics."}
        tone="error"
      />
    );
  }

  return (
    <div className="space-y-6">
      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Programs"
          value={overview.totalPrograms}
          hint={`${overview.draftPrograms} upcoming, ${overview.featuredPrograms} featured`}
        />
        <StatCard
          label="Guides"
          value={overview.totalGuides}
          hint={`${overview.activeGuides} active profiles`}
        />
        <StatCard
          label="New Leads"
          value={overview.newLeads}
          hint="Needs first review"
        />
        <StatCard
          label="Open Pipeline"
          value={overview.inProgressLeads}
          hint={`${overview.totalLeads} total leads tracked`}
        />
      </section>

      <section className="rounded-lg border border-border bg-card p-5 shadow-sm">
        <h3 className="text-lg font-medium">Quick Actions</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Common editorial tasks for daily operations.
        </p>
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Link
            to="/admin/programs/new"
            className="rounded-md border border-border px-4 py-3 text-sm transition-colors hover:bg-muted"
          >
            New program
          </Link>
          <Link
            to="/admin/guides/new"
            className="rounded-md border border-border px-4 py-3 text-sm transition-colors hover:bg-muted"
          >
            New guide
          </Link>
          <Link
            to="/admin/leads?status=new"
            className="rounded-md border border-border px-4 py-3 text-sm transition-colors hover:bg-muted"
          >
            Review new leads
          </Link>
          <Link
            to="/admin/programs"
            className="rounded-md border border-border px-4 py-3 text-sm transition-colors hover:bg-muted"
          >
            Manage program catalog
          </Link>
        </div>
      </section>
    </div>
  );
}
