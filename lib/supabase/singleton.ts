import { createBrowserClient } from "@supabase/ssr"
import type { Database } from "@/types/supabase"

let _client: ReturnType<typeof createBrowserClient<Database>> | null = null

export function getSupabaseClient() {
  // Only create on client side
  if (typeof window === "undefined") {
    throw new Error("getSupabaseClient() can only be called on the client side")
  }

  if (_client === null) {
    const url = import.meta.env.VITE_NEXT_SUPABASE_URL || import.meta.env.NEXT_PUBLIC_SUPABASE_URL
    const key = import.meta.env.VITE_NEXT_SUPABASE_ANON_KEY || import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!url || !key) {
      throw new Error(
        "Missing Supabase credentials. Please set VITE_NEXT_SUPABASE_URL and VITE_NEXT_SUPABASE_ANON_KEY environment variables",
      )
    }

    _client = createBrowserClient<Database>(url, key)
  }

  return _client
}
