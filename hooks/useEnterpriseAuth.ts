"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import { supabase } from "@/lib/supabaseClient"
import { AuthChangeEvent, Session } from "@supabase/supabase-js"
import type { User, Organization, UserRole } from "@/types/enterprise"
import type { TeamMember, Role } from "@/types"
import { NEW_ROLE_MAP, LEGACY_ROLE_MAP } from "@/types/enterprise"
import { sessionManager } from "@/lib/sessionManager"

interface UseEnterpriseAuthReturn {
  user: User | null
  organization: Organization | null
  teamMember: TeamMember | null // For backward compatibility
  isLoading: boolean
  isAuthenticated: boolean
  isSuperAdmin: boolean
  isOrgAdmin: boolean
  error: string | null
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  signUp: (
    email: string,
    password: string,
    metadata?: Record<string, any>,
  ) => Promise<{ success: boolean; error?: string }>
  signOut: () => Promise<void>
  refresh: () => Promise<void>
  waitForUserSync: () => Promise<void>
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string }>
}

// Keep track of user sync promises outside of hook state
const userSyncPromises: Array<{ resolve: () => void }> = []

export function useEnterpriseAuth(): UseEnterpriseAuthReturn {
  const [user, setUser] = useState<User | null>(null)
  const [organization, setOrganization] = useState<Organization | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const userSyncRef = useRef<(() => void) | null>(null)

  const fetchUserData = useCallback(async (authUserId: string) => {
    const startTime = Date.now()
    const FETCH_TIMEOUT = 15000 // 15 second timeout for individual fetches (increased from 8s)

    try {
      console.log('[useEnterpriseAuth] Fetching user data for userId:', authUserId)

      // Get auth user data first with timeout
      const authUserPromise = supabase.auth.getUser()
      const authUserTimeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Auth user fetch timeout after 15s')), FETCH_TIMEOUT)
      )

      const {
        data: { user: authUser },
      } = await Promise.race([authUserPromise, authUserTimeoutPromise]) as any

      console.log('[useEnterpriseAuth] Got auth user:', authUser?.email, `(${Date.now() - startTime}ms)`)

      if (!authUser) {
        console.log('[useEnterpriseAuth] No auth user found')
        setUser(null)
        setIsLoading(false)
        return
      }

      // Try to fetch user profile from database
      try {
        console.log('[useEnterpriseAuth] Fetching profile from database...')

        const profilePromise = supabase
          .from("users")
          .select("id, email, full_name, phone, avatar_url, role, department, license_number, specialization, status, last_login_at, last_active_at, preferences, clinic_id, created_at, updated_at")
          .eq("id", authUserId)
          .maybeSingle()

        const profileTimeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Profile fetch timeout')), FETCH_TIMEOUT)
        )

        const { data: profile, error: profileError } = await Promise.race([profilePromise, profileTimeoutPromise]) as any

        console.log('[useEnterpriseAuth] Profile fetch result:', { found: !!profile, error: profileError, elapsed: Date.now() - startTime })

        if (profileError) {
          console.warn("Profile fetch error (will use auth metadata):", profileError)
          // Continue to fallback instead of throwing
        } else if (profile) {
          // Normalize role from DB (handle PascalCase 'SuperAdmin' -> snake_case 'super_admin')
          const dbRole = profile.role as string;
          let normalizedRole: UserRole = "admin";

          if (LEGACY_ROLE_MAP[dbRole]) {
            normalizedRole = LEGACY_ROLE_MAP[dbRole];
          } else if (Object.keys(NEW_ROLE_MAP).includes(dbRole)) {
            normalizedRole = dbRole as UserRole;
          }

          const mappedUser: User = {
            id: profile.id,
            clinicId: profile.clinic_id || null,
            email: profile.email || "",
            fullName: profile.full_name || profile.email?.split("@")[0] || "User",
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
          console.log('[useEnterpriseAuth] Mapped user role:', { rawRole: profile.role, normalizedRole, mappedRole: mappedUser.role })
          setUser(mappedUser)
          setIsLoading(false)
          // Sync session manager with auth state
          sessionManager.setSession(profile.id, profile.email)

          // Fetch clinic (using clinics table instead of organizations)
          if (profile.clinic_id) {
            const { data: clinic } = await supabase
              .select("*")
              .eq("id", profile.clinic_id)
              .maybeSingle()

            if (clinic) {
              setOrganization({
                id: clinic.id,
                name: clinic.name,
                slug: clinic.slug || clinic.name.toLowerCase().replace(/\s+/g, '-'),
                ownerId: clinic.owner_id || null,
                logoUrl: clinic.logo_url || null,
                email: clinic.email || null,
                phone: clinic.phone || null,
                address: clinic.address || null,
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
              })
            }
          }

          // Update last active
          await supabase.from("users").update({ last_active_at: new Date().toISOString() }).eq("id", authUserId)

          // Resolve auth state promise if waiting
          if (userSyncRef.current) {
            userSyncRef.current()
            userSyncRef.current = null
          }
          return
        }

        // User profile not found - Error state instead of fallback
        console.error("User profile not found in database for ID:", authUser.id)
        setError("User profile not found in database. Please contact support.")
        setUser(null)
        setIsLoading(false)

        // Resolve auth state promise if waiting
        if (userSyncRef.current) {
          userSyncRef.current()
          userSyncRef.current = null
        }
        return
      } catch (dbError: any) {
        console.warn("Database profile fetch error, using auth metadata fallback:", dbError)

        // Database error - Error state instead of fallback
        console.error("Database error while fetching profile:", dbError)
        setError("Error loading user profile from database. Please check connection.")
        setUser(null)
        setIsLoading(false)

        // Resolve auth state promise if waiting
        if (userSyncRef.current) {
          userSyncRef.current()
          userSyncRef.current = null
        }
      }
    } catch (err) {
      console.error("Error fetching user data:", err)
      setError("Failed to load user data")
      setIsLoading(false)

      // Still resolve if waiting (with error state)
      if (userSyncRef.current) {
        userSyncRef.current()
        userSyncRef.current = null
      }
    }
  }, [])

  const refresh = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (session?.user) {
        await fetchUserData(session.user.id)
      } else {
        setUser(null)
        setOrganization(null)
      }
    } catch (err) {
      console.error("Error refreshing session:", err)
      setError("Failed to refresh session")
    } finally {
      setIsLoading(false)
    }
  }, [fetchUserData])

  useEffect(() => {
    let timeoutId: NodeJS.Timeout | null = null
    let timeoutWarningId: NodeJS.Timeout | null = null
    const controller = new AbortController()

    const initializeAuth = async () => {
      const startTime = Date.now()
      try {
        console.log('[useEnterpriseAuth] Starting auth initialization...')

        // Set a warning at 8 seconds
        timeoutWarningId = setTimeout(() => {
          console.warn('[useEnterpriseAuth] Auth initialization taking longer than 8 seconds...')
        }, 8000)

        // Set a hard timeout at 25 seconds
        timeoutId = setTimeout(() => {
          console.error('[useEnterpriseAuth] Auth initialization timeout exceeded (25s)')
          setError("Authentication initialization timed out")
          setIsLoading(false)
        }, 25000)

        await refresh()
        console.log(`[useEnterpriseAuth] Auth initialization completed in ${Date.now() - startTime}ms`)
      } catch (err) {
        console.error('[useEnterpriseAuth] Auth initialization error:', err)
        setError("Failed to initialize authentication")
        setIsLoading(false)
      } finally {
        if (timeoutId) clearTimeout(timeoutId)
        if (timeoutWarningId) clearTimeout(timeoutWarningId)
      }
    }

    initializeAuth()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event: AuthChangeEvent, session: Session | null) => {
      console.log('[useEnterpriseAuth] Auth state changed:', event, { sessionExists: !!session, userId: session?.user?.id })
      if (event === "SIGNED_IN" && session?.user) {
        console.log('[useEnterpriseAuth] User signed in, fetching user data...')
        setIsLoading(true)
        await fetchUserData(session.user.id)
        console.log('[useEnterpriseAuth] User data fetch complete')
        setIsLoading(false)
      } else if (event === "SIGNED_OUT") {
        console.log('[useEnterpriseAuth] User signed out')
        setUser(null)
        setOrganization(null)
        setIsLoading(false)
      } else if (event === "INITIAL_SESSION") {
        console.log('[useEnterpriseAuth] Initial session check:', { hasSession: !!session })
      } else {
        console.log('[useEnterpriseAuth] Other auth event:', event)
      }
    })

    return () => {
      if (timeoutId) clearTimeout(timeoutId)
      if (timeoutWarningId) clearTimeout(timeoutWarningId)
      subscription.unsubscribe()
      controller.abort()
    }
  }, [fetchUserData, refresh])

  const signIn = async (email: string, password: string) => {
    setError(null)
    try {
      console.log('[useEnterpriseAuth] Calling signInWithPassword for:', email)
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      })
      if (error) {
        console.error('[useEnterpriseAuth] SignIn error:', error)
        throw error
      }
      console.log('[useEnterpriseAuth] SignIn successful')
      return { success: true }
    } catch (err: any) {
      const message = err.message || "Failed to sign in"
      console.error('[useEnterpriseAuth] SignIn exception:', message)
      setError(message)
      return { success: false, error: message }
    }
  }

  const signUp = async (email: string, password: string, metadata?: Record<string, any>) => {
    setError(null)
    try {
      const { error } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: {
          data: metadata,
          emailRedirectTo: process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL || window.location.origin,
        },
      })
      if (error) throw error
      return { success: true }
    } catch (err: any) {
      const message = err.message || "Failed to sign up"
      setError(message)
      return { success: false, error: message }
    }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    sessionManager.clearSession()
    setUser(null)
    setOrganization(null)
  }

  // Convert to TeamMember for backward compatibility
  const teamMember: TeamMember | null = user
    ? {
      id: user.id,
      clinicId: user.clinicId || undefined,
      name: user.fullName,
      email: user.email,
      phone: user.phone || undefined,
      role: NEW_ROLE_MAP[user.role] as Role,
      status: user.status === "active" ? "Active" : user.status === "invited" ? "Invited" : "Deactivated",
      lastActive: user.lastActiveAt || "Unknown",
      avatar: user.avatarUrl || undefined,
    }
    : null

  const resetPassword = async (email: string) => {
    setError(null)
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
        redirectTo: process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL || window.location.origin,
      })
      if (error) throw error
      return { success: true }
    } catch (err: any) {
      const message = err.message || "Failed to send password reset email"
      setError(message)
      return { success: false, error: message }
    }
  }

  const waitForUserSync = useCallback(() => {
    return new Promise<void>((resolve) => {
      // If user is already loaded, resolve immediately
      if (user && !isLoading) {
        console.log('[useEnterpriseAuth] User already synced, resolving immediately')
        resolve()
      } else {
        // Set resolver to be called when user data is fetched
        console.log('[useEnterpriseAuth] Waiting for user sync...')
        userSyncRef.current = () => {
          console.log('[useEnterpriseAuth] User sync complete, resolving')
          resolve()
        }
      }
    })
  }, [user, isLoading])

  return {
    user,
    organization,
    teamMember,
    isLoading,
    isAuthenticated: !!user,
    isSuperAdmin: user?.role === "super_admin",
    isOrgAdmin: user?.role === "admin" || user?.role === "super_admin",
    error,
    signIn,
    signUp,
    signOut,
    refresh,
    waitForUserSync,
    resetPassword,
  }
}
