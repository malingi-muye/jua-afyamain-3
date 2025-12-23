"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { getSupabaseClient } from "@/lib/supabase/singleton"
import { useClinic } from "@/components/ClinicProvider"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Spinner } from "@/components/ui/spinner"
import { Button } from "@/components/ui/button"
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"
import { Download, TrendingUp } from "lucide-react"
import type { Patient, Appointment, Visit, InventoryItem } from "@/types/database"

interface AnalyticsData {
  totalPatients: number
  totalAppointments: number
  completedAppointments: number
  totalRevenue: number
  appointmentsByStatus: { name: string; value: number }[]
  patientsPerMonth: { month: string; count: number }[]
  revenueByMonth: { month: string; revenue: number }[]
  inventoryValue: number
  topCategories: { name: string; count: number }[]
}

export default function ReportsPage() {
  const { clinic } = useClinic()
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    totalPatients: 0,
    totalAppointments: 0,
    completedAppointments: 0,
    totalRevenue: 0,
    appointmentsByStatus: [],
    patientsPerMonth: [],
    revenueByMonth: [],
    inventoryValue: 0,
    topCategories: [],
  })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchAnalytics = async () => {
      if (!clinic) return

      try {
        const supabase = getSupabaseClient()

        // Fetch patients
        const { data: patients } = await supabase.from("patients").select("*").eq("clinic_id", clinic.id)

        // Fetch appointments
        const { data: appointments } = await supabase.from("appointments").select("*").eq("clinic_id", clinic.id)

        // Fetch visits (for revenue)
        const { data: visits } = await supabase.from("visits").select("*").eq("clinic_id", clinic.id)

        // Fetch inventory
        const { data: inventory } = await supabase.from("inventory").select("*").eq("clinic_id", clinic.id)

        const patientList = (patients || []) as Patient[]
        const appointmentList = (appointments || []) as Appointment[]
        const visitList = (visits || []) as Visit[]
        const inventoryList = (inventory || []) as InventoryItem[]

        // Calculate metrics
        const completedAppts = appointmentList.filter((a) => a.status === "completed").length
        const totalRevenue = visitList.reduce((sum, v) => sum + (v.total_bill || 0), 0)
        const inventoryValue = inventoryList.reduce((sum, i) => sum + i.price * i.quantity_in_stock, 0)

        // Appointments by status
        const appointmentsByStatus = [
          { name: "Scheduled", value: appointmentList.filter((a) => a.status === "scheduled").length },
          { name: "Completed", value: completedAppts },
          { name: "Cancelled", value: appointmentList.filter((a) => a.status === "cancelled").length },
        ]

        // Patients per month
        const patientsPerMonth = Array.from({ length: 6 }, (_, i) => {
          const month = new Date(new Date().setMonth(new Date().getMonth() - i))
          const monthStr = month.toLocaleDateString("en-US", { month: "short" })
          const count = patientList.filter((p) => {
            const created = new Date(p.created_at)
            return created.getMonth() === month.getMonth() && created.getFullYear() === month.getFullYear()
          }).length
          return { month: monthStr, count }
        }).reverse()

        // Revenue by month
        const revenueByMonth = Array.from({ length: 6 }, (_, i) => {
          const month = new Date(new Date().setMonth(new Date().getMonth() - i))
          const monthStr = month.toLocaleDateString("en-US", { month: "short" })
          const revenue = visitList
            .filter((v) => {
              const created = new Date(v.created_at)
              return created.getMonth() === month.getMonth() && created.getFullYear() === month.getFullYear()
            })
            .reduce((sum, v) => sum + (v.total_bill || 0), 0)
          return { month: monthStr, revenue: Number(revenue.toFixed(0)) }
        }).reverse()

        // Top categories
        const categoryCount: Record<string, number> = {}
        inventoryList.forEach((item) => {
          categoryCount[item.category] = (categoryCount[item.category] || 0) + 1
        })
        const topCategories = Object.entries(categoryCount).map(([name, count]) => ({ name, count }))

        setAnalytics({
          totalPatients: patientList.length,
          totalAppointments: appointmentList.length,
          completedAppointments: completedAppts,
          totalRevenue,
          appointmentsByStatus,
          patientsPerMonth,
          revenueByMonth,
          inventoryValue,
          topCategories,
        })
      } catch (error) {
        console.error("[v0] Error fetching analytics:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchAnalytics()
  }, [clinic])

  if (isLoading) {
    return <Spinner />
  }

  const handleExport = () => {
    const csv = [
      ["Metric", "Value"],
      ["Total Patients", analytics.totalPatients],
      ["Total Appointments", analytics.totalAppointments],
      ["Completed Appointments", analytics.completedAppointments],
      ["Total Revenue", `KES ${analytics.totalRevenue.toFixed(2)}`],
      ["Inventory Value", `KES ${analytics.inventoryValue.toFixed(2)}`],
    ]
      .map((row) => row.join(","))
      .join("\n")

    const blob = new Blob([csv], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `clinic-report-${new Date().toISOString().split("T")[0]}.csv`
    a.click()
  }

  const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Reports & Analytics</h1>
          <p className="text-slate-600 dark:text-slate-400">View clinic metrics and performance</p>
        </div>
        <Button onClick={handleExport} variant="outline" className="gap-2 bg-transparent">
          <Download className="w-4 h-4" />
          Export Report
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard label="Total Patients" value={analytics.totalPatients} icon={TrendingUp} color="blue" />
        <KPICard label="Total Appointments" value={analytics.totalAppointments} icon={TrendingUp} color="green" />
        <KPICard label="Completed" value={analytics.completedAppointments} icon={TrendingUp} color="emerald" />
        <KPICard
          label="Total Revenue"
          value={`KES ${(analytics.totalRevenue / 1000).toFixed(1)}K`}
          icon={TrendingUp}
          color="purple"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Patients Growth */}
        <Card>
          <CardHeader>
            <CardTitle>Patient Growth (Last 6 Months)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={analytics.patientsPerMonth}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Revenue Growth */}
        <Card>
          <CardHeader>
            <CardTitle>Revenue Trend (Last 6 Months)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analytics.revenueByMonth}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="revenue" fill="#10b981" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Appointments by Status */}
        <Card>
          <CardHeader>
            <CardTitle>Appointments by Status</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={analytics.appointmentsByStatus}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {analytics.appointmentsByStatus.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Inventory Categories */}
        <Card>
          <CardHeader>
            <CardTitle>Inventory by Category</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analytics.topCategories}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#f59e0b" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Summary Stats */}
      <Card>
        <CardHeader>
          <CardTitle>Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
              <p className="text-sm text-slate-600 dark:text-slate-400">Completion Rate</p>
              <p className="text-2xl font-bold mt-1">
                {analytics.totalAppointments > 0
                  ? ((analytics.completedAppointments / analytics.totalAppointments) * 100).toFixed(1)
                  : 0}
                %
              </p>
            </div>
            <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
              <p className="text-sm text-slate-600 dark:text-slate-400">Inventory Value</p>
              <p className="text-2xl font-bold mt-1">KES {(analytics.inventoryValue / 1000).toFixed(1)}K</p>
            </div>
            <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
              <p className="text-sm text-slate-600 dark:text-slate-400">Avg Revenue/Appt</p>
              <p className="text-2xl font-bold mt-1">
                KES{" "}
                {analytics.totalAppointments > 0
                  ? (analytics.totalRevenue / analytics.totalAppointments).toFixed(0)
                  : 0}
              </p>
            </div>
            <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
              <p className="text-sm text-slate-600 dark:text-slate-400">Active Categories</p>
              <p className="text-2xl font-bold mt-1">{analytics.topCategories.length}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function KPICard({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string
  value: number | string
  icon: React.ComponentType<{ className?: string }>
  color: "blue" | "green" | "emerald" | "purple"
}) {
  const colorClasses = {
    blue: "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400",
    green: "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400",
    emerald: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400",
    purple: "bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400",
  }
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400">{label}</p>
            <p className="text-3xl font-bold text-slate-900 dark:text-white mt-2">{value}</p>
          </div>
          <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
            <Icon className="w-6 h-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
