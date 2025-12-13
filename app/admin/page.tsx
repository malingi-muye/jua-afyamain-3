/**
 * SuperAdmin Dashboard
 * Displays all tenants, user management, and system overview
 */

import { getSupabaseServerClient } from "@/lib/multitenancy"
import { requireSuperAdmin } from "@/lib/rbac-server"
import { redirect } from "next/navigation"
import AdminDashboard from "@/components/admin/admin-dashboard"

export default async function AdminPage() {
  const supabase = await getSupabaseServerClient()

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session?.user) {
    redirect("/auth/login")
  }

  try {
    await requireSuperAdmin(session.user.id)
  } catch {
    redirect("/")
  }

  const { data: clinics } = await supabase.from("clinics").select("*").order("created_at", { ascending: false })

  return <AdminDashboard initialClinics={clinics || []} />
}
