/**
 * Role mapping utilities
 * Maps UI-facing `Role` strings to enterprise `UserRole` values used by the permission system.
 */
import type { UserRole } from '../types/enterprise'
import type { TeamMember } from '../types'
import { hasPermission } from './permissions'
import useStore from '../store'

export function mapRoleToUserRole(role?: string): UserRole | undefined {
  if (!role) return undefined
  switch (role) {
    case 'SuperAdmin':
      return 'super_admin'
    case 'Admin':
      return 'admin'
    case 'Doctor':
      return 'doctor'
    case 'Nurse':
      return 'nurse'
    case 'Receptionist':
      return 'receptionist'
    case 'Lab Tech':
      return 'lab_tech'
    case 'Pharmacist':
      return 'pharmacist'
    case 'Accountant':
      return 'accountant'
    default:
      return role.toLowerCase() as UserRole
  }
}

export function userRoleFromMember(member?: TeamMember): UserRole | undefined {
  return mapRoleToUserRole(member?.role)
}

/**
 * Helper that uses current store user to check a permission quickly.
 * Returns false if no user or mapping is available.
 */
export function canCurrentUser(permission: string): boolean {
  try {
    const { currentUser } = useStore.getState()
    const userRole = mapRoleToUserRole(currentUser?.role)
    if (!userRole) return false
    return hasPermission(userRole as UserRole, permission as any)
  } catch (e) {
    return false
  }
}

export default mapRoleToUserRole
