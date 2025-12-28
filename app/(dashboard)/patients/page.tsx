"use client"

import { useState, useEffect } from "react"
import { getSupabaseClient } from "@/lib/supabase/singleton"
import { useClinic } from "@/components/ClinicProvider"
import { PatientList } from "@/components/patients/patient-list"
import { PatientDialog } from "@/components/patients/patient-dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Spinner } from "@/components/ui/spinner"
import { Plus, Search } from "lucide-react"
import type { Patient } from "@/types/database"

export default function PatientsPage() {
  const { clinic } = useClinic()
  const [patients, setPatients] = useState<Patient[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null)

  const fetchPatients = async () => {
    if (!clinic) return
    try {
      const supabase = getSupabaseClient()
      let query = supabase.from("patients").select("*").eq("clinic_id", clinic.id).order("created_at", {
        ascending: false,
      })

      if (searchTerm) {
        query = query.or(`full_name.ilike.%${searchTerm}%,mrn.ilike.%${searchTerm}%,phone_number.ilike.%${searchTerm}%`)
      }

      const { data, error } = await query
      if (error) throw error
      setPatients(data || [])
    } catch (error) {
      console.error("[v0] Error fetching patients:", error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchPatients()
  }, [clinic, searchTerm])

  const handleEdit = (patient: Patient) => {
    setSelectedPatient(patient)
    setIsDialogOpen(true)
  }

  const handleClose = () => {
    setIsDialogOpen(false)
    setSelectedPatient(null)
    fetchPatients()
  }

  if (isLoading) {
    return <Spinner />
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Patients</h1>
          <p className="text-slate-600 dark:text-slate-400">Manage clinic patients and medical records</p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          Add Patient
        </Button>
      </div>

      {/* Search */}
      <Card className="p-4">
        <div className="relative">
          <Search className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
          <Input
            placeholder="Search by name, MRN, or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </Card>

      {/* Patient List */}
      <PatientList patients={patients} onEdit={handleEdit} onRefresh={fetchPatients} clinic={clinic} />

      {/* Add/Edit Dialog */}
      <PatientDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        patient={selectedPatient}
        onClose={handleClose}
      />
    </div>
  )
}
