"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { getSupabaseClient } from "@/lib/supabase/singleton"
import { useClinic } from "@/components/ClinicProvider"
import { AppointmentList } from "@/components/appointments/appointment-list"
import { AppointmentDialog } from "@/components/appointments/appointment-dialog"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Spinner } from "@/components/ui/spinner"
import { Plus, Calendar } from "lucide-react"
import type { Appointment, Patient, User } from "@/types/database"

export default function AppointmentsPage() {
  const { clinic } = useClinic()
  const [appointments, setAppointments] = useState<(Appointment & { patient_name?: string })[]>([])
  const [patients, setPatients] = useState<Patient[]>([])
  const [doctors, setDoctors] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null)
  const [filterStatus, setFilterStatus] = useState("all")

  const fetchData = async () => {
    if (!clinic) return
    try {
      const supabase = getSupabaseClient()

      // Fetch appointments
      const { data: appointmentData } = await supabase
        .from("appointments")
        .select("*")
        .eq("clinic_id", clinic.id)
        .order("appointment_date", { ascending: true })

      // Fetch patients
      const { data: patientData } = await supabase.from("patients").select("*").eq("clinic_id", clinic.id)

      // Fetch doctors
      const { data: doctorData } = await supabase
        .from("users")
        .select("*")
        .eq("clinic_id", clinic.id)
        .in("role", ["doctor", "admin"])

      setAppointments(appointmentData || [])
      setPatients(patientData || [])
      setDoctors(doctorData || [])
    } catch (error) {
      console.error("[v0] Error fetching data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [clinic])

  const filteredAppointments =
    filterStatus === "all"
      ? appointments
      : appointments.filter((a) => a.status.toLowerCase() === filterStatus.toLowerCase())

  const handleEdit = (appointment: Appointment) => {
    setSelectedAppointment(appointment)
    setIsDialogOpen(true)
  }

  const handleClose = () => {
    setIsDialogOpen(false)
    setSelectedAppointment(null)
    fetchData()
  }

  if (isLoading) {
    return <Spinner />
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Appointments</h1>
          <p className="text-slate-600 dark:text-slate-400">Schedule and manage patient appointments</p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          New Appointment
        </Button>
      </div>

      {/* Filter */}
      <Card className="p-4">
        <div className="flex gap-2 flex-wrap">
          {["all", "scheduled", "completed", "cancelled", "no-show"].map((status) => (
            <Button
              key={status}
              variant={filterStatus === status ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterStatus(status)}
              className="capitalize"
            >
              {status}
            </Button>
          ))}
        </div>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard label="Total Appointments" value={appointments.length} icon={Calendar} color="blue" />
        <StatCard
          label="Scheduled"
          value={appointments.filter((a) => a.status === "scheduled").length}
          icon={Calendar}
          color="green"
        />
        <StatCard
          label="Completed"
          value={appointments.filter((a) => a.status === "completed").length}
          icon={Calendar}
          color="emerald"
        />
        <StatCard
          label="Cancelled"
          value={appointments.filter((a) => a.status === "cancelled").length}
          icon={Calendar}
          color="red"
        />
      </div>

      {/* Appointment List */}
      <AppointmentList
        appointments={filteredAppointments}
        patients={patients}
        doctors={doctors}
        onEdit={handleEdit}
        onRefresh={fetchData}
      />

      {/* Dialog */}
      <AppointmentDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        appointment={selectedAppointment}
        patients={patients}
        doctors={doctors}
        onClose={handleClose}
      />
    </div>
  )
}

function StatCard({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string
  value: number
  icon: React.ComponentType<{ className?: string }>
  color: "blue" | "green" | "emerald" | "red"
}) {
  const colorClasses = {
    blue: "text-blue-600 dark:text-blue-400",
    green: "text-green-600 dark:text-green-400",
    emerald: "text-emerald-600 dark:text-emerald-400",
    red: "text-red-600 dark:text-red-400",
  }
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-600 dark:text-slate-400">{label}</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{value}</p>
        </div>
        <Icon className={`w-8 h-8 ${colorClasses[color]}`} />
      </div>
    </Card>
  )
}
