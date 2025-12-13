/**
 * Clinic Dashboard
 * Shows clinic overview and stats
 */

import { getSupabaseServerClient } from "@/lib/multitenancy"
import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default async function DashboardPage() {
  const supabase = await getSupabaseServerClient()

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session?.user) {
    redirect("/auth/login")
  }

  // Get user profile and organization
  const { data: user } = await supabase.from("users").select("*, organizations(*)").eq("id", session.user.id).single()

  if (!user) {
    redirect("/auth/login")
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
              <p className="text-muted-foreground mt-2">Welcome back, {user.full_name}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Clinic</CardTitle>
              <CardDescription>Current organization</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{user.organizations?.name || "Not assigned"}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Role</CardTitle>
              <CardDescription>Your position</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold capitalize">{user.role.replace("_", " ")}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Status</CardTitle>
              <CardDescription>Account status</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold capitalize">{user.status}</p>
            </CardContent>
          </Card>
        </div>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Getting Started</CardTitle>
            <CardDescription>Set up your clinic</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center">
                <span className="mr-2">✓</span>
                <span>Account created and verified</span>
              </li>
              <li className="flex items-center">
                <span className="mr-2">→</span>
                <span>Complete clinic profile</span>
              </li>
              <li className="flex items-center">
                <span className="mr-2">→</span>
                <span>Add clinic staff</span>
              </li>
              <li className="flex items-center">
                <span className="mr-2">→</span>
                <span>Set up appointment system</span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
