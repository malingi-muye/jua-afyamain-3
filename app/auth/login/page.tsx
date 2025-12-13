/**
 * Login Page
 * Allows users to login to their clinic
 */

import { getSupabaseServerClient } from "@/lib/multitenancy"
import { redirect } from "next/navigation"
import LoginForm from "@/components/auth/login-form"

export default async function LoginPage() {
  const supabase = await getSupabaseServerClient()

  const {
    data: { session },
  } = await supabase.auth.getSession()

  // If already logged in, redirect to dashboard
  if (session?.user) {
    redirect("/dashboard")
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-md">
        <LoginForm />
      </div>
    </div>
  )
}
