/**
 * Get users in an organization
 * Only accessible to org admins and super admins
 */

import { getSupabaseServerClient } from "@/lib/multitenancy"
import { requireOrgAdmin, getTenantUsers } from "@/lib/rbac-server"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = await getSupabaseServerClient()

    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get users in tenant
    const users = await getTenantUsers(session.user.id, params.id)

    return NextResponse.json({ users })
  } catch (error) {
    console.error("Get users error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json()
    const { email, fullName, role } = body

    const supabase = await getSupabaseServerClient()

    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Verify requester is admin
    await requireOrgAdmin(session.user.id, params.id)

    // Create user with temporary password
    const tempPassword = Math.random().toString(36).slice(-12)

    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email,
      password: tempPassword,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
      },
    })

    if (authError || !authUser?.user) {
      return NextResponse.json({ error: authError?.message || "Failed to create user" }, { status: 400 })
    }

    // Create user profile
    const { data: userProfile, error: profileError } = await supabase
      .from("users")
      .insert({
        id: authUser.user.id,
        email,
        full_name: fullName,
        organization_id: params.id,
        role: role || "doctor",
        status: "invited",
      })
      .select()
      .single()

    if (profileError) {
      await supabase.auth.admin.deleteUser(authUser.user.id)
      return NextResponse.json({ error: "Failed to create user profile" }, { status: 400 })
    }

    return NextResponse.json(
      {
        success: true,
        user: userProfile,
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("Create user error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 },
    )
  }
}
