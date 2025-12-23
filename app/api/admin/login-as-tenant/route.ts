/**
 * Super Admin endpoint to login as a specific tenant
 * This allows super admins to test tenant experience from the management portal
 */

import { getSupabaseServerClient } from "@/lib/multitenancy"
import { requireSuperAdmin } from "@/lib/rbac-server"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { tenantId, userId } = body

    if (!tenantId || !userId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const supabase = await getSupabaseServerClient()

    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Verify requester is super admin
    await requireSuperAdmin(session.user.id)

    // Get the tenant user (must be admin or exist in that org)
    const { data: targetUser, error: userError } = await supabase
      .from("users")
      .select("*")
      .eq("id", userId)
      .eq("organization_id", tenantId)
      .single()

    if (userError || !targetUser) {
      return NextResponse.json({ error: "User not found in tenant" }, { status: 404 })
    }

    // Create a temporary token that acts as that user
    const { data: tempSession, error: sessionError } = await supabase.auth.admin.generateLink({
      type: "magiclink",
      email: targetUser.email,
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL || process.env.NEXT_PUBLIC_SUPABASE_URL}/tenant/${tenantId}`,
      },
    })

    if (sessionError) {
      return NextResponse.json({ error: "Failed to generate session" }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      loginLink: tempSession?.properties?.action_link,
      user: targetUser,
    })
  } catch (error) {
    console.error("Login as tenant error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 },
    )
  }
}
