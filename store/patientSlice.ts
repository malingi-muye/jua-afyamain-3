import type { StateCreator } from "zustand"
import type { Patient } from "../types"
import { db } from "../services/db"

export interface PatientSlice {
    patients: Patient[]
    actions: {
        addPatient: (patient: Patient) => Promise<void>
        updatePatient: (patient: Patient) => Promise<void>
        deletePatient: (id: string) => Promise<void>
        setPatients: (patients: Patient[]) => void
    }
}

export const createPatientSlice: StateCreator<
    PatientSlice & { isDemoMode: boolean; actions: { showToast: (msg: string, type?: "success" | "error" | "info") => void } },
    [],
    [],
    PatientSlice
> = (set, get) => ({
    patients: [],
    actions: {
        setPatients: (patients) => set({ patients }),
        addPatient: async (patient) => {
            try {
                let newPatient = patient
                if (!get().isDemoMode) {
                    const saved = await db.createPatient(patient)
                    if (saved) newPatient = saved
                }
                set((state) => ({ patients: [newPatient, ...state.patients] }))
                get().actions.showToast(`Patient ${newPatient.name} added successfully!`)
            } catch (e) {
                get().actions.showToast("Error adding patient to database.", "error")
                if (get().isDemoMode) {
                    set((state) => ({ patients: [patient, ...state.patients] }))
                }
            }
        },
        updatePatient: async (updatedPatient) => {
            try {
                if (!get().isDemoMode) await db.updatePatient(updatedPatient)
                set((state) => ({
                    patients: state.patients.map((p) => (p.id === updatedPatient.id ? updatedPatient : p)),
                }))
                get().actions.showToast(`Patient record updated.`)
            } catch (e) {
                get().actions.showToast("Error updating patient", "error")
            }
        },
        deletePatient: async (id) => {
            try {
                if (!get().isDemoMode) await db.deletePatient(id)
                set((state) => ({ patients: state.patients.filter((p) => p.id !== id) }))
                get().actions.showToast(`Patient deleted.`, "info")
            } catch (e) {
                get().actions.showToast("Error deleting patient", "error")
            }
        },
    },
})
