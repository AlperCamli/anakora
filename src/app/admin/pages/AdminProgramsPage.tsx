import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import {
  createEmptyProgramCategoryEditorValue,
  getProgramCategoryEditorById,
  listProgramCategories,
  listPrograms,
  saveProgramCategory,
} from "../data/programs";
import type {
  BookingMode,
  ProgramCategoryEditorValue,
  ProgramCategoryListItem,
  ProgramListItem,
  ProgramStatus,
} from "../types";
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
  const [categories, setCategories] = useState<ProgramCategoryListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState<ProgramStatus | "all">("all");
  const [bookingFilter, setBookingFilter] = useState<BookingMode | "all">("all");
  const [featuredOnly, setFeaturedOnly] = useState(false);
  const [sortBy, setSortBy] = useState<
    "starts_desc" | "starts_asc" | "updated_desc" | "title_asc"
  >("starts_desc");

  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [categoryEditor, setCategoryEditor] = useState<ProgramCategoryEditorValue>(
    createEmptyProgramCategoryEditorValue(),
  );
  const [categoryLoading, setCategoryLoading] = useState(false);
  const [categorySaving, setCategorySaving] = useState(false);
  const [categoryMessage, setCategoryMessage] = useState<string | null>(null);
  const [categoryError, setCategoryError] = useState<string | null>(null);

  async function refreshAll() {
    const [programRows, categoryRows] = await Promise.all([
      listPrograms(),
      listProgramCategories(),
    ]);
    setItems(programRows);
    setCategories(categoryRows);
  }

  useEffect(() => {
    let mounted = true;

    async function run() {
      setLoading(true);
      setError(null);

      try {
        const [programRows, categoryRows] = await Promise.all([
          listPrograms(),
          listProgramCategories(),
        ]);

        if (!mounted) {
          return;
        }

        setItems(programRows);
        setCategories(categoryRows);
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

  function resetCategoryEditor() {
    setSelectedCategoryId(null);
    setCategoryEditor(createEmptyProgramCategoryEditorValue());
    setCategoryError(null);
    setCategoryMessage(null);
  }

  async function loadCategoryEditor(categoryId: string) {
    setCategoryLoading(true);
    setCategoryError(null);
    try {
      const value = await getProgramCategoryEditorById(categoryId);
      setSelectedCategoryId(categoryId);
      setCategoryEditor(value);
    } catch (loadError) {
      setCategoryError(
        loadError instanceof Error ? loadError.message : "Kategori yuklenemedi.",
      );
    } finally {
      setCategoryLoading(false);
    }
  }

  async function persistCategory() {
    setCategorySaving(true);
    setCategoryError(null);
    setCategoryMessage(null);

    try {
      const savedId = await saveProgramCategory(categoryEditor);
      await refreshAll();
      setSelectedCategoryId(savedId);
      setCategoryEditor(await getProgramCategoryEditorById(savedId));
      setCategoryMessage(
        categoryEditor.id ? "Kategori guncellendi." : "Kategori olusturuldu.",
      );
    } catch (persistError) {
      setCategoryError(
        persistError instanceof Error
          ? persistError.message
          : "Kategori kaydedilemedi.",
      );
    } finally {
      setCategorySaving(false);
    }
  }

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

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-[1.45fr_0.85fr]">
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

        <ProgramCategoryEditorPanel
          categories={categories}
          selectedCategoryId={selectedCategoryId}
          value={categoryEditor}
          loading={categoryLoading}
          saving={categorySaving}
          message={categoryMessage}
          error={categoryError}
          onNew={resetCategoryEditor}
          onSelect={(categoryId) => void loadCategoryEditor(categoryId)}
          onChange={(key, value) => setCategoryEditor((prev) => ({ ...prev, [key]: value }))}
          onSave={() => void persistCategory()}
        />
      </section>
    </div>
  );
}

function ProgramCategoryEditorPanel({
  categories,
  selectedCategoryId,
  value,
  loading,
  saving,
  message,
  error,
  onNew,
  onSelect,
  onChange,
  onSave,
}: {
  categories: ProgramCategoryListItem[];
  selectedCategoryId: string | null;
  value: ProgramCategoryEditorValue;
  loading: boolean;
  saving: boolean;
  message: string | null;
  error: string | null;
  onNew: () => void;
  onSelect: (categoryId: string) => void;
  onChange: <K extends keyof ProgramCategoryEditorValue>(
    key: K,
    value: ProgramCategoryEditorValue[K],
  ) => void;
  onSave: () => void;
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <h4 className="text-base font-medium">Program kategorileri</h4>
        <button
          type="button"
          onClick={onNew}
          className="rounded-md border border-border px-3 py-1.5 text-xs hover:bg-muted"
        >
          Yeni
        </button>
      </div>

      <div className="space-y-2">
        {categories.map((category) => (
          <button
            key={category.id}
            type="button"
            onClick={() => onSelect(category.id)}
            className={`w-full rounded-md border px-3 py-2 text-left text-sm ${
              selectedCategoryId === category.id
                ? "border-primary bg-primary/5"
                : "border-border hover:bg-muted"
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <p className="font-medium">{category.trName || category.enName || category.slug}</p>
              {!category.isActive && (
                <span className="rounded-full border border-border px-2 py-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">
                  pasif
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground">/{category.slug}</p>
          </button>
        ))}
      </div>

      <div className="mt-3 space-y-2 rounded-md border border-border p-3">
        {loading ? (
          <AdminStateCard
            title="Kategori yukleniyor"
            message="Kategori alanlari hazirlaniyor..."
          />
        ) : (
          <>
            <input
              value={value.slug}
              onChange={(event) => onChange("slug", event.target.value)}
              placeholder="slug"
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
            />
            <input
              value={value.sortOrder}
              onChange={(event) => onChange("sortOrder", event.target.value)}
              placeholder="siralama"
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
            />
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={value.isActive}
                onChange={(event) => onChange("isActive", event.target.checked)}
              />
              Aktif
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={value.isFeatured}
                onChange={(event) => onChange("isFeatured", event.target.checked)}
              />
              One cikan
            </label>
            <input
              value={value.trName}
              onChange={(event) => onChange("trName", event.target.value)}
              placeholder="TR ad"
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
            />
            <textarea
              value={value.trDescription}
              onChange={(event) => onChange("trDescription", event.target.value)}
              rows={2}
              placeholder="TR aciklama"
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
            />
            <input
              value={value.enName}
              onChange={(event) => onChange("enName", event.target.value)}
              placeholder="EN ad"
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
            />
            <textarea
              value={value.enDescription}
              onChange={(event) => onChange("enDescription", event.target.value)}
              rows={2}
              placeholder="EN aciklama"
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
            />
            {(message || error) && (
              <p
                className={`rounded-md px-3 py-2 text-sm ${
                  error
                    ? "border border-destructive/20 bg-destructive/5 text-destructive"
                    : "border border-primary/20 bg-primary/10 text-primary"
                }`}
              >
                {error || message}
              </p>
            )}
            <button
              type="button"
              onClick={onSave}
              disabled={saving}
              className="w-full rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground disabled:opacity-70"
            >
              {saving ? "Kaydediliyor..." : "Kategoriyi kaydet"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
