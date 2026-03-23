import type { AdminRole } from "../types";

export type AdminCapability =
  | "manage_content"
  | "manage_operations"
  | "manage_settings"
  | "manage_media";

const ROLE_CAPABILITIES: Record<AdminRole, AdminCapability[]> = {
  owner: ["manage_content", "manage_operations", "manage_settings", "manage_media"],
  editor: ["manage_content", "manage_operations", "manage_settings", "manage_media"],
  author: ["manage_content", "manage_media"],
  operations: ["manage_operations", "manage_settings", "manage_media"],
};

const PATH_CAPABILITIES: Array<{ prefix: string; capability: AdminCapability }> = [
  { prefix: "/admin/programs", capability: "manage_content" },
  { prefix: "/admin/guides", capability: "manage_content" },
  { prefix: "/admin/testimonials", capability: "manage_content" },
  { prefix: "/admin/journal", capability: "manage_content" },
  { prefix: "/admin/homepage", capability: "manage_content" },
  { prefix: "/admin/leads", capability: "manage_operations" },
  { prefix: "/admin/site-settings", capability: "manage_settings" },
  { prefix: "/admin/media", capability: "manage_media" },
];

export function hasCapability(role: AdminRole | null | undefined, capability: AdminCapability) {
  if (!role) {
    return false;
  }

  return ROLE_CAPABILITIES[role]?.includes(capability) ?? false;
}

export function canAccessAdminPath(role: AdminRole | null | undefined, pathname: string) {
  const matched = PATH_CAPABILITIES.find((item) => pathname.startsWith(item.prefix));
  if (!matched) {
    return true;
  }
  return hasCapability(role, matched.capability);
}

export function requiredCapabilityForPath(pathname: string): AdminCapability | null {
  const matched = PATH_CAPABILITIES.find((item) => pathname.startsWith(item.prefix));
  return matched?.capability ?? null;
}
