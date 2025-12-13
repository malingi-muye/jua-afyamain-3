/**
 * Clinics API
 * GET: List clinics (super admin sees all, users see their own)
 * POST: Create new clinic (super admin only)
 */

import { getSupabaseServerClient } from "@/lib/multitenancy"
import { getUserAccessibleClinics, createClinic } from "@/lib/rbac-server"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = await getSupabaseServerClient()

    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const clinics = await getUserAccessibleClinics(session.user.id)

    return NextResponse.json({ clinics })
  } catch (error) {
    console.error("Get clinics error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const supabase = await getSupabaseServerClient()

    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const clinic = await createClinic(body, session.user.id)

    return NextResponse.json(
      {
        success: true,
        clinic,
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("Create clinic error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 },
    )
  }
}
