import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import { getSupabaseBrowserClient } from "../../../lib/supabase/browser-client";
import type { AdminProfile } from "../types";

interface AdminAuthContextValue {
  session: Session | null;
  user: User | null;
  profile: AdminProfile | null;
  isLoading: boolean;
  error: string | null;
  isAdmin: boolean;
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AdminAuthContext = createContext<AdminAuthContextValue | null>(null);

const ADMIN_ROLES = new Set(["owner", "editor", "author", "operations"]);

function mapProfile(row: Record<string, unknown>): AdminProfile | null {
  const roleValue = typeof row.role === "string" ? row.role : null;
  if (!roleValue || !ADMIN_ROLES.has(roleValue)) {
    return null;
  }

  return {
    id: String(row.id),
    email: String(row.email ?? ""),
    fullName: typeof row.full_name === "string" ? row.full_name : null,
    role: roleValue,
    avatarUrl: typeof row.avatar_url === "string" ? row.avatar_url : null,
    isActive: Boolean(row.is_active),
    createdAt: String(row.created_at ?? ""),
    updatedAt: String(row.updated_at ?? ""),
  };
}

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<AdminProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadProfile = useCallback(
    async (userId: string | null) => {
      setError(null);
      if (!userId) {
        setProfile(null);
        return;
      }

      const { data, error: queryError } = await supabase
        .from("admin_profiles")
        .select(
          "id, email, full_name, role, avatar_url, is_active, created_at, updated_at",
        )
        .eq("id", userId)
        .maybeSingle();

      if (queryError) {
        setProfile(null);
        setError(queryError.message);
        return;
      }

      const mapped = data ? mapProfile(data as Record<string, unknown>) : null;
      if (!mapped || !mapped.isActive) {
        setProfile(null);
        return;
      }

      setProfile(mapped);
    },
    [supabase],
  );

  const refreshProfile = useCallback(async () => {
    await loadProfile(session?.user?.id ?? null);
  }, [loadProfile, session?.user?.id]);

  useEffect(() => {
    let mounted = true;

    async function bootstrap() {
      setIsLoading(true);
      setError(null);

      const {
        data: { session: initialSession },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (!mounted) {
        return;
      }

      if (sessionError) {
        setError(sessionError.message);
        setSession(null);
        setProfile(null);
        setIsLoading(false);
        return;
      }

      setSession(initialSession);
      await loadProfile(initialSession?.user?.id ?? null);
      if (mounted) {
        setIsLoading(false);
      }
    }

    void bootstrap();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_, nextSession) => {
      setSession(nextSession);
      setError(null);
      void loadProfile(nextSession?.user?.id ?? null);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [loadProfile, supabase]);

  const signOut = useCallback(async () => {
    const { error: signOutError } = await supabase.auth.signOut();
    if (signOutError) {
      setError(signOutError.message);
      return;
    }

    setSession(null);
    setProfile(null);
  }, [supabase]);

  const value = useMemo<AdminAuthContextValue>(
    () => ({
      session,
      user: session?.user ?? null,
      profile,
      isLoading,
      error,
      isAdmin: Boolean(session?.user && profile?.isActive),
      refreshProfile,
      signOut,
    }),
    [session, profile, isLoading, error, refreshProfile, signOut],
  );

  return (
    <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error("useAdminAuth must be used within AdminAuthProvider.");
  }
  return context;
}
