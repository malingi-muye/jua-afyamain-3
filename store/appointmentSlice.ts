import type { StateCreator } from "zustand"
import type { Appointment } from "../types"
import { db } from "../services/db"

export interface AppointmentSlice {
    appointments: Appointment[]
    actions: {
        setAppointments: (appointments: Appointment[]) => void
        addAppointment: (appointment: Appointment) => Promise<void>
        updateAppointment: (appointment: Appointment) => Promise<void>
    }
}

export const createAppointmentSlice: StateCreator<
    AppointmentSlice & { isDemoMode: boolean; actions: { showToast: (msg: string, type?: "success" | "error" | "info") => void } },
    [],
    [],
    AppointmentSlice
> = (set, get) => ({
    appointments: [],
    actions: {
        setAppointments: (appointments) => set({ appointments }),
        addAppointment: async (newAppt) => {
            try {
                let createdAppt = newAppt
                if (!get().isDemoMode) {
                    const saved = await db.createAppointment(newAppt)
                    if (saved) createdAppt = saved
                }
                set((state) => ({ appointments: [...state.appointments, createdAppt] }))
                get().actions.showToast(`Appointment scheduled for ${createdAppt.patientName}.`)
            } catch (e) {
                get().actions.showToast("Error scheduling appointment", "error")
            }
        },
        updateAppointment: async (updatedAppt) => {
            try {
                if (!get().isDemoMode) await db.updateAppointment(updatedAppt)
                set((state) => ({
                    appointments: state.appointments.map((a) => (a.id === updatedAppt.id ? updatedAppt : a)),
                }))
            } catch (e) {
                get().actions.showToast("Error updating appointment", "error")
            }
        },
    },
})
