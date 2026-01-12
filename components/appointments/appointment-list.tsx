"use client"

// Use store actions for deletions so server-side guards and audits run
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Trash2, Edit2, Clock } from "lucide-react"
import { canCurrentUser } from '../../lib/roleMapper'
import useStore from '../../store'
import type { Appointment, Patient, User } from "@/types/database"

interface AppointmentListProps {
  appointments: Appointment[]
  patients: Patient[]
  doctors: User[]
  onEdit: (appointment: Appointment) => void
  onRefresh: () => void
}

const statusColors: Record<string, string> = {
  scheduled: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  completed: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  cancelled: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  "no-show": "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
}

export function AppointmentList({ appointments, patients, doctors, onEdit, onRefresh }: AppointmentListProps) {
  const handleDelete = async (appointmentId: string) => {
    if (!canCurrentUser('appointments.delete')) {
      useStore.getState().actions.showToast('You do not have permission to delete appointments.', 'error')
      return
    }

    try {
      await useStore.getState().actions.updateAppointment({ id: appointmentId } as any) // no-op update to ensure server action path
      // Prefer a dedicated deleteAppointment action if available; fallback to direct store API call
      // `deleteAppointment` is available on the store actions; call it directly
      await (useStore.getState().actions as any).deleteAppointment(appointmentId)
      onRefresh()
    } catch (error) {
      console.error("[v1] Error deleting appointment via store action:", error)
      useStore.getState().actions.showToast('Error deleting appointment.', 'error')
    }
  }

  const getPatientName = (patientId: string) => {
    return patients.find((p) => p.id === patientId)?.full_name || "Unknown"
  }

  const getDoctorName = (doctorId: string) => {
    return doctors.find((d) => d.id === doctorId)?.full_name || "Unassigned"
  }

  if (appointments.length === 0) {
    return (
      <Card className="p-12 text-center">
        <Clock className="w-12 h-12 mx-auto mb-4 text-slate-300" />
        <p className="text-slate-600 dark:text-slate-400">No appointments found</p>
      </Card>
    )
  }

  return (
    <div className="space-y-3">
      {appointments.map((appointment) => (
        <Card key={appointment.id} className="p-4 hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h3 className="font-semibold text-slate-900 dark:text-white">
                  {getPatientName(appointment.patient_id)}
                </h3>
                <Badge className={statusColors[appointment.status]}>{appointment.status}</Badge>
              </div>
              <div className="space-y-1 text-sm text-slate-600 dark:text-slate-400">
                <p>
                  <strong>Date:</strong> {new Date(appointment.appointment_date).toLocaleDateString()} at{" "}
                  {new Date(appointment.appointment_date).toLocaleTimeString()}
                </p>
                <p>
                  <strong>Doctor:</strong> {getDoctorName(appointment.doctor_id)}
                </p>
                {appointment.reason && (
                  <p>
                    <strong>Reason:</strong> {appointment.reason}
                  </p>
                )}
              </div>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => onEdit(appointment)}>
                <Edit2 className="w-4 h-4" />
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm" disabled={!canCurrentUser('appointments.delete')} aria-disabled={!canCurrentUser('appointments.delete')}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogTitle>Delete Appointment</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete this appointment? This action cannot be undone.
                  </AlertDialogDescription>
                    <div className="flex justify-end gap-4">
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => handleDelete(appointment.id)}
                      className="bg-red-600 hover:bg-red-700"
                      disabled={!canCurrentUser('appointments.delete')}
                    >
                      Delete
                    </AlertDialogAction>
                  </div>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </Card>
      ))}
    </div>
  )
}
