import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import { listPrograms } from "../data/programs";
import type { BookingMode, ProgramListItem, ProgramStatus } from "../types";
import { AdminStateCard } from "../components/AdminStateCard";

const STATUS_OPTIONS: Array<{ label: string; value: ProgramStatus | "all" }> = [
  { label: "Tum durumlar", value: "all" },
  { label: "Yaklasan", value: "upcoming" },
  { label: "Yayinda", value: "published" },
  { label: "Tamamlandi", value: "completed" },
  { label: "Iptal", value: "cancelled" },
];

const BOOKING_OPTIONS: Array<{ label: string; value: BookingMode | "all" }> = [
  { label: "Tum rezervasyon tipleri", value: "all" },
  { label: "Basvuru", value: "application" },
  { label: "Dogrudan", value: "direct" },
  { label: "Harici", value: "external" },
];

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

function formatCurrency(amount: number | null, currency: string | null): string {
  if (amount === null) {
    return "-";
  }

  try {
    return new Intl.NumberFormat("tr-TR", {
      style: "currency",
      currency: currency || "TRY",
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${amount} ${currency ?? "TRY"}`;
  }
}

function statusChipColor(status: ProgramStatus): string {
  if (status === "published") {
    return "bg-primary/10 text-primary";
  }
  if (status === "upcoming") {
    return "bg-terracotta/15 text-terracotta";
  }
  if (status === "completed") {
    return "bg-muted text-muted-foreground";
  }
  return "bg-destructive/10 text-destructive";
}

export function AdminProgramsPage() {
  const [items, setItems] = useState<ProgramListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState<ProgramStatus | "all">("all");
  const [bookingFilter, setBookingFilter] = useState<BookingMode | "all">("all");
  const [featuredOnly, setFeaturedOnly] = useState(false);
  const [sortBy, setSortBy] = useState<
    "starts_desc" | "starts_asc" | "updated_desc" | "title_asc"
  >("starts_desc");

  useEffect(() => {
    let mounted = true;

    async function run() {
      setLoading(true);
      setError(null);

      try {
        const data = await listPrograms();
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

    if (statusFilter !== "all") {
      rows = rows.filter((row) => row.status === statusFilter);
    }

    if (bookingFilter !== "all") {
      rows = rows.filter((row) => row.bookingMode === bookingFilter);
    }

    if (featuredOnly) {
      rows = rows.filter((row) => row.isFeatured);
    }

    const needle = searchText.trim().toLowerCase();
    if (needle) {
      rows = rows.filter((row) => {
        return [
          row.slug,
          row.trTitle ?? "",
          row.enTitle ?? "",
          row.locationName,
          row.city ?? "",
        ]
          .join(" ")
          .toLowerCase()
          .includes(needle);
      });
    }

    if (sortBy === "starts_desc") {
      rows.sort(
        (a, b) =>
          new Date(b.startsAt).getTime() - new Date(a.startsAt).getTime(),
      );
    }
    if (sortBy === "starts_asc") {
      rows.sort(
        (a, b) =>
          new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime(),
      );
    }
    if (sortBy === "updated_desc") {
      rows.sort(
        (a, b) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
      );
    }
    if (sortBy === "title_asc") {
      rows.sort((a, b) => {
        const aTitle = a.trTitle || a.enTitle || a.slug;
        const bTitle = b.trTitle || b.enTitle || b.slug;
        return aTitle.localeCompare(bTitle);
      });
    }

    return rows;
  }, [items, statusFilter, bookingFilter, featuredOnly, searchText, sortBy]);

  if (loading) {
    return (
      <AdminStateCard
        title="Programlar yukleniyor"
        message="Program katalogu getiriliyor..."
      />
    );
  }

  if (error) {
    return (
      <AdminStateCard
        title="Programlar kullanilamiyor"
        message={error}
        tone="error"
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 rounded-lg border border-border bg-card p-4 shadow-sm lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h3 className="text-lg font-medium">Program katalogu</h3>
          <p className="text-sm text-muted-foreground">
            Toplam {items.length} programdan {filtered.length} sonuc gosteriliyor.
          </p>
        </div>
        <Link
          to="/admin/programs/new"
          className="inline-flex rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground"
        >
          Yeni program
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-3 rounded-lg border border-border bg-card p-4 shadow-sm md:grid-cols-2 xl:grid-cols-5">
        <input
          value={searchText}
          onChange={(event) => setSearchText(event.target.value)}
          placeholder="Slug/baslik/lokasyon ara"
          className="rounded-md border border-border bg-background px-3 py-2 text-sm"
        />

        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value as ProgramStatus | "all")}
          className="rounded-md border border-border bg-background px-3 py-2 text-sm"
        >
          {STATUS_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        <select
          value={bookingFilter}
          onChange={(event) => setBookingFilter(event.target.value as BookingMode | "all")}
          className="rounded-md border border-border bg-background px-3 py-2 text-sm"
        >
          {BOOKING_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        <select
          value={sortBy}
          onChange={(event) =>
            setSortBy(
              event.target.value as
                | "starts_desc"
                | "starts_asc"
                | "updated_desc"
                | "title_asc",
            )
          }
          className="rounded-md border border-border bg-background px-3 py-2 text-sm"
        >
          <option value="starts_desc">Baslangic tarihi: yeni-eski</option>
          <option value="starts_asc">Baslangic tarihi: eski-yeni</option>
          <option value="updated_desc">Son guncellenenler</option>
          <option value="title_asc">Baslik A-Z</option>
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
              <th className="px-4 py-3">Program</th>
              <th className="px-4 py-3">Durum</th>
              <th className="px-4 py-3">Rezervasyon</th>
              <th className="px-4 py-3">Tarihler</th>
              <th className="px-4 py-3">Fiyat</th>
              <th className="px-4 py-3">Islemler</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.map((item) => (
              <tr key={item.id} className="align-top">
                <td className="px-4 py-3">
                  <p className="font-medium">{item.trTitle || item.enTitle || "Basliksiz"}</p>
                  <p className="text-xs text-muted-foreground">EN: {item.enTitle || "-"}</p>
                  <p className="mt-1 text-xs text-muted-foreground">/{item.slug}</p>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${statusChipColor(item.status)}`}
                  >
                    {item.status}
                  </span>
                  {item.isFeatured && (
                    <p className="mt-1 text-xs text-terracotta">One cikan</p>
                  )}
                </td>
                <td className="px-4 py-3 text-xs uppercase tracking-wide text-muted-foreground">
                  {item.bookingMode}
                </td>
                <td className="px-4 py-3 text-xs text-muted-foreground">
                  <p>{formatDate(item.startsAt)}</p>
                  <p>{item.endsAt ? formatDate(item.endsAt) : "-"}</p>
                </td>
                <td className="px-4 py-3 text-xs text-muted-foreground">
                  {formatCurrency(item.priceAmount, item.priceCurrency)}
                </td>
                <td className="px-4 py-3 text-xs">
                  <div className="flex flex-col gap-2">
                    <Link
                      to={`/admin/programs/${item.id}`}
                      className="text-primary hover:underline"
                    >
                      Duzenle
                    </Link>
                    <a
                      href={`/deneyimler/${item.slug}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-muted-foreground hover:underline"
                    >
                      Onizle
                    </a>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-sm text-muted-foreground">
                  Secili filtrelere uygun program bulunamadi.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
