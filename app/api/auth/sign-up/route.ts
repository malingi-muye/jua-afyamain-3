/**
 * Sign up endpoint with Supabase Auth
 * Creates user account and user profile
 */

import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password, fullName, clinicId, role = "doctor" } = body

    // Validate input
    if (!email || !password || !fullName) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const cookieStore = await cookies()
    const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
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
            // Cookies can't be set
          }
        },
      },
    })

    // Create auth user
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
      },
    })

    if (authError || !authUser?.user) {
      // Log detailed error, return generic message
      console.error("Auth user creation failed:", authError?.message)
      return NextResponse.json({ error: "Failed to create account. Please try again." }, { status: 400 })
    }

    const { data: userProfile, error: profileError } = await supabase
      .from("users")
      .insert({
        id: authUser.user.id,
        email,
        full_name: fullName,
        clinic_id: clinicId || null,
        role,
        status: "active",
      })
      .select()
      .single()

    if (profileError) {
      // Log detailed error for debugging
      console.error("Profile creation failed:", profileError.message)
      // Clean up auth user if profile creation fails
      await supabase.auth.admin.deleteUser(authUser.user.id)
      return NextResponse.json({ error: "Failed to complete account setup. Please try again." }, { status: 400 })
    }

    return NextResponse.json(
      {
        success: true,
        user: userProfile,
      },
      { status: 201 },
    )
  } catch (error) {
    // Log full error for debugging, return generic message
    console.error("Sign up endpoint error:", error)
    return NextResponse.json({ error: "Unable to process registration. Please try again." }, { status: 500 })
  }
}
