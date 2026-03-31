import { useEffect, useMemo, useState } from "react";
import { Navigate, useSearchParams } from "react-router";
import { getSupabaseBrowserClient } from "../../../lib/supabase/browser-client";
import { AdminStateCard } from "../components/AdminStateCard";
import { useAdminAuth } from "../context/AdminAuthContext";

export function AdminLoginPage() {
  const [searchParams] = useSearchParams();
  const { isLoading, isAdmin, user, error, refreshProfile, signOut } = useAdminAuth();
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const nextPath = searchParams.get("next") || "/admin";

  useEffect(() => {
    if (user && !isAdmin) {
      void refreshProfile();
    }
  }, [isAdmin, refreshProfile, user]);

  if (isAdmin) {
    return <Navigate to={nextPath} replace />;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    setSubmitting(true);

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    setSubmitting(false);

    if (signInError) {
      setFormError(signInError.message);
      return;
    }

    await refreshProfile();
  }

  return (
    <div className="min-h-screen bg-muted/20 px-4 py-12">
      <div className="mx-auto max-w-md rounded-xl border border-border bg-card p-6 shadow-sm sm:p-8">
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
          ANAKORA Yonetim
        </p>
        <h1 className="mt-2 text-3xl font-semibold">Giris yap</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Icerik ve operasyon araclarina erismek icin admin hesabi ile devam edin.
        </p>

        {isLoading ? (
          <div className="mt-6">
            <AdminStateCard
              title="Oturum kontrol ediliyor"
              message="Admin calisma alani hazirlaniyor..."
            />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <label className="block space-y-1">
              <span className="text-sm text-foreground/80">E-posta</span>
              <input
                type="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="w-full rounded-md border border-border bg-background px-3 py-2.5 text-sm focus:border-ring focus:outline-none"
                placeholder="admin@anakora.com"
              />
            </label>

            <label className="block space-y-1">
              <span className="text-sm text-foreground/80">Sifre</span>
              <input
                type="password"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full rounded-md border border-border bg-background px-3 py-2.5 text-sm focus:border-ring focus:outline-none"
              />
            </label>

            {(formError || error) && (
              <p className="rounded-md border border-destructive/20 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                {formError || error}
              </p>
            )}

            {user && !isAdmin && !isLoading && (
              <div className="rounded-md border border-destructive/20 bg-destructive/5 px-3 py-3 text-sm text-destructive">
                <p>
                  Bu kullanici giris yapti ancak admin_profiles tablosunda aktif admin
                  olarak atanmis degil.
                </p>
                <button
                  type="button"
                  onClick={() => void signOut()}
                  className="mt-3 rounded-md border border-destructive/30 px-3 py-1.5 text-xs uppercase tracking-wide"
                >
                  Cikis yap
                </button>
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-md bg-primary px-4 py-2.5 text-sm text-primary-foreground transition-opacity disabled:opacity-70"
            >
              {submitting ? "Giris yapiliyor..." : "Giris yap"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
