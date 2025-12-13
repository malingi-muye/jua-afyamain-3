// Permission definitions
export type Permission =
  // Dashboard
  | "dashboard:view"
  | "dashboard:export"
  // Patients
  | "patients:view"
  | "patients:create"
  | "patients:edit"
  | "patients:delete"
  | "patients:export"
  // Appointments
  | "appointments:view"
  | "appointments:create"
  | "appointments:edit"
  | "appointments:cancel"
  // Visits/Queue
  | "visits:view"
  | "visits:checkin"
  | "visits:vitals"
  | "visits:consult"
  | "visits:lab"
  | "visits:billing"
  | "visits:dispense"
  // Inventory
  | "inventory:view"
  | "inventory:create"
  | "inventory:edit"
  | "inventory:delete"
  | "inventory:adjust"
  // Reports
  | "reports:view"
  | "reports:export"
  | "reports:financial"
  // Settings
  | "settings:view"
  | "settings:edit"
  | "settings:team"
  | "settings:billing"
  // SMS
  | "sms:send"
  | "sms:bulk"
  // Audit
  | "audit:view"
  // Admin (Platform)
  | "admin:organizations"
  | "admin:users"
  | "admin:system"
  | "admin:billing"

// Role to permissions mapping
const rolePermissions: Record<string, Permission[]> = {
  super_admin: [
    "dashboard:view",
    "dashboard:export",
    "patients:view",
    "patients:create",
    "patients:edit",
    "patients:delete",
    "patients:export",
    "appointments:view",
    "appointments:create",
    "appointments:edit",
    "appointments:cancel",
    "visits:view",
    "visits:checkin",
    "visits:vitals",
    "visits:consult",
    "visits:lab",
    "visits:billing",
    "visits:dispense",
    "inventory:view",
    "inventory:create",
    "inventory:edit",
    "inventory:delete",
    "inventory:adjust",
    "reports:view",
    "reports:export",
    "reports:financial",
    "settings:view",
    "settings:edit",
    "settings:team",
    "settings:billing",
    "sms:send",
    "sms:bulk",
    "audit:view",
    "admin:organizations",
    "admin:users",
    "admin:system",
    "admin:billing",
  ],
  admin: [
    "dashboard:view",
    "dashboard:export",
    "patients:view",
    "patients:create",
    "patients:edit",
    "patients:delete",
    "patients:export",
    "appointments:view",
    "appointments:create",
    "appointments:edit",
    "appointments:cancel",
    "visits:view",
    "visits:checkin",
    "visits:vitals",
    "visits:consult",
    "visits:lab",
    "visits:billing",
    "visits:dispense",
    "inventory:view",
    "inventory:create",
    "inventory:edit",
    "inventory:delete",
    "inventory:adjust",
    "reports:view",
    "reports:export",
    "reports:financial",
    "settings:view",
    "settings:edit",
    "settings:team",
    "settings:billing",
    "sms:send",
    "sms:bulk",
    "audit:view",
  ],
  doctor: [
    "dashboard:view",
    "patients:view",
    "patients:create",
    "patients:edit",
    "appointments:view",
    "appointments:create",
    "appointments:edit",
    "visits:view",
    "visits:consult",
    "visits:lab",
    "inventory:view",
    "reports:view",
  ],
  nurse: [
    "dashboard:view",
    "patients:view",
    "patients:create",
    "patients:edit",
    "appointments:view",
    "visits:view",
    "visits:vitals",
    "inventory:view",
  ],
  receptionist: [
    "dashboard:view",
    "patients:view",
    "patients:create",
    "patients:edit",
    "appointments:view",
    "appointments:create",
    "appointments:edit",
    "appointments:cancel",
    "visits:view",
    "visits:checkin",
    "sms:send",
  ],
  lab_tech: ["dashboard:view", "patients:view", "visits:view", "visits:lab"],
  pharmacist: [
    "dashboard:view",
    "patients:view",
    "visits:view",
    "visits:dispense",
    "inventory:view",
    "inventory:create",
    "inventory:edit",
    "inventory:adjust",
  ],
  accountant: [
    "dashboard:view",
    "dashboard:export",
    "visits:view",
    "visits:billing",
    "reports:view",
    "reports:export",
    "reports:financial",
    "settings:view",
    "settings:billing",
  ],
}

