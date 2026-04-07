import { NavLink, Outlet, useLocation } from "react-router";
import {
  BookOpen,
  FileText,
  Home,
  Image,
  LayoutDashboard,
  MessageCircle,
  Settings,
  Users,
} from "lucide-react";
import { useAdminAuth } from "../context/AdminAuthContext";
import { AdminStateCard } from "./AdminStateCard";
import { canAccessAdminPath, requiredCapabilityForPath } from "../lib/permissions";
import { RouteScrollReset } from "../../components/RouteScrollReset";

interface AdminNavItem {
  label: string;
  path: string;
  icon: typeof LayoutDashboard;
}

const PRIMARY_NAV: AdminNavItem[] = [
  { label: "Panel", path: "/admin", icon: LayoutDashboard },
  { label: "Programlar", path: "/admin/programs", icon: BookOpen },
  { label: "Rehberler", path: "/admin/guides", icon: Users },
  { label: "Leadler", path: "/admin/leads", icon: MessageCircle },
];

const SECONDARY_NAV: AdminNavItem[] = [
  { label: "Yorumlar", path: "/admin/testimonials", icon: FileText },
  { label: "Jurnal", path: "/admin/journal", icon: BookOpen },
  { label: "Anasayfa", path: "/admin/homepage", icon: Home },
  { label: "Site Ayarlari", path: "/admin/site-settings", icon: Settings },
  { label: "Medya", path: "/admin/media", icon: Image },
];

function resolveTitle(pathname: string): string {
  if (pathname === "/admin") {
    return "Panel";
  }
  if (pathname.startsWith("/admin/programs")) {
    return "Programlar";
  }
  if (pathname.startsWith("/admin/guides")) {
    return "Rehberler";
  }
  if (pathname.startsWith("/admin/leads")) {
    return "Leadler";
  }
  if (pathname.startsWith("/admin/testimonials")) {
    return "Yorumlar";
  }
  if (pathname.startsWith("/admin/journal")) {
    return "Jurnal";
  }
  if (pathname.startsWith("/admin/homepage")) {
    return "Anasayfa";
  }
  if (pathname.startsWith("/admin/site-settings")) {
    return "Site Ayarlari";
  }
  if (pathname.startsWith("/admin/media")) {
    return "Medya";
  }
  return "Yonetim";
}

function NavSection({
  title,
  items,
}: {
  title: string;
  items: AdminNavItem[];
}) {
  return (
    <div className="space-y-2">
      <p className="px-2 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
        {title}
      </p>
      <div className="space-y-1">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === "/admin"}
              className={({ isActive }) =>
                `group flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors ${
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-foreground/80 hover:bg-muted hover:text-foreground"
                }`
              }
            >
              <Icon size={16} className="shrink-0" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </div>
    </div>
  );
}

export function AdminShell() {
  const { profile, signOut } = useAdminAuth();
  const location = useLocation();
  const role = profile?.role;

  const visiblePrimaryNav = PRIMARY_NAV.filter((item) =>
    canAccessAdminPath(role, item.path),
  );
  const visibleSecondaryNav = SECONDARY_NAV.filter((item) =>
    canAccessAdminPath(role, item.path),
  );
  const canAccessPath = canAccessAdminPath(role, location.pathname);
  const requiredCapability = requiredCapabilityForPath(location.pathname);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <RouteScrollReset />
      <div className="mx-auto flex min-h-screen w-full max-w-[1600px] flex-col lg:flex-row">
        <aside className="w-full border-b border-border bg-card px-4 py-4 lg:w-72 lg:border-b-0 lg:border-r lg:px-5 lg:py-6">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                ANAKORA
              </p>
              <h1 className="text-xl font-semibold">Yonetim</h1>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 lg:grid-cols-1">
            <NavSection title="Icerik" items={visiblePrimaryNav} />
            <NavSection title="Operasyon" items={visibleSecondaryNav} />
          </div>
        </aside>

        <div className="flex min-h-screen flex-1 flex-col">
          <header className="sticky top-0 z-30 border-b border-border bg-background/95 px-4 py-4 backdrop-blur-md sm:px-6 lg:px-8">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">
                  Ic Yonetim
                </p>
                <h2 className="text-2xl font-medium">{resolveTitle(location.pathname)}</h2>
              </div>

              <div className="flex items-center gap-3">
                <div className="hidden text-right sm:block">
                  <p className="text-sm font-medium">{profile?.fullName ?? profile?.email}</p>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    {profile?.role ?? "yonetici"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => void signOut()}
                  className="rounded-md border border-border px-3 py-2 text-sm text-foreground/80 transition-colors hover:bg-muted hover:text-foreground"
                >
                  Cikis yap
                </button>
              </div>
            </div>
          </header>

          <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
            {canAccessPath ? (
              <Outlet />
            ) : (
              <AdminStateCard
                title="Erisim kisitli"
                message={`Rolunuz (${role ?? "bilinmiyor"}) bu modul icin yetkili degil${requiredCapability ? ` (${requiredCapability})` : ""}.`}
                tone="error"
              />
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
