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
  return new Intl.DateTimeFormat("en-GB", {
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
        title="Loading guides"
        message="Fetching guide profiles and linked usage stats..."
      />
    );
  }

  if (error) {
    return (
      <AdminStateCard title="Guides unavailable" message={error} tone="error" />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 rounded-lg border border-border bg-card p-4 shadow-sm lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h3 className="text-lg font-medium">Guides</h3>
          <p className="text-sm text-muted-foreground">
            {filtered.length} results shown from {items.length} guide profiles.
          </p>
        </div>
        <Link
          to="/admin/guides/new"
          className="inline-flex rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground"
        >
          New guide
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-3 rounded-lg border border-border bg-card p-4 shadow-sm md:grid-cols-4">
        <input
          value={searchText}
          onChange={(event) => setSearchText(event.target.value)}
          placeholder="Search slug/name/email"
          className="rounded-md border border-border bg-background px-3 py-2 text-sm"
        />

        <select
          value={activeFilter}
          onChange={(event) =>
            setActiveFilter(event.target.value as "all" | "active" | "inactive")
          }
          className="rounded-md border border-border bg-background px-3 py-2 text-sm"
        >
          <option value="all">All profiles</option>
          <option value="active">Active only</option>
          <option value="inactive">Inactive only</option>
        </select>

        <label className="flex items-center gap-2 rounded-md border border-border bg-background px-3 py-2 text-sm">
          <input
            type="checkbox"
            checked={featuredOnly}
            onChange={(event) => setFeaturedOnly(event.target.checked)}
          />
          Featured only
        </label>
      </div>

      <div className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
        <table className="min-w-full divide-y divide-border text-sm">
          <thead className="bg-muted/40 text-left text-xs uppercase tracking-[0.08em] text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Guide</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Linked programs</th>
              <th className="px-4 py-3">Updated</th>
              <th className="px-4 py-3">Actions</th>
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
                    {item.isActive ? "active" : "inactive"}
                  </p>
                  {item.isFeatured && (
                    <p className="mt-1 text-xs text-terracotta">featured</p>
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
                    Edit
                  </Link>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-sm text-muted-foreground">
                  No guides match current filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
