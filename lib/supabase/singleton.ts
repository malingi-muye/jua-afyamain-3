import { createClient } from "@supabase/supabase-js"
import type { Database } from "../../types/supabase"
import logger from "../logger"

// Use `any` for the singleton client to avoid strict generic mismatches.
let _client: any = null

// Custom storage adapter to handle missing/corrupted refresh tokens
class SafeStorage {
  private silentLog(message: string): void {
    // Use direct console to avoid circular logger reference
    if (typeof console !== 'undefined' && console.debug) {
      try {
        console.debug("[Supabase Storage]", message)
      } catch {
        // Silently fail if console is unavailable
      }
    }
  }

  getItem(key: string): string | null {
    try {
      const item = window.localStorage?.getItem(key)
      // If it's an auth session, validate it has necessary fields
      if (key === "sb-auth-token" && item) {
        try {
          const parsed = JSON.parse(item)
          // Check if session has valid structure
          if (parsed.session && !parsed.session.refresh_token) {
            this.silentLog("Session missing refresh_token, clearing corrupted session")
            window.localStorage?.removeItem(key)
            return null
          }
        } catch (e) {
          this.silentLog("Failed to parse auth token, clearing corrupted data")
          window.localStorage?.removeItem(key)
          return null
        }
      }
      return item
    } catch (e) {
      this.silentLog("Error reading from localStorage")
      return null
    }
  }

  setItem(key: string, value: string): void {
    try {
      window.localStorage?.setItem(key, value)
    } catch (e) {
      this.silentLog("Error writing to localStorage")
    }
  }

  removeItem(key: string): void {
    try {
      window.localStorage?.removeItem(key)
    } catch (e) {
      this.silentLog("Error removing from localStorage")
    }
  }

  clear(): void {
    try {
      window.localStorage?.clear()
    } catch (e) {
      this.silentLog("Error clearing localStorage")
    }
  }
}

export function getSupabaseClient() {
  // Only create on client side
  if (typeof window === "undefined") {
    throw new Error("getSupabaseClient() can only be called on the client side")
  }

  if (_client === null) {
    const url =
      import.meta.env.VITE_SUPABASE_URL ||
      import.meta.env.VITE_NEXT_SUPABASE_URL ||
      import.meta.env.NEXT_PUBLIC_SUPABASE_URL

    const key =
      import.meta.env.VITE_SUPABASE_ANON_KEY ||
      import.meta.env.VITE_NEXT_SUPABASE_ANON_KEY ||
      import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!url || !key) {
      // Fail fast: require Supabase configuration for production / staging runs.
      const missing = [] as string[]
      if (!url) missing.push("VITE_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_URL")
      if (!key) missing.push("VITE_SUPABASE_ANON_KEY / NEXT_PUBLIC_SUPABASE_ANON_KEY")
      throw new Error(`Supabase configuration missing: ${missing.join(", ")}. Please set the required environment variables.`)
    }

    logger.log("[Supabase Client] Initializing with URL:", url.substring(0, 50) + "...")

    // Create client with safe storage adapter
    const safeStorage = new SafeStorage()

    // createClient may have complex generic signatures; call via `any` to avoid TS generic errors here
    _client = (createClient as any)(url, key, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storage: safeStorage,
        flowType: 'pkce'
      }
    })

    // Set up global error handler for auth refresh failures
    _client.auth.onAuthStateChange(async (event: string, session: any) => {
      if (event === 'INITIAL_SESSION' || event === 'SIGNED_IN') {
        if (!session) {
          // Silently handle - avoid logger to prevent circular refs
        }
      }
      if (event === 'SIGNED_OUT') {
        // Clear any corrupted auth data
        try {
          safeStorage.removeItem('sb-auth-token')
        } catch (e) {
          // Silently handle
        }
      }
    })
  }

  return _client
}