// View access map (which roles can access which views)
export const viewAccessMap: Record<string, string[]> = {
  // Super Admin Views
  "sa-overview": ["super_admin"],
  "sa-clinics": ["super_admin"],
  "sa-approvals": ["super_admin"],
  "sa-payments": ["super_admin"],
  "sa-support": ["super_admin"],
  "sa-settings": ["super_admin"],

  // Clinic Views
  dashboard: ["admin", "doctor", "nurse", "receptionist", "pharmacist", "lab_tech", "accountant"],
  reception: ["admin", "receptionist"],
  triage: ["admin", "nurse", "doctor"],
  consultation: ["admin", "doctor"],
  "lab-work": ["admin", "lab_tech", "doctor"],
  "billing-desk": ["admin", "receptionist", "accountant"],
  pharmacy: ["admin", "pharmacist", "doctor"],
  patients: ["admin", "doctor", "nurse", "receptionist"],
  appointments: ["admin", "doctor", "nurse", "receptionist"],
  "whatsapp-agent": ["admin", "doctor", "nurse", "receptionist", "pharmacist"],
  "bulk-sms": ["admin", "receptionist"],
  reports: ["admin", "doctor", "accountant"],
  settings: ["admin"],
  profile: ["admin", "doctor", "nurse", "receptionist", "pharmacist", "lab_tech", "accountant", "super_admin"],
  "audit-logs": ["admin", "super_admin"],
}

/**
 * Check if a role has a specific permission
 */
export function hasPermission(role: string | undefined, permission: Permission): boolean {
  if (!role) return false
  const normalizedRole = role.toLowerCase().replace(/\s+/g, "_")
  return rolePermissions[normalizedRole]?.includes(permission) ?? false
}

/**
 * Check if a role has all specified permissions
 */
export function hasAllPermissions(role: string | undefined, permissions: Permission[]): boolean {
  return permissions.every((p) => hasPermission(role, p))
}

/**
 * Check if a role has any of the specified permissions
 */
export function hasAnyPermission(role: string | undefined, permissions: Permission[]): boolean {
  return permissions.some((p) => hasPermission(role, p))
}

/**
 * Get all permissions for a role
 */
export function getRolePermissions(role: string | undefined): Permission[] {
  if (!role) return []
  const normalizedRole = role.toLowerCase().replace(/\s+/g, "_")
  return rolePermissions[normalizedRole] ?? []
}

/**
 * Check if a role can access a specific view
 */
export function canAccessView(role: string | undefined, view: string): boolean {
  if (!role) return false
  const normalizedRole = role.toLowerCase().replace(/\s+/g, "_")
  const allowedRoles = viewAccessMap[view]
  if (!allowedRoles) return false
  return allowedRoles.includes(normalizedRole)
}

/**
 * Get default view for a role
 */
export function getDefaultViewForRole(role: string | undefined): string {
  if (!role) return "dashboard"
  const normalizedRole = role.toLowerCase().replace(/\s+/g, "_")

  switch (normalizedRole) {
    case "super_admin":
      return "sa-overview"
    case "doctor":
      return "consultation"
    case "nurse":
      return "triage"
    case "receptionist":
      return "reception"
    case "pharmacist":
      return "pharmacy"
    case "lab_tech":
      return "lab-work"
    case "accountant":
      return "billing-desk"
    case "admin":
    default:
      return "dashboard"
  }
}

/**
 * Check if user is admin level
 */
export function isAdmin(role: string | undefined): boolean {
  if (!role) return false
  const normalizedRole = role.toLowerCase().replace(/\s+/g, "_")
  return normalizedRole === "admin" || normalizedRole === "super_admin"
}

/**
 * Check if user is super admin
 */
export function isSuperAdmin(role: string | undefined): boolean {
  if (!role) return false
  return role.toLowerCase().replace(/\s+/g, "_") === "super_admin"
}

/**
 * Get roles that have a specific permission
 */
export function getRolesWithPermission(permission: Permission): string[] {
  return Object.entries(rolePermissions)
    .filter(([, perms]) => perms.includes(permission))
    .map(([role]) => role)
}
