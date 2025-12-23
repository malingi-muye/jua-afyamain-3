import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { db } from "../services/db"
import type { Appointment } from "../types"
import useStore from "../store"

// Query keys
export const appointmentKeys = {
    all: ["appointments"] as const,
    byDate: (date: string) => [...appointmentKeys.all, "date", date] as const,
    detail: (id: string) => [...appointmentKeys.all, id] as const,
}

// Fetch all appointments
export function useAppointments() {
    const { isDemoMode, appointments: mockAppointments } = useStore()

    return useQuery({
        queryKey: appointmentKeys.all,
        queryFn: async () => {
            if (isDemoMode) {
                return mockAppointments
            }
            return db.getAppointments()
        },
        staleTime: 1000 * 60 * 5, // 5 minutes
    })
}

// Create appointment mutation
export function useCreateAppointment() {
    const queryClient = useQueryClient()
    const { isDemoMode, actions } = useStore()

    return useMutation({
        mutationFn: async (appointment: Appointment) => {
            if (isDemoMode) {
                return appointment
            }
            return db.createAppointment(appointment)
        },
        onSuccess: (newAppt) => {
            queryClient.invalidateQueries({ queryKey: appointmentKeys.all })
            actions.showToast(`Appointment scheduled for ${newAppt.patientName}.`)
        },
        onError: () => {
            actions.showToast("Error scheduling appointment", "error")
        },
    })
}

// Update appointment mutation
export function useUpdateAppointment() {
    const queryClient = useQueryClient()
    const { isDemoMode, actions } = useStore()

    return useMutation({
        mutationFn: async (appointment: Appointment) => {
            if (!isDemoMode) {
                await db.updateAppointment(appointment)
            }
            return appointment
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: appointmentKeys.all })
        },
        onError: () => {
            actions.showToast("Error updating appointment", "error")
        },
    })
}
