"use client"

import { useClinic } from "@/components/ClinicProvider"
import { ClinicDashboard } from "@/components/dashboard/clinic-dashboard"
import { Spinner } from "@/components/ui/spinner"

export default function DashboardPage() {
  const { clinic, isLoading } = useClinic()

  if (isLoading) {
    return <Spinner />
  }

  if (!clinic) {
    return <div>No clinic found</div>
  }

  return <ClinicDashboard clinic={clinic} />
}
