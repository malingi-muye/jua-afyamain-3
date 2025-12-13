import { createBrowserClient } from "@supabase/ssr"
import type { Database } from "@/types/supabase"

let _client: ReturnType<typeof createBrowserClient<Database>> | null = null

export function getSupabaseClient() {
  // Only create on client side
  if (typeof window === "undefined") {
    throw new Error("getSupabaseClient() can only be called on the client side")
  }

  if (_client === null) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!url || !key) {
      throw new Error(
        "Missing Supabase credentials. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY",
      )
    }

    _client = createBrowserClient<Database>(url, key)
  }

  return _client
}
