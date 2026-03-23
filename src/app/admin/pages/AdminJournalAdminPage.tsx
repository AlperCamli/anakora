import { useEffect, useMemo, useState } from "react";
import { AdminLocaleCompleteness } from "../components/AdminLocaleCompleteness";
import { AdminRoleGate } from "../components/AdminRoleGate";
import { AdminStateCard } from "../components/AdminStateCard";
import { useAdminAuth } from "../context/AdminAuthContext";
import {
  createEmptyJournalCategoryEditorValue,
  createEmptyJournalPostEditorValue,
  getJournalCategoryEditorById,
  getJournalFormLookups,
  getJournalPostEditorById,
  listJournalPosts,
  saveJournalCategory,
  saveJournalPost,
} from "../data/journal";
import type {
  JournalCategoryEditorValue,
  JournalCategoryListItem,
  JournalPostEditorValue,
  JournalPostListItem,
  JournalPostStatus,
} from "../types";

type StatusFilter = "all" | JournalPostStatus;

function formatDateTime(value: string | null) {
  if (!value) {
    return "-";
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(parsed);
}

export function AdminJournalAdminPage() {
  return (
    <AdminRoleGate capability="manage_content">
      <JournalAdminPageContent />
    </AdminRoleGate>
  );
}

function JournalAdminPageContent() {
  const { user } = useAdminAuth();
  const [posts, setPosts] = useState<JournalPostListItem[]>([]);
  const [categories, setCategories] = useState<JournalCategoryListItem[]>([]);
  const [guides, setGuides] = useState<Array<{ id: string; name: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const [postEditor, setPostEditor] = useState<JournalPostEditorValue>(
    createEmptyJournalPostEditorValue(),
  );
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [postLoading, setPostLoading] = useState(false);
  const [postSaving, setPostSaving] = useState(false);
  const [postMessage, setPostMessage] = useState<string | null>(null);
  const [postError, setPostError] = useState<string | null>(null);

  const [categoryEditor, setCategoryEditor] = useState<JournalCategoryEditorValue>(
    createEmptyJournalCategoryEditorValue(),
  );
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [categoryLoading, setCategoryLoading] = useState(false);
  const [categorySaving, setCategorySaving] = useState(false);
  const [categoryMessage, setCategoryMessage] = useState<string | null>(null);
  const [categoryError, setCategoryError] = useState<string | null>(null);

  async function refreshAll() {
    const [{ guides: nextGuides, categories: nextCategories }, nextPosts] =
      await Promise.all([getJournalFormLookups(), listJournalPosts()]);
    setGuides(nextGuides.map((item) => ({ id: item.id, name: item.name })));
    setCategories(nextCategories);
    setPosts(nextPosts);
  }

  useEffect(() => {
    let mounted = true;
    async function run() {
      setLoading(true);
      setError(null);
      try {
        const [{ guides: nextGuides, categories: nextCategories }, nextPosts] =
          await Promise.all([getJournalFormLookups(), listJournalPosts()]);
        if (!mounted) {
          return;
        }
        setGuides(nextGuides.map((item) => ({ id: item.id, name: item.name })));
        setCategories(nextCategories);
        setPosts(nextPosts);
      } catch (fetchError) {
        if (mounted) {
          setError(fetchError instanceof Error ? fetchError.message : "Unknown error");
        }
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

  const filteredPosts = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return posts.filter((post) => {
      if (statusFilter !== "all" && post.status !== statusFilter) {
        return false;
      }
      if (!needle) {
        return true;
      }
      return [post.slug, post.trTitle ?? "", post.enTitle ?? ""]
        .join(" ")
        .toLowerCase()
        .includes(needle);
    });
  }, [posts, search, statusFilter]);

  function resetPostEditor() {
    setSelectedPostId(null);
    setPostEditor(createEmptyJournalPostEditorValue());
    setPostError(null);
    setPostMessage(null);
  }

  async function loadPostEditor(postId: string) {
    setPostLoading(true);
    setPostError(null);
    try {
      const value = await getJournalPostEditorById(postId);
      setSelectedPostId(postId);
      setPostEditor(value);
    } catch (loadError) {
      setPostError(loadError instanceof Error ? loadError.message : "Could not load post.");
    } finally {
      setPostLoading(false);
    }
  }

  async function persistPost(statusOverride?: JournalPostStatus) {
    if (!user) {
      setPostError("Authenticated user could not be resolved.");
      return;
    }

    setPostSaving(true);
    setPostError(null);
    setPostMessage(null);
    try {
      const savedId = await saveJournalPost(
        { ...postEditor, status: statusOverride ?? postEditor.status },
        user.id,
      );
      await refreshAll();
      setSelectedPostId(savedId);
      setPostEditor(await getJournalPostEditorById(savedId));
      setPostMessage(statusOverride === "published" ? "Post published." : "Post saved.");
    } catch (persistError) {
      setPostError(
        persistError instanceof Error ? persistError.message : "Could not save post.",
      );
    } finally {
      setPostSaving(false);
    }
  }

  function resetCategoryEditor() {
    setSelectedCategoryId(null);
    setCategoryEditor(createEmptyJournalCategoryEditorValue());
    setCategoryError(null);
    setCategoryMessage(null);
  }

  async function loadCategoryEditor(categoryId: string) {
    setCategoryLoading(true);
    setCategoryError(null);
    try {
      const value = await getJournalCategoryEditorById(categoryId);
      setSelectedCategoryId(categoryId);
      setCategoryEditor(value);
    } catch (loadError) {
      setCategoryError(
        loadError instanceof Error ? loadError.message : "Could not load category.",
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
      const savedId = await saveJournalCategory(categoryEditor);
      await refreshAll();
      setSelectedCategoryId(savedId);
      setCategoryEditor(await getJournalCategoryEditorById(savedId));
      setCategoryMessage(categoryEditor.id ? "Category updated." : "Category created.");
    } catch (persistError) {
      setCategoryError(
        persistError instanceof Error ? persistError.message : "Could not save category.",
      );
    } finally {
      setCategorySaving(false);
    }
  }

  if (loading) {
    return <AdminStateCard title="Loading journal module" message="Preparing posts and categories..." />;
  }

  if (error) {
    return <AdminStateCard title="Journal unavailable" message={error} tone="error" />;
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-medium">Journal</h3>
            <p className="text-sm text-muted-foreground">
              {filteredPosts.length} posts from {posts.length}.
            </p>
          </div>
          <button
            type="button"
            onClick={resetPostEditor}
            className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground"
          >
            New post
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 rounded-lg border border-border bg-card p-4 shadow-sm md:grid-cols-3">
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search slug/title"
          className="rounded-md border border-border bg-background px-3 py-2 text-sm"
        />
        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}
          className="rounded-md border border-border bg-background px-3 py-2 text-sm"
        >
          <option value="all">All statuses</option>
          <option value="draft">Draft</option>
          <option value="published">Published</option>
          <option value="archived">Archived</option>
        </select>
      </div>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-[1.05fr_1.2fr_0.75fr]">
        <div className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
          <table className="min-w-full divide-y divide-border text-sm">
            <thead className="bg-muted/40 text-left text-xs uppercase tracking-[0.08em] text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Post</th>
                <th className="px-4 py-3">Locale</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredPosts.map((post) => (
                <tr
                  key={post.id}
                  className="cursor-pointer align-top hover:bg-muted/40"
                  onClick={() => void loadPostEditor(post.id)}
                >
                  <td className="px-4 py-3">
                    <p className="font-medium">{post.trTitle || post.enTitle || post.slug}</p>
                    <p className="mt-1 text-xs text-muted-foreground">/{post.slug}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {post.categoryCount} categories • {post.readingTimeMinutes ?? "-"} min
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <AdminLocaleCompleteness
                      trComplete={Boolean(post.trTitle?.trim())}
                      enComplete={Boolean(post.enTitle?.trim())}
                    />
                  </td>
                  <td className="px-4 py-3 text-xs">
                    <p className="font-medium uppercase tracking-wide">{post.status}</p>
                    <p className="text-muted-foreground">{formatDateTime(post.publishedAt)}</p>
                  </td>
                </tr>
              ))}
              {filteredPosts.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-4 py-8 text-center text-sm text-muted-foreground">
                    No journal post found for selected filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <JournalPostEditor
          value={postEditor}
          categories={categories}
          guides={guides}
          loading={postLoading}
          saving={postSaving}
          selectedPostId={selectedPostId}
          message={postMessage}
          error={postError}
          onFieldChange={(key, value) => setPostEditor((prev) => ({ ...prev, [key]: value }))}
          onTrChange={(key, value) =>
            setPostEditor((prev) => ({ ...prev, tr: { ...prev.tr, [key]: value } }))
          }
          onEnChange={(key, value) =>
            setPostEditor((prev) => ({ ...prev, en: { ...prev.en, [key]: value } }))
          }
          onToggleCategory={(categoryId) =>
            setPostEditor((prev) => ({
              ...prev,
              categoryIds: prev.categoryIds.includes(categoryId)
                ? prev.categoryIds.filter((id) => id !== categoryId)
                : [...prev.categoryIds, categoryId],
            }))
          }
          onSave={() => void persistPost()}
          onPublish={() => void persistPost("published")}
        />

        <JournalCategoryEditor
          categories={categories}
          selectedCategoryId={selectedCategoryId}
          value={categoryEditor}
          loading={categoryLoading}
          saving={categorySaving}
          message={categoryMessage}
          error={categoryError}
          onNew={resetCategoryEditor}
          onSelect={(categoryId) => void loadCategoryEditor(categoryId)}
          onChange={(key, value) =>
            setCategoryEditor((prev) => ({ ...prev, [key]: value }))
          }
          onSave={() => void persistCategory()}
        />
      </section>
    </div>
  );
}

function JournalPostEditor({
  value,
  categories,
  guides,
  loading,
  saving,
  selectedPostId,
  message,
  error,
  onFieldChange,
  onTrChange,
  onEnChange,
  onToggleCategory,
  onSave,
  onPublish,
}: {
  value: JournalPostEditorValue;
  categories: JournalCategoryListItem[];
  guides: Array<{ id: string; name: string }>;
  loading: boolean;
  saving: boolean;
  selectedPostId: string | null;
  message: string | null;
  error: string | null;
  onFieldChange: <K extends keyof JournalPostEditorValue>(key: K, value: JournalPostEditorValue[K]) => void;
  onTrChange: <K extends keyof JournalPostEditorValue["tr"]>(key: K, value: JournalPostEditorValue["tr"][K]) => void;
  onEnChange: <K extends keyof JournalPostEditorValue["en"]>(key: K, value: JournalPostEditorValue["en"][K]) => void;
  onToggleCategory: (categoryId: string) => void;
  onSave: () => void;
  onPublish: () => void;
}) {
  if (loading) {
    return <AdminStateCard title="Loading editor" message="Retrieving post fields..." />;
  }

  return (
    <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
      <h4 className="text-base font-medium">{selectedPostId ? "Edit post" : "Create post"}</h4>
      <p className="text-xs text-muted-foreground">TR/EN content, categories, and publish flow.</p>
      <div className="mt-3 space-y-2">
        <input value={value.slug} onChange={(event) => onFieldChange("slug", event.target.value)} placeholder="slug" className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm" />
        <div className="grid grid-cols-2 gap-2">
          <select value={value.status} onChange={(event) => onFieldChange("status", event.target.value as JournalPostStatus)} className="rounded-md border border-border bg-background px-3 py-2 text-sm"><option value="draft">draft</option><option value="published">published</option><option value="archived">archived</option></select>
          <input value={value.readingTimeMinutes} onChange={(event) => onFieldChange("readingTimeMinutes", event.target.value)} placeholder="reading time" className="rounded-md border border-border bg-background px-3 py-2 text-sm" />
        </div>
        <input type="datetime-local" value={value.publishedAt} onChange={(event) => onFieldChange("publishedAt", event.target.value)} className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm" />
        <select value={value.primaryGuideId} onChange={(event) => onFieldChange("primaryGuideId", event.target.value)} className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"><option value="">No guide</option>{guides.map((guide) => <option key={guide.id} value={guide.id}>{guide.name}</option>)}</select>
        <input value={value.coverImageUrl} onChange={(event) => onFieldChange("coverImageUrl", event.target.value)} placeholder="cover image url" className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm" />
        <label className="flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm"><input type="checkbox" checked={value.isFeatured} onChange={(event) => onFieldChange("isFeatured", event.target.checked)} />Featured</label>
        <div className="rounded-md border border-border p-2 text-xs">
          <p className="mb-1 font-medium">Categories</p>
          <div className="grid grid-cols-1 gap-1">
            {categories.map((category) => (
              <label key={category.id} className="flex items-center gap-2">
                <input type="checkbox" checked={value.categoryIds.includes(category.id)} onChange={() => onToggleCategory(category.id)} />
                <span>{category.trName || category.enName || category.slug}</span>
              </label>
            ))}
          </div>
        </div>
        <textarea value={value.tr.title} onChange={(event) => onTrChange("title", event.target.value)} rows={2} placeholder="TR title" className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm" />
        <textarea value={value.tr.excerpt} onChange={(event) => onTrChange("excerpt", event.target.value)} rows={2} placeholder="TR excerpt" className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm" />
        <textarea value={value.tr.contentMarkdown} onChange={(event) => onTrChange("contentMarkdown", event.target.value)} rows={4} placeholder="TR markdown" className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm" />
        <input value={value.tr.coverImageAlt} onChange={(event) => onTrChange("coverImageAlt", event.target.value)} placeholder="TR cover alt" className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm" />
        <input value={value.tr.seoTitle} onChange={(event) => onTrChange("seoTitle", event.target.value)} placeholder="TR SEO title" className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm" />
        <textarea value={value.tr.seoDescription} onChange={(event) => onTrChange("seoDescription", event.target.value)} rows={2} placeholder="TR SEO description" className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm" />
        <textarea value={value.en.title} onChange={(event) => onEnChange("title", event.target.value)} rows={2} placeholder="EN title" className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm" />
        <textarea value={value.en.excerpt} onChange={(event) => onEnChange("excerpt", event.target.value)} rows={2} placeholder="EN excerpt" className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm" />
        <textarea value={value.en.contentMarkdown} onChange={(event) => onEnChange("contentMarkdown", event.target.value)} rows={4} placeholder="EN markdown" className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm" />
        <input value={value.en.coverImageAlt} onChange={(event) => onEnChange("coverImageAlt", event.target.value)} placeholder="EN cover alt" className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm" />
        <input value={value.en.seoTitle} onChange={(event) => onEnChange("seoTitle", event.target.value)} placeholder="EN SEO title" className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm" />
        <textarea value={value.en.seoDescription} onChange={(event) => onEnChange("seoDescription", event.target.value)} rows={2} placeholder="EN SEO description" className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm" />
        {(message || error) && <p className={`rounded-md px-3 py-2 text-sm ${error ? "border border-destructive/20 bg-destructive/5 text-destructive" : "border border-primary/20 bg-primary/10 text-primary"}`}>{error || message}</p>}
        <div className="grid grid-cols-2 gap-2">
          <button type="button" onClick={onSave} disabled={saving} className="rounded-md border border-border px-4 py-2 text-sm hover:bg-muted disabled:opacity-70">{saving ? "Saving..." : "Save"}</button>
          <button type="button" onClick={onPublish} disabled={saving} className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground disabled:opacity-70">Publish</button>
        </div>
      </div>
    </div>
  );
}

function JournalCategoryEditor({
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
  categories: JournalCategoryListItem[];
  selectedCategoryId: string | null;
  value: JournalCategoryEditorValue;
  loading: boolean;
  saving: boolean;
  message: string | null;
  error: string | null;
  onNew: () => void;
  onSelect: (categoryId: string) => void;
  onChange: <K extends keyof JournalCategoryEditorValue>(key: K, value: JournalCategoryEditorValue[K]) => void;
  onSave: () => void;
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <h4 className="text-base font-medium">Categories</h4>
        <button type="button" onClick={onNew} className="rounded-md border border-border px-3 py-1.5 text-xs hover:bg-muted">New</button>
      </div>
      <div className="space-y-2">
        {categories.map((category) => (
          <button key={category.id} type="button" onClick={() => onSelect(category.id)} className={`w-full rounded-md border px-3 py-2 text-left text-sm ${selectedCategoryId === category.id ? "border-primary bg-primary/5" : "border-border hover:bg-muted"}`}>
            <p className="font-medium">{category.trName || category.enName || category.slug}</p>
            <p className="text-xs text-muted-foreground">/{category.slug}</p>
          </button>
        ))}
      </div>
      <div className="mt-3 space-y-2 rounded-md border border-border p-3">
        {loading ? (
          <AdminStateCard title="Loading category" message="Preparing category fields..." />
        ) : (
          <>
            <input value={value.slug} onChange={(event) => onChange("slug", event.target.value)} placeholder="slug" className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm" />
            <input value={value.sortOrder} onChange={(event) => onChange("sortOrder", event.target.value)} placeholder="sort order" className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm" />
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={value.isActive} onChange={(event) => onChange("isActive", event.target.checked)} />Active</label>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={value.isFeatured} onChange={(event) => onChange("isFeatured", event.target.checked)} />Featured</label>
            <input value={value.trName} onChange={(event) => onChange("trName", event.target.value)} placeholder="TR name" className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm" />
            <textarea value={value.trDescription} onChange={(event) => onChange("trDescription", event.target.value)} rows={2} placeholder="TR description" className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm" />
            <input value={value.enName} onChange={(event) => onChange("enName", event.target.value)} placeholder="EN name" className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm" />
            <textarea value={value.enDescription} onChange={(event) => onChange("enDescription", event.target.value)} rows={2} placeholder="EN description" className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm" />
            {(message || error) && <p className={`rounded-md px-3 py-2 text-sm ${error ? "border border-destructive/20 bg-destructive/5 text-destructive" : "border border-primary/20 bg-primary/10 text-primary"}`}>{error || message}</p>}
            <button type="button" onClick={onSave} disabled={saving} className="w-full rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground disabled:opacity-70">{saving ? "Saving..." : "Save category"}</button>
          </>
        )}
      </div>
    </div>
  );
}
