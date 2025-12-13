/**
 * PermissionGate Component
 * Conditionally renders children based on user permissions
 */

import type React from "react"
import type { Role } from "../types"
import { type Permission, hasPermission, hasAnyPermission, hasPermissions } from "../lib/rbac"

interface PermissionGateProps {
  children: React.ReactNode
  role: Role | undefined
  permission?: Permission
  permissions?: Permission[]
  requireAll?: boolean // If true, requires all permissions; if false, requires any
  fallback?: React.ReactNode
}

export const PermissionGate: React.FC<PermissionGateProps> = ({
  children,
  role,
  permission,
  permissions,
  requireAll = true,
  fallback = null,
}) => {
  if (!role) return <>{fallback}</>

  // Single permission check
  if (permission) {
    return hasPermission(role, permission) ? <>{children}</> : <>{fallback}</>
  }

  // Multiple permissions check
  if (permissions && permissions.length > 0) {
    const hasAccess = requireAll ? hasPermissions(role, permissions) : hasAnyPermission(role, permissions)

    return hasAccess ? <>{children}</> : <>{fallback}</>
  }

  // No permissions specified, render children
  return <>{children}</>
}

/**
 * RoleGate Component
 * Conditionally renders children based on user role
 */
interface RoleGateProps {
  children: React.ReactNode
  role: Role | undefined
  allowedRoles: Role[]
  fallback?: React.ReactNode
}

export const RoleGate: React.FC<RoleGateProps> = ({ children, role, allowedRoles, fallback = null }) => {
  if (!role || !allowedRoles.includes(role)) {
    return <>{fallback}</>
  }
  return <>{children}</>
}

/**
 * AdminGate Component
 * Only renders children for Admin or SuperAdmin roles
 */
interface AdminGateProps {
  children: React.ReactNode
  role: Role | undefined
  superAdminOnly?: boolean
  fallback?: React.ReactNode
}

export const AdminGate: React.FC<AdminGateProps> = ({ children, role, superAdminOnly = false, fallback = null }) => {
  if (!role) return <>{fallback}</>

  if (superAdminOnly) {
    return role === "SuperAdmin" ? <>{children}</> : <>{fallback}</>
  }

  return role === "Admin" || role === "SuperAdmin" ? <>{children}</> : <>{fallback}</>
}

export default PermissionGate
