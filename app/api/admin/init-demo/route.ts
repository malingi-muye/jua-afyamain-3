import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

const DEMO_USERS = [
  {
    email: "superadmin@juaafya.com",
    password: "JuaAfya@Demo123",
    role: "super_admin",
  },
  {
    email: "admin@democlinic.com",
    password: "Clinic@Demo123",
    role: "admin",
  },
  {
    email: "doctor@democlinic.com",
    password: "Doctor@Demo123",
    role: "doctor",
  },
  {
    email: "receptionist@democlinic.com",
    password: "Receptionist@Demo123",
    role: "receptionist",
  },
  {
    email: "admin@testhospital.com",
    password: "Hospital@Demo123",
    role: "admin",
  },
]

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get("authorization")
    if (authHeader !== `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
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
            // Cookies can't be set during request processing
          }
        },
      },
    })

    const results = []

    for (const user of DEMO_USERS) {
      try {
        const { data, error } = await supabase.auth.admin.createUser({
          email: user.email,
          password: user.password,
          email_confirm: true,
        })

        if (error) {
          results.push({
            email: user.email,
            status: "error",
            message: error.message,
          })
        } else {
          results.push({
            email: user.email,
            status: "success",
            userId: data.user.id,
          })
        }
      } catch (err) {
        results.push({
          email: user.email,
          status: "error",
          message: err instanceof Error ? err.message : "Unknown error",
        })
      }
    }

    return NextResponse.json({
      success: true,
      message: "Demo users initialized",
      results,
    })
  } catch (error) {
    console.error("Demo init error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
