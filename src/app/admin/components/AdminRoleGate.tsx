import type { ReactNode } from "react";
import { useAdminAuth } from "../context/AdminAuthContext";
import type { AdminCapability } from "../lib/permissions";
import { hasCapability } from "../lib/permissions";
import { AdminStateCard } from "./AdminStateCard";

const CAPABILITY_LABEL: Record<AdminCapability, string> = {
  manage_content: "icerik yonetimi",
  manage_operations: "operasyon akisleri",
  manage_settings: "site ayarlari",
  manage_media: "medya kutuphanesi",
};

export function AdminRoleGate({
  capability,
  children,
}: {
  capability: AdminCapability;
  children: ReactNode;
}) {
  const { profile } = useAdminAuth();
  const allowed = hasCapability(profile?.role, capability);

  if (allowed) {
    return <>{children}</>;
  }

  return (
    <AdminStateCard
      title="Yetki gerekli"
      message={`Rolunuz su an ${CAPABILITY_LABEL[capability]} erisimine izin vermiyor. Bu erisim acilacaksa owner rolundeki kullanici ile iletisime gecin.`}
      tone="error"
    />
  );
}
