"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import { supabase } from "@/lib/supabaseClient"
import { AuthChangeEvent, Session } from "@supabase/supabase-js"
import type { User, Organization, UserRole } from "@/types/enterprise"
import type { TeamMember, Role } from "@/types"
import { NEW_ROLE_MAP, LEGACY_ROLE_MAP } from "@/types/enterprise"
import { sessionManager } from "@/lib/sessionManager"
import logger from "@/lib/logger"
import { initAuthManager, subscribeAuth } from "@/lib/authManager"

interface UseEnterpriseAuthReturn {
  user: User | null
  organization: Organization | null
  teamMember: TeamMember | null
  isLoading: boolean
  isAuthenticated: boolean
  isSuperAdmin: boolean
  isOrgAdmin: boolean
  error: string | null
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  signUp: (email: string, password: string, metadata?: Record<string, any>) => Promise<{ success: boolean; error?: string }>
  signOut: () => Promise<void>
  refresh: () => Promise<void>
  waitForUserSync: () => Promise<void>
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string }>
}

// Global cache to prevent flash of unauthenticated state across navigation
let cachedUser: User | null = null
let cachedOrg: Organization | null = null

export function useEnterpriseAuth(): UseEnterpriseAuthReturn {
  const [user, setUser] = useState<User | null>(cachedUser)
  const [organization, setOrganization] = useState<Organization | null>(cachedOrg)
  const [isLoading, setIsLoading] = useState(!cachedUser)
  const [error, setError] = useState<string | null>(null)
  const userSyncRef = useRef<(() => void) | null>(null)

  const fetchUserData = useCallback(async (authUserId: string) => {
    const startTime = Date.now()
    try {
      logger.log('[useEnterpriseAuth] Fetching user profile + clinic...')

      // Efficient joined query: gets user and clinic in ONE network trip
      const { data: profile, error: profileError } = await supabase
        .from("users")
        .select(`
          *,
          clinics (*)
        `)
        .eq("id", authUserId)
        .maybeSingle()

      if (profileError) throw profileError

      if (!profile) {
        logger.error("[useEnterpriseAuth] User profile not found in database")
        setError("User profile not found in database.")
        setUser(null)
        setIsLoading(false)
        return
      }

      // Normalize role
      const dbRole = profile.role as string
      let normalizedRole: UserRole = "admin"
      if (LEGACY_ROLE_MAP[dbRole]) {
        normalizedRole = LEGACY_ROLE_MAP[dbRole]
      } else if (Object.keys(NEW_ROLE_MAP).includes(dbRole)) {
        normalizedRole = dbRole as UserRole
      }

      const mappedUser: User = {
        id: profile.id,
        clinicId: profile.clinic_id || null,
        email: profile.email || "",
        fullName: profile.full_name || "User",
        phone: profile.phone || null,
        avatarUrl: profile.avatar_url || null,
        role: normalizedRole,
        department: profile.department || null,
        licenseNumber: profile.license_number || null,
        specialization: profile.specialization || null,
        status: profile.status || "active",
        lastLoginAt: profile.last_login_at || null,
        lastActiveAt: profile.last_active_at || null,
        preferences: profile.preferences || {},
        createdAt: profile.created_at || new Date().toISOString(),
        updatedAt: profile.updated_at || new Date().toISOString(),
      }

      let mappedOrg: Organization | null = null
      if (profile.clinics) {
        const clinic = profile.clinics
        mappedOrg = {
          id: clinic.id,
          name: clinic.name,
          slug: clinic.slug || clinic.name.toLowerCase().replace(/\s+/g, '-'),
          ownerId: clinic.owner_id || null,
          logoUrl: clinic.logo_url || null,
          email: clinic.email || null,
          phone: clinic.phone || null,
          address: clinic.location || null,
          country: clinic.country || null,
          currency: clinic.currency || 'KES',
          timezone: clinic.timezone || 'Africa/Nairobi',
          plan: clinic.plan || 'free',
          planSeats: clinic.plan_seats || 1,
          status: clinic.status || 'active',
          trialEndsAt: clinic.trial_ends_at || null,
          settings: clinic.settings || {},
          metadata: clinic.metadata || {},
          createdAt: clinic.created_at,
          updatedAt: clinic.updated_at,
        }
      }

      // Update state and global cache
      cachedUser = mappedUser
      cachedOrg = mappedOrg
      setUser(mappedUser)
      setOrganization(mappedOrg)
      sessionManager.setSession(profile.id, profile.email)

      logger.log(`[useEnterpriseAuth] Profile loaded in ${Date.now() - startTime}ms`)

      // Update last active in background (throttled to once per 5 mins)
      const now = new Date()
      const lastActive = mappedUser.lastActiveAt ? new Date(mappedUser.lastActiveAt) : new Date(0)
      if (now.getTime() - lastActive.getTime() > 5 * 60 * 1000) {
        supabase.from("users").update({ last_active_at: now.toISOString() }).eq("id", authUserId).then(() => { })
      }

    } catch (err: any) {
      logger.error("[useEnterpriseAuth] Error fetching user data:", err.message)
      setError(err.message || "Failed to load user data")
    } finally {
      setIsLoading(false)
      if (userSyncRef.current) {
        userSyncRef.current()
        userSyncRef.current = null
      }
    }
  }, [])

  const refresh = useCallback(async () => {
    setIsLoading(true)
    const { data: { session } } = await supabase.auth.getSession()
    if (session?.user) {
      await fetchUserData(session.user.id)
    } else {
      setUser(null)
      setOrganization(null)
      setIsLoading(false)
    }
  }, [fetchUserData])

  useEffect(() => {
    // Only initialize once per session
    initAuthManager().catch(e => logger.warn('[useEnterpriseAuth] initAuthManager error:', e))

    const unsubscribe = subscribeAuth(async (event: AuthChangeEvent, session: Session | null) => {
      logger.log('[useEnterpriseAuth] Auth Event:', event)

      if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED" || event === "INITIAL_SESSION") {
        if (session?.user) {
          await fetchUserData(session.user.id)
        } else if (event === "INITIAL_SESSION") {
          setIsLoading(false)
        }
      } else if (event === "SIGNED_OUT") {
        cachedUser = null
        cachedOrg = null
        setUser(null)
        setOrganization(null)
        setIsLoading(false)
        sessionManager.clearSession()
      }
    })

    // Run initial catch-up if needed
    if (!cachedUser) {
      refresh()
    }

    return () => unsubscribe()
  }, [fetchUserData, refresh])

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    })
    if (error) return { success: false, error: error.message }
    return { success: true }
  }

  const signUp = async (email: string, password: string, metadata?: Record<string, any>) => {
    const { error } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: { data: metadata }
    })
    if (error) return { success: false, error: error.message }
    return { success: true }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    cachedUser = null
    cachedOrg = null
    setUser(null)
    setOrganization(null)
    sessionManager.clearSession()
  }

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase())
    if (error) return { success: false, error: error.message }
    return { success: true }
  }

  const teamMember: TeamMember | null = user ? {
    id: user.id,
    clinicId: user.clinicId || undefined,
    name: user.fullName,
    email: user.email,
    phone: user.phone || undefined,
    role: NEW_ROLE_MAP[user.role] as Role,
    status: user.status === "active" ? "Active" : user.status === "invited" ? "Invited" : "Deactivated",
    lastActive: user.lastActiveAt || "Unknown",
    avatar: user.avatarUrl || undefined,
    specialization: user.specialization || undefined,
    bio: (user.preferences as any)?.bio || undefined,
    address: (user.preferences as any)?.address || undefined,
    preferences: user.preferences,
  } : null

  const waitForUserSync = useCallback(() => {
    return new Promise<void>((resolve) => {
      if (user && !isLoading) resolve()
      else userSyncRef.current = () => resolve()
    })
  }, [user, isLoading])

  return {
    user, organization, teamMember, isLoading,
    isAuthenticated: !!user,
    isSuperAdmin: user?.role === "super_admin",
    isOrgAdmin: user?.role === "admin" || user?.role === "super_admin",
    error, signIn, signUp, signOut, refresh, waitForUserSync, resetPassword,
  }
}
