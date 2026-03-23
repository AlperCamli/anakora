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

interface AdminNavItem {
  label: string;
  path: string;
  icon: typeof LayoutDashboard;
}

const PRIMARY_NAV: AdminNavItem[] = [
  { label: "Dashboard", path: "/admin", icon: LayoutDashboard },
  { label: "Programs", path: "/admin/programs", icon: BookOpen },
  { label: "Guides", path: "/admin/guides", icon: Users },
  { label: "Leads", path: "/admin/leads", icon: MessageCircle },
];

const SECONDARY_NAV: AdminNavItem[] = [
  { label: "Testimonials", path: "/admin/testimonials", icon: FileText },
  { label: "Journal", path: "/admin/journal", icon: BookOpen },
  { label: "Homepage", path: "/admin/homepage", icon: Home },
  { label: "Site Settings", path: "/admin/site-settings", icon: Settings },
  { label: "Media", path: "/admin/media", icon: Image },
];

function resolveTitle(pathname: string): string {
  if (pathname === "/admin") {
    return "Dashboard";
  }
  if (pathname.startsWith("/admin/programs")) {
    return "Programs";
  }
  if (pathname.startsWith("/admin/guides")) {
    return "Guides";
  }
  if (pathname.startsWith("/admin/leads")) {
    return "Leads";
  }
  if (pathname.startsWith("/admin/testimonials")) {
    return "Testimonials";
  }
  if (pathname.startsWith("/admin/journal")) {
    return "Journal";
  }
  if (pathname.startsWith("/admin/homepage")) {
    return "Homepage";
  }
  if (pathname.startsWith("/admin/site-settings")) {
    return "Site Settings";
  }
  if (pathname.startsWith("/admin/media")) {
    return "Media";
  }
  return "Admin";
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

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex min-h-screen w-full max-w-[1600px] flex-col lg:flex-row">
        <aside className="w-full border-b border-border bg-card px-4 py-4 lg:w-72 lg:border-b-0 lg:border-r lg:px-5 lg:py-6">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                ANAKORA
              </p>
              <h1 className="text-xl font-semibold">Admin</h1>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 lg:grid-cols-1">
            <NavSection title="Editorial" items={PRIMARY_NAV} />
            <NavSection title="Operations" items={SECONDARY_NAV} />
          </div>
        </aside>

        <div className="flex min-h-screen flex-1 flex-col">
          <header className="sticky top-0 z-30 border-b border-border bg-background/95 px-4 py-4 backdrop-blur-md sm:px-6 lg:px-8">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">
                  Internal Dashboard
                </p>
                <h2 className="text-2xl font-medium">{resolveTitle(location.pathname)}</h2>
              </div>

              <div className="flex items-center gap-3">
                <div className="hidden text-right sm:block">
                  <p className="text-sm font-medium">{profile?.fullName ?? profile?.email}</p>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    {profile?.role ?? "admin"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => void signOut()}
                  className="rounded-md border border-border px-3 py-2 text-sm text-foreground/80 transition-colors hover:bg-muted hover:text-foreground"
                >
                  Sign out
                </button>
              </div>
            </div>
          </header>

          <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
