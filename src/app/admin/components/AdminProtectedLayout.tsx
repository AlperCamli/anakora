import { Navigate, useLocation } from "react-router";
import { AdminShell } from "./AdminShell";
import { AdminStateCard } from "./AdminStateCard";
import { useAdminAuth } from "../context/AdminAuthContext";

export function AdminProtectedLayout() {
  const { isLoading, user, isAdmin, error, signOut } = useAdminAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="mx-auto flex min-h-screen w-full max-w-[820px] items-center px-4">
        <AdminStateCard
          title="Admin oturumu yukleniyor"
          message="Hesap erisimi ve rol izinleri kontrol ediliyor..."
        />
      </div>
    );
  }

  if (!user) {
    const next = `${location.pathname}${location.search}${location.hash}`;
    return <Navigate to={`/admin/login?next=${encodeURIComponent(next)}`} replace />;
  }

  if (!isAdmin) {
    return (
      <div className="mx-auto flex min-h-screen w-full max-w-[820px] items-center px-4">
        <div className="w-full space-y-4">
          <AdminStateCard
            title="Erisim yetkisi yok"
            message="Bu hesap giris yapti ancak admin_profiles tablosunda aktif admin profili bulunmuyor."
            tone="error"
          />
          {error && (
            <p className="text-sm text-destructive">Kimlik dogrulama hatasi: {error}</p>
          )}
          <button
            type="button"
            onClick={() => void signOut()}
            className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground"
          >
            Cikis yap
          </button>
        </div>
      </div>
    );
  }

  return <AdminShell />;
}
