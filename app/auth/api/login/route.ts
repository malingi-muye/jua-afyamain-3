/**
 * Login API endpoint
 */

import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password required" }, { status: 400 })
    }

    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) => {
                cookieStore.set(name, value, options)
              })
            } catch {
              // Cookies can't be set during request processing
            }
          },
        },
      },
    )

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    })

    if (error) {
      // Log detailed error for debugging, but return generic message to client
      console.error("Login failed:", error.message)
      return NextResponse.json({
        error: "Invalid email or password. Please try again."
      }, { status: 401 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    // Log full error for debugging, return generic message
    console.error("Login endpoint error:", error)
    return NextResponse.json({
      error: "Unable to process login. Please try again."
    }, { status: 500 })
  }
}
