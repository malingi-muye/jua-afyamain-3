/**
 * Audit logs API
 * List audit logs for current tenant
 * Only accessible to admins and super admins
 */

import { getSupabaseServerClient } from "@/lib/multitenancy"
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

    // Get user role
    const { data: user } = await supabase
      .from("users")
      .select("role, organization_id")
      .eq("id", session.user.id)
      .single()

    if (!user || (user.role !== "admin" && user.role !== "super_admin")) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams
    const limit = Number.parseInt(searchParams.get("limit") || "50")
    const offset = Number.parseInt(searchParams.get("offset") || "0")

    // Build query based on user role
    let query = supabase
      .from("audit_logs")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1)

    // Non-super-admins only see their organization's logs
    if (user.role !== "super_admin") {
      query = query.eq("organization_id", user.organization_id)
    }

    const { data: logs, count } = await query

    return NextResponse.json({
      logs,
      total: count,
      limit,
      offset,
    })
  } catch (error) {
    console.error("Get audit logs error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
