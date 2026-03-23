import type { ReactNode } from "react";
import { useAdminAuth } from "../context/AdminAuthContext";
import type { AdminCapability } from "../lib/permissions";
import { hasCapability } from "../lib/permissions";
import { AdminStateCard } from "./AdminStateCard";

const CAPABILITY_LABEL: Record<AdminCapability, string> = {
  manage_content: "content management",
  manage_operations: "operations workflows",
  manage_settings: "site settings",
  manage_media: "media library",
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
      title="Permission required"
      message={`Your role does not currently allow ${CAPABILITY_LABEL[capability]}. Contact an owner if this access should be enabled.`}
      tone="error"
    />
  );
}
