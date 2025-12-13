"use client"

import { useEffect, useState, useCallback } from "react"
import { supabase } from "@/lib/supabaseClient"
import type { User, Organization, UserRole } from "@/types/enterprise"
import type { TeamMember, Role } from "@/types"
import { NEW_ROLE_MAP } from "@/types/enterprise"

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
}

export function useEnterpriseAuth(): UseEnterpriseAuthReturn {
  const [user, setUser] = useState<User | null>(null)
  const [organization, setOrganization] = useState<Organization | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchUserData = useCallback(async (authUserId: string) => {
    try {
      // Fetch user profile
      const { data: profile, error: profileError } = await supabase
        .from("users")
        .select("*")
        .eq("id", authUserId)
        .single()

      if (profileError) {
        // User might not have a profile yet - use auth metadata
        const {
          data: { user: authUser },
        } = await supabase.auth.getUser()
        if (authUser) {
          const basicUser: User = {
            id: authUser.id,
            email: authUser.email || "",
            fullName: authUser.user_metadata?.full_name || authUser.email?.split("@")[0] || "User",
            role: (authUser.user_metadata?.role as UserRole) || "doctor",
            status: "active",
            preferences: {},
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }
          setUser(basicUser)
        }
        return
      }

      const mappedUser: User = {
        id: profile.id,
        organizationId: profile.organization_id,
        email: profile.email,
        fullName: profile.full_name,
        phone: profile.phone,
        avatarUrl: profile.avatar_url,
        role: profile.role as UserRole,
        department: profile.department,
        licenseNumber: profile.license_number,
        specialization: profile.specialization,
        status: profile.status,
        lastLoginAt: profile.last_login_at,
        lastActiveAt: profile.last_active_at,
        preferences: profile.preferences || {},
        createdAt: profile.created_at,
        updatedAt: profile.updated_at,
      }
      setUser(mappedUser)

      // Fetch organization
      if (profile.organization_id) {
        const { data: org } = await supabase
          .from("organizations")
          .select("*")
          .eq("id", profile.organization_id)
          .single()

        if (org) {
          setOrganization({
            id: org.id,
            name: org.name,
            slug: org.slug,
            ownerId: org.owner_id,
            logoUrl: org.logo_url,
            email: org.email,
            phone: org.phone,
            address: org.address,
            country: org.country,
            currency: org.currency,
            timezone: org.timezone,
            plan: org.plan,
            planSeats: org.plan_seats,
            status: org.status,
            trialEndsAt: org.trial_ends_at,
            settings: org.settings || {},
            metadata: org.metadata || {},
            createdAt: org.created_at,
            updatedAt: org.updated_at,
          })
        }
      }

      // Update last active
      await supabase.from("users").update({ last_active_at: new Date().toISOString() }).eq("id", authUserId)
    } catch (err) {
      console.error("Error fetching user data:", err)
      setError("Failed to load user data")
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
    refresh()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_IN" && session?.user) {
        await fetchUserData(session.user.id)
      } else if (event === "SIGNED_OUT") {
        setUser(null)
        setOrganization(null)
      }
      setIsLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [fetchUserData, refresh])

  const signIn = async (email: string, password: string) => {
    setError(null)
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      })
      if (error) throw error
      return { success: true }
    } catch (err: any) {
      const message = err.message || "Failed to sign in"
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
    setUser(null)
    setOrganization(null)
  }

  // Convert to TeamMember for backward compatibility
  const teamMember: TeamMember | null = user
    ? {
        id: user.id,
        clinicId: user.organizationId,
        name: user.fullName,
        email: user.email,
        phone: user.phone,
        role: NEW_ROLE_MAP[user.role] as Role,
        status: user.status === "active" ? "Active" : user.status === "invited" ? "Invited" : "Deactivated",
        lastActive: user.lastActiveAt || "Unknown",
        avatar: user.avatarUrl,
      }
    : null

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
  }
}
