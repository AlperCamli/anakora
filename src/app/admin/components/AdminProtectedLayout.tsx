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
          title="Loading admin session"
          message="Verifying account access and role permissions..."
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
            title="Access not granted"
            message="This account is authenticated but does not have an active admin profile in admin_profiles."
            tone="error"
          />
          {error && (
            <p className="text-sm text-destructive">Auth error: {error}</p>
          )}
          <button
            type="button"
            onClick={() => void signOut()}
            className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground"
          >
            Sign out
          </button>
        </div>
      </div>
    );
  }

  return <AdminShell />;
}
