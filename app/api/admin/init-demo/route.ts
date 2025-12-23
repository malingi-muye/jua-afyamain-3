import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

/**
 * SECURITY: This endpoint is DISABLED by default to prevent accidental demo user creation in production.
 * To enable this endpoint, set ENABLE_DEMO_INIT=true in your environment variables.
 *
 * Demo users should ONLY be created in development/staging environments, never in production.
 * Use Supabase Auth dashboard to create test users instead.
 */

export async function POST(request: Request) {
  try {
    // Check if demo initialization is explicitly enabled
    if (process.env.ENABLE_DEMO_INIT !== "true") {
      return NextResponse.json({
        error: "Demo initialization is disabled. Set ENABLE_DEMO_INIT=true to enable."
      }, { status: 403 })
    }

    // Verify authorization
    const authHeader = request.headers.get("authorization")
    if (authHeader !== `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Demo users are no longer hardcoded. Use Supabase Auth dashboard or
    // provide them via secure configuration/environment variables.

    return NextResponse.json({
      success: false,
      error: "Demo initialization endpoint has been deprecated for security reasons.",
      message: "Use Supabase Auth dashboard or API to create test users instead.",
      documentation: "https://supabase.com/docs/reference/javascript/admin-create-user"
    }, { status: 501 })
  } catch (error) {
    console.error("Demo init error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
