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
        setError(fetchError instanceof Error ? fetchError.message : "Bilinmeyen hata");
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
        title="Panel yukleniyor"
        message="Icerik ve operasyon metrikleri toplaniyor..."
      />
    );
  }

  if (error || !overview) {
    return (
      <AdminStateCard
        title="Panel kullanilamiyor"
        message={error ?? "Panel metrikleri yuklenemedi."}
        tone="error"
      />
    );
  }

  return (
    <div className="space-y-6">
      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Programlar"
          value={overview.totalPrograms}
          hint={`${overview.draftPrograms} yaklasan, ${overview.featuredPrograms} one cikan`}
        />
        <StatCard
          label="Rehberler"
          value={overview.totalGuides}
          hint={`${overview.activeGuides} aktif profil`}
        />
        <StatCard
          label="Yeni Lead"
          value={overview.newLeads}
          hint="Ilk inceleme bekliyor"
        />
        <StatCard
          label="Acik Pipeline"
          value={overview.inProgressLeads}
          hint={`${overview.totalLeads} toplam lead takipte`}
        />
      </section>

      <section className="rounded-lg border border-border bg-card p-5 shadow-sm">
        <h3 className="text-lg font-medium">Hizli Islemler</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Gunluk operasyonlarda en sik kullanilan islemler.
        </p>
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Link
            to="/admin/programs/new"
            className="rounded-md border border-border px-4 py-3 text-sm transition-colors hover:bg-muted"
          >
            Yeni program
          </Link>
          <Link
            to="/admin/guides/new"
            className="rounded-md border border-border px-4 py-3 text-sm transition-colors hover:bg-muted"
          >
            Yeni rehber
          </Link>
          <Link
            to="/admin/leads?status=new"
            className="rounded-md border border-border px-4 py-3 text-sm transition-colors hover:bg-muted"
          >
            Yeni leadleri incele
          </Link>
          <Link
            to="/admin/programs"
            className="rounded-md border border-border px-4 py-3 text-sm transition-colors hover:bg-muted"
          >
            Program katalogunu yonet
          </Link>
        </div>
      </section>
    </div>
  );
}
