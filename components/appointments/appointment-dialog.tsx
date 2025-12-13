"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { getSupabaseClient } from "@/lib/supabase/singleton"
import { useClinic } from "@/components/ClinicProvider"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Spinner } from "@/components/ui/spinner"
import type { Appointment, Patient, User } from "@/types/database"

interface AppointmentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  appointment: Appointment | null
  patients: Patient[]
  doctors: User[]
  onClose: () => void
}

export function AppointmentDialog({
  open,
  onOpenChange,
  appointment,
  patients,
  doctors,
  onClose,
}: AppointmentDialogProps) {
  const { clinic } = useClinic()
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState<Partial<Appointment>>({
    patient_id: "",
    doctor_id: "",
    appointment_date: "",
    duration_minutes: 30,
    status: "scheduled",
    reason: "",
  })

  useEffect(() => {
    if (appointment) {
      setFormData(appointment)
    } else {
      setFormData({
        patient_id: "",
        doctor_id: "",
        appointment_date: "",
        duration_minutes: 30,
        status: "scheduled",
        reason: "",
      })
    }
  }, [appointment, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!clinic) return

    setIsLoading(true)
    try {
      const supabase = getSupabaseClient()

      if (appointment) {
        // Update
        const { error } = await supabase
          .from("appointments")
          .update({
            ...formData,
            updated_at: new Date().toISOString(),
          })
          .eq("id", appointment.id)
        if (error) throw error
      } else {
        // Create
        const { error } = await supabase.from("appointments").insert({
          ...formData,
          clinic_id: clinic.id,
        })
        if (error) throw error
      }

      onClose()
      onOpenChange(false)
    } catch (error) {
      console.error("[v0] Error saving appointment:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{appointment ? "Edit Appointment" : "New Appointment"}</DialogTitle>
          <DialogDescription>
            {appointment ? "Update appointment details" : "Schedule a new appointment"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label>Patient *</Label>
              <Select
                value={formData.patient_id || ""}
                onValueChange={(value) => setFormData({ ...formData, patient_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select patient" />
                </SelectTrigger>
                <SelectContent>
                  {patients.map((patient) => (
                    <SelectItem key={patient.id} value={patient.id}>
                      {patient.full_name} ({patient.mrn})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2">
              <Label>Doctor *</Label>
              <Select
                value={formData.doctor_id || ""}
                onValueChange={(value) => setFormData({ ...formData, doctor_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select doctor" />
                </SelectTrigger>
                <SelectContent>
                  {doctors.map((doctor) => (
                    <SelectItem key={doctor.id} value={doctor.id}>
                      {doctor.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Date & Time *</Label>
              <Input
                type="datetime-local"
                required
                value={formData.appointment_date || ""}
                onChange={(e) => setFormData({ ...formData, appointment_date: e.target.value })}
              />
            </div>
            <div>
              <Label>Duration (minutes)</Label>
              <Input
                type="number"
                value={formData.duration_minutes || 30}
                onChange={(e) => setFormData({ ...formData, duration_minutes: Number.parseInt(e.target.value) })}
              />
            </div>
            <div>
              <Label>Status</Label>
              <Select
                value={formData.status || "scheduled"}
                onValueChange={(value) => setFormData({ ...formData, status: value as any })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                  <SelectItem value="no-show">No Show</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2">
              <Label>Reason for Visit</Label>
              <Input
                value={formData.reason || ""}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                placeholder="Checkup, Follow-up, etc."
              />
            </div>
          </div>

          <div className="flex justify-end gap-4 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? <Spinner /> : appointment ? "Update" : "Schedule"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
