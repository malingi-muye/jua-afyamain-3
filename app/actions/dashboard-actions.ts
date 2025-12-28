'use server'

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { db } from '@/services/db'
import { Patient, Appointment, InventoryItem, Visit, Supplier } from '@/types'

// Audit logging helper
async function logAudit(
  action: string,
  entity: string,
  entityId: string,
  changes?: Record<string, any>,
  status: 'success' | 'failure' = 'success'
) {
  try {
    const cookieStore = cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              )
            } catch {
              // Ignore
            }
          },
        },
      }
    )

    const {
      data: { user },
    } = await supabase.auth.getUser()

    // Insert audit log
    await supabase.from('audit_logs').insert({
      user_id: user?.id,
      action,
      entity_type: entity,
      entity_id: entityId,
      changes,
      status,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Error logging audit:', error)
  }
}

// Patient actions
export async function createPatientAction(patient: Omit<Patient, 'id'>) {
  try {
    const newPatient = await db.createPatient({
      ...patient,
      id: `temp-${Date.now()}`,
    })
    await logAudit('CREATE', 'Patient', newPatient.id, patient)
    return { success: true, data: newPatient }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create patient'
    await logAudit('CREATE', 'Patient', 'unknown', patient, 'failure')
    return { success: false, error: message }
  }
}

export async function updatePatientAction(patient: Patient) {
  try {
    await db.updatePatient(patient)
    await logAudit('UPDATE', 'Patient', patient.id, patient)
    return { success: true }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update patient'
    await logAudit('UPDATE', 'Patient', patient.id, patient, 'failure')
    return { success: false, error: message }
  }
}

export async function deletePatientAction(patientId: string) {
  try {
    await db.deletePatient(patientId)
    await logAudit('DELETE', 'Patient', patientId)
    return { success: true }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to delete patient'
    await logAudit('DELETE', 'Patient', patientId, {}, 'failure')
    return { success: false, error: message }
  }
}

// Appointment actions
export async function createAppointmentAction(
  appointment: Omit<Appointment, 'id'>
) {
  try {
    const newAppointment = await db.createAppointment({
      ...appointment,
      id: `temp-${Date.now()}`,
    })
    await logAudit('CREATE', 'Appointment', newAppointment.id, appointment)
    return { success: true, data: newAppointment }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create appointment'
    await logAudit('CREATE', 'Appointment', 'unknown', appointment, 'failure')
    return { success: false, error: message }
  }
}

export async function updateAppointmentAction(appointment: Appointment) {
  try {
    await db.updateAppointment(appointment)
    await logAudit('UPDATE', 'Appointment', appointment.id, appointment)
    return { success: true }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update appointment'
    await logAudit('UPDATE', 'Appointment', appointment.id, appointment, 'failure')
    return { success: false, error: message }
  }
}

// Inventory actions
export async function createInventoryItemAction(
  item: Omit<InventoryItem, 'id'>
) {
  try {
    const newItem = await db.createInventoryItem({
      ...item,
      id: `temp-${Date.now()}`,
    })
    await logAudit('CREATE', 'InventoryItem', newItem.id, item)
    return { success: true, data: newItem }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create inventory item'
    await logAudit('CREATE', 'InventoryItem', 'unknown', item, 'failure')
    return { success: false, error: message }
  }
}

export async function updateInventoryItemAction(item: InventoryItem) {
  try {
    await db.updateInventoryItem(item)
    await logAudit('UPDATE', 'InventoryItem', item.id, item)
    return { success: true }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update inventory item'
    await logAudit('UPDATE', 'InventoryItem', item.id, item, 'failure')
    return { success: false, error: message }
  }
}

export async function deleteInventoryItemAction(itemId: string) {
  try {
    await db.deleteInventoryItem(itemId)
    await logAudit('DELETE', 'InventoryItem', itemId)
    return { success: true }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to delete inventory item'
    await logAudit('DELETE', 'InventoryItem', itemId, {}, 'failure')
    return { success: false, error: message }
  }
}

// Visit actions
export async function createVisitAction(visit: Omit<Visit, 'id'>) {
  try {
    const newVisit = await db.createVisit({
      ...visit,
      id: `temp-${Date.now()}`,
    })
    await logAudit('CREATE', 'Visit', newVisit.id, visit)
    return { success: true, data: newVisit }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create visit'
    await logAudit('CREATE', 'Visit', 'unknown', visit, 'failure')
    return { success: false, error: message }
  }
}

export async function updateVisitAction(visit: Visit) {
  try {
    await db.updateVisit(visit)
    await logAudit('UPDATE', 'Visit', visit.id, visit)
    return { success: true }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update visit'
    await logAudit('UPDATE', 'Visit', visit.id, visit, 'failure')
    return { success: false, error: message }
  }
}

// Supplier actions
export async function createSupplierAction(supplier: Omit<Supplier, 'id'>) {
  try {
    const newSupplier = await db.createSupplier({
      ...supplier,
      id: `temp-${Date.now()}`,
    })
    await logAudit('CREATE', 'Supplier', newSupplier.id, supplier)
    return { success: true, data: newSupplier }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create supplier'
    await logAudit('CREATE', 'Supplier', 'unknown', supplier, 'failure')
    return { success: false, error: message }
  }
}

export async function updateSupplierAction(supplier: Supplier) {
  try {
    await db.updateSupplier(supplier)
    await logAudit('UPDATE', 'Supplier', supplier.id, supplier)
    return { success: true }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update supplier'
    await logAudit('UPDATE', 'Supplier', supplier.id, supplier, 'failure')
    return { success: false, error: message }
  }
}

export async function deleteSupplierAction(supplierId: string) {
  try {
    await db.deleteSupplier(supplierId)
    await logAudit('DELETE', 'Supplier', supplierId)
    return { success: true }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to delete supplier'
    await logAudit('DELETE', 'Supplier', supplierId, {}, 'failure')
    return { success: false, error: message }
  }
}
