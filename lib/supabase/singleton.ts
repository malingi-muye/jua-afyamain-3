import { createClient } from "@supabase/supabase-js"
import type { Database } from "../../types/supabase"

let _client: ReturnType<typeof createClient<Database>> | null = null

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
      console.error("[Supabase Client] Missing credentials:")
      console.error("  - URL:", !!url ? "SET" : "MISSING")
      console.error("  - ANON_KEY:", !!key ? "SET" : "MISSING")
      console.error("[Supabase Client] Running in DEMO mode - authentication will not work!")
      console.error("[Supabase Client] To fix: Configure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY")

      // Return a mock client that will fail gracefully
      return {
        auth: {
          getSession: async () => {
            console.warn("[Supabase Demo] getSession called - returning null session")
            return { data: { session: null }, error: null }
          },
          signInWithPassword: async (credentials: any) => {
            console.error("[Supabase Demo] signInWithPassword failed - Supabase not configured", credentials.email)
            return {
              data: { user: null, session: null },
              error: { message: "Supabase credentials not configured - check environment variables" },
            }
          },
          signUp: async () => {
            console.error("[Supabase Demo] signUp failed - Supabase not configured")
            return {
              data: { user: null, session: null },
              error: { message: "Supabase credentials not configured - check environment variables" },
            }
          },
          signOut: async () => ({ error: null }),
          resetPasswordForEmail: async () => ({ error: { message: "Supabase not configured" } }),
          onAuthStateChange: (callback: any) => {
            // Call callback immediately with no session - Use INITIAL_SESSION to avoid triggering logout logic
            setTimeout(() => callback("INITIAL_SESSION", null), 0);
            return { data: { subscription: { unsubscribe: () => { } } } }
          },
        },
        from: (table: string) => ({
          select: () => ({ data: [], error: { message: `Supabase demo mode - ${table} query failed` } }),
          insert: () => ({
            data: null,
            error: { message: "Demo mode" },
            select: () => ({ single: () => ({ data: null, error: { message: "Demo mode" } }) }),
          }),
          update: () => ({
            data: null,
            error: { message: "Demo mode" },
            eq: () => ({ data: null, error: { message: "Demo mode" } }),
          }),
          delete: () => ({ eq: () => ({ error: { message: "Demo mode" } }) }),
          maybeSingle: () => ({ data: null, error: { message: "Demo mode" } }),
        }),
        rpc: () => ({ data: null, error: { message: "Demo mode" } }),
        removeAllChannels: () => { },
      } as any
    }

    console.log("[Supabase Client] Initializing with URL:", url.substring(0, 50) + "...")
    _client = createClient<Database>(url, key, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storage: window.localStorage
      }
    })
  }

  return _client
}
