import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import { listGuides } from "../data/guides";
import type { GuideListItem } from "../types";
import { AdminStateCard } from "../components/AdminStateCard";

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "-";
  }
  return new Intl.DateTimeFormat("tr-TR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

export function AdminGuidesPage() {
  const [items, setItems] = useState<GuideListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchText, setSearchText] = useState("");
  const [activeFilter, setActiveFilter] = useState<"all" | "active" | "inactive">(
    "all",
  );
  const [featuredOnly, setFeaturedOnly] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function run() {
      setLoading(true);
      setError(null);
      try {
        const data = await listGuides();
        if (!mounted) {
          return;
        }
        setItems(data);
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

  const filtered = useMemo(() => {
    let rows = [...items];

    if (activeFilter === "active") {
      rows = rows.filter((row) => row.isActive);
    }
    if (activeFilter === "inactive") {
      rows = rows.filter((row) => !row.isActive);
    }
    if (featuredOnly) {
      rows = rows.filter((row) => row.isFeatured);
    }

    const needle = searchText.trim().toLowerCase();
    if (needle) {
      rows = rows.filter((row) =>
        [row.slug, row.trName ?? "", row.enName ?? "", row.email ?? ""]
          .join(" ")
          .toLowerCase()
          .includes(needle),
      );
    }

    return rows;
  }, [activeFilter, featuredOnly, items, searchText]);

  if (loading) {
    return (
      <AdminStateCard
        title="Rehberler yukleniyor"
        message="Rehber profilleri ve bagli kullanim istatistikleri getiriliyor..."
      />
    );
  }

  if (error) {
    return (
      <AdminStateCard title="Rehberler kullanilamiyor" message={error} tone="error" />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 rounded-lg border border-border bg-card p-4 shadow-sm lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h3 className="text-lg font-medium">Rehberler</h3>
          <p className="text-sm text-muted-foreground">
            Toplam {items.length} rehber profilinden {filtered.length} sonuc.
          </p>
        </div>
        <Link
          to="/admin/guides/new"
          className="inline-flex rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground"
        >
          Yeni rehber
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-3 rounded-lg border border-border bg-card p-4 shadow-sm md:grid-cols-4">
        <input
          value={searchText}
          onChange={(event) => setSearchText(event.target.value)}
          placeholder="Slug/ad/e-posta ara"
          className="rounded-md border border-border bg-background px-3 py-2 text-sm"
        />

        <select
          value={activeFilter}
          onChange={(event) =>
            setActiveFilter(event.target.value as "all" | "active" | "inactive")
          }
          className="rounded-md border border-border bg-background px-3 py-2 text-sm"
        >
          <option value="all">Tum profiller</option>
          <option value="active">Sadece aktif</option>
          <option value="inactive">Sadece pasif</option>
        </select>

        <label className="flex items-center gap-2 rounded-md border border-border bg-background px-3 py-2 text-sm">
          <input
            type="checkbox"
            checked={featuredOnly}
            onChange={(event) => setFeaturedOnly(event.target.checked)}
          />
          Sadece one cikanlar
        </label>
      </div>

      <div className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
        <table className="min-w-full divide-y divide-border text-sm">
          <thead className="bg-muted/40 text-left text-xs uppercase tracking-[0.08em] text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Guide</th>
              <th className="px-4 py-3">Durum</th>
              <th className="px-4 py-3">Bagli programlar</th>
              <th className="px-4 py-3">Guncelleme</th>
              <th className="px-4 py-3">Islemler</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.map((item) => (
              <tr key={item.id}>
                <td className="px-4 py-3">
                  <p className="font-medium">{item.trName || item.enName || item.slug}</p>
                  <p className="text-xs text-muted-foreground">EN: {item.enName || "-"}</p>
                  <p className="mt-1 text-xs text-muted-foreground">/{item.slug}</p>
                  {item.email && (
                    <p className="text-xs text-muted-foreground">{item.email}</p>
                  )}
                </td>
                <td className="px-4 py-3">
                  <p
                    className={`inline-flex rounded-full px-2 py-1 text-xs ${
                      item.isActive
                        ? "bg-primary/10 text-primary"
                        : "bg-destructive/10 text-destructive"
                    }`}
                  >
                    {item.isActive ? "aktif" : "pasif"}
                  </p>
                  {item.isFeatured && (
                    <p className="mt-1 text-xs text-terracotta">one cikan</p>
                  )}
                </td>
                <td className="px-4 py-3 text-xs text-muted-foreground">
                  {item.linkedProgramCount}
                </td>
                <td className="px-4 py-3 text-xs text-muted-foreground">
                  {formatDate(item.updatedAt)}
                </td>
                <td className="px-4 py-3 text-xs">
                  <Link
                    to={`/admin/guides/${item.id}`}
                    className="text-primary hover:underline"
                  >
                    Duzenle
                  </Link>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-sm text-muted-foreground">
                  Secili filtrelere uygun rehber bulunamadi.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
