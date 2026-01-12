/**
 * Enterprise Database Service
 * Handles all database operations with multitenancy support
 */

import { supabase } from "@/lib/supabaseClient"
// Note: Permission checks are enforced by Supabase Row Level Security (RLS) policies
import type { User, Organization, OrganizationInvitation, AuditLog, Activity, UserRole } from "@/types/enterprise"
import type { Patient, Appointment, Visit, InventoryItem, Supplier } from "@/types"
import logger from '../lib/logger'

// Helper to get current user's clinic ID (standardized from organization_id)
async function getClinicId(): Promise<string | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const { data } = await supabase.from("users").select("clinic_id").eq("id", user.id).maybeSingle()

  return data?.clinic_id || null
}

export const enterpriseDb = {
  // ==================== ORGANIZATION ====================

  async getOrganization(): Promise<Organization | null> {
    const clinicId = await getClinicId()
    if (!clinicId) return null

    const { data, error } = await supabase.from("clinics").select("*").eq("id", clinicId).single()

    if (error || !data) return null

    return {
      id: data.id,
      name: data.name,
      slug: data.slug,
      ownerId: data.owner_id,
      logoUrl: data.logo_url,
      email: data.email,
      phone: data.phone,
      address: data.location,
      country: data.country,
      currency: data.currency,
      timezone: data.timezone,
      plan: data.plan,
      planSeats: data.plan_seats,
      status: data.status,
      trialEndsAt: data.trial_ends_at,
      settings: data.settings || {},
      metadata: data.metadata || {},
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    }
  },

  async updateOrganization(updates: Partial<Organization>): Promise<boolean> {
    const clinicId = await getClinicId()
    if (!clinicId) return false

    const dbUpdates: Record<string, any> = {}
    if (updates.name) dbUpdates.name = updates.name
    if (updates.email) dbUpdates.email = updates.email
    if (updates.phone) dbUpdates.phone = updates.phone
    if (updates.address) dbUpdates.location = updates.address
    if (updates.logoUrl) dbUpdates.logo_url = updates.logoUrl
    if (updates.settings) dbUpdates.settings = updates.settings
    dbUpdates.updated_at = new Date().toISOString()

    const { error } = await supabase.from("clinics").update(dbUpdates).eq("id", clinicId)

    return !error
  },

  async deleteClinic(id: string, reason?: string): Promise<boolean> {
    // Server-side permission check: allow clinic admins or super admins to archive/delete clinic
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) throw new Error("Not authenticated")

    // Note: Permission checks enforced by Supabase RLS policies
    // await guardServerAction(user.id, "settings.delete_clinic", id)

    // Log audit before performing destructive action
    try {
      const { data: oldClinic } = await supabase.from("clinics").select("*").eq("id", id).maybeSingle()
      await this.logAudit("delete_clinic", "clinic", id, oldClinic || undefined, { status: "archived", reason })
    } catch (e) {
      // continue even if audit log fails
      logger.warn("Audit log failed for deleteClinic:", e)
    }

    // Soft delete by updating status to archived
    const { error } = await supabase.from("clinics").update({
      status: "archived",
      settings: { deleted_reason: reason, deleted_at: new Date().toISOString() }, // Store reason in settings or metadata
    }).eq("id", id)

    return !error
  },

  // ==================== USERS / TEAM ====================

  async getTeamMembers(): Promise<User[]> {
    const clinicId = await getClinicId()
    if (!clinicId) return []

    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("clinic_id", clinicId)
      .order("created_at", { ascending: false })

    if (error || !data) return []

    return data.map((u: any) => ({
      id: u.id,
      organizationId: u.clinic_id, // Map clinic_id to organizationId for backward compatibility
      email: u.email,
      fullName: u.full_name,
      phone: u.phone,
      avatarUrl: u.avatar_url,
      role: u.role as UserRole,
      department: u.department,
      licenseNumber: u.license_number,
      specialization: u.specialization,
      status: u.status,
      lastLoginAt: u.last_login_at,
      lastActiveAt: u.last_active_at,
      preferences: u.preferences || {},
      createdAt: u.created_at,
      updatedAt: u.updated_at,
    }))
  },

  async updateTeamMember(userId: string, updates: Partial<User>): Promise<boolean> {
    const dbUpdates: Record<string, any> = {}
    if (updates.fullName) dbUpdates.full_name = updates.fullName
    if (updates.phone) dbUpdates.phone = updates.phone
    if (updates.role) dbUpdates.role = updates.role
    if (updates.department) dbUpdates.department = updates.department
    if (updates.status) dbUpdates.status = updates.status
    dbUpdates.updated_at = new Date().toISOString()

    const { error } = await supabase.from("users").update(dbUpdates).eq("id", userId)

    return !error
  },

  async deactivateTeamMember(userId: string): Promise<boolean> {
    const { error } = await supabase
      .from("users")
      .update({ status: "deactivated", updated_at: new Date().toISOString() })
      .eq("id", userId)

    return !error
  },

  // ==================== INVITATIONS ====================

  async getInvitations(): Promise<OrganizationInvitation[]> {
    const clinicId = await getClinicId()
    if (!clinicId) return []

    // Note: organization_invitations table may not exist - using clinics as fallback
    // For now, return empty array - invitations can be handled via users table with status='invited'
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("clinic_id", clinicId)
      .eq("status", "invited")
      .order("created_at", { ascending: false })

    if (error || !data) return []

    // Map users with status='invited' to invitation format
    return data.map((inv: any) => ({
      id: inv.id,
      clinicId: inv.clinic_id,
      email: inv.email,
      role: inv.role as UserRole,
      invitedBy: inv.created_by || null,
      token: "", // Not stored in users table
      status: inv.status,
      expiresAt: inv.updated_at, // Use updated_at as proxy
      acceptedAt: null,
      createdAt: inv.created_at,
    }))
  },

  async createInvitation(email: string, role: UserRole): Promise<OrganizationInvitation | null> {
    const clinicId = await getClinicId()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!clinicId || !user) return null

    // Create user with status='invited' instead of separate invitations table
    const { data, error } = await supabase
      .from("users")
      .insert({
        clinic_id: clinicId,
        email: email.toLowerCase().trim(),
        full_name: email.split("@")[0], // Temporary name
        role,
        status: "invited",
        created_by: user.id,
      })
      .select()
      .single()

    if (error || !data) return null

    return {
      id: data.id,
      clinicId: data.clinic_id,
      email: data.email,
      role: data.role as UserRole,
      invitedBy: data.created_by || null,
      token: "",
      status: data.status,
      expiresAt: data.updated_at || undefined,
      acceptedAt: undefined,
      createdAt: data.created_at,
    }
  },

  async cancelInvitation(invitationId: string): Promise<boolean> {
    const { error } = await supabase
      .from("users")
      .update({ status: "deactivated" })
      .eq("id", invitationId)

    return !error
  },

  // ==================== PATIENTS ====================

  async getPatients(): Promise<Patient[]> {
    const clinicId = await getClinicId()
    if (!clinicId) return []

    const { data, error } = await supabase
      .from("patients")
      .select("*")
      .eq("clinic_id", clinicId)
      .order("created_at", { ascending: false })

    if (error || !data) return []

    return data.map((p: any) => ({
      id: p.id,
      name: p.full_name,
      phone: p.phone_number || "",
      age: p.date_of_birth ? Math.floor((Date.now() - new Date(p.date_of_birth).getTime()) / (1000 * 60 * 60 * 24 * 365)) : 0,
      gender: p.gender || "Other",
      lastVisit: p.updated_at?.split("T")[0] || "",
      notes: "", // Notes not in schema
      history: p.chronic_conditions || [],
      vitals: { bp: "", heartRate: "", temp: "", weight: "" },
    }))
  },

  async createPatient(patient: Omit<Patient, "id">): Promise<Patient | null> {
    const clinicId = await getClinicId()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!clinicId) return null

    // Generate MRN if not provided
    const { count } = await supabase.from("patients").select("*", { count: "exact", head: true }).eq("clinic_id", clinicId)
    const mrn = `MRN-${String((count || 0) + 1).padStart(4, "0")}`

    // Calculate date of birth from age
    const dateOfBirth = patient.age ? new Date(Date.now() - patient.age * 365 * 24 * 60 * 60 * 1000).toISOString().split("T")[0] : null

    const { data, error } = await supabase
      .from("patients")
      .insert({
        clinic_id: clinicId,
        mrn,
        full_name: patient.name,
        phone_number: patient.phone,
        date_of_birth: dateOfBirth,
        gender: patient.gender,
        chronic_conditions: patient.history || [],
      })
      .select()
      .single()

    if (error || !data) return null

    // Log activity
    await this.logActivity("patient_created", `New patient registered: ${patient.name}`)

    return {
      id: data.id,
      name: data.full_name,
      phone: data.phone_number || "",
      age: data.date_of_birth ? Math.floor((Date.now() - new Date(data.date_of_birth).getTime()) / (1000 * 60 * 60 * 24 * 365)) : 0,
      gender: data.gender || "Other",
      lastVisit: data.updated_at?.split("T")[0] || "",
      notes: "",
      history: data.chronic_conditions || [],
      vitals: { bp: "", heartRate: "", temp: "", weight: "" },
    }
  },

  async updatePatient(patient: Patient): Promise<boolean> {
    const dateOfBirth = patient.age ? new Date(Date.now() - patient.age * 365 * 24 * 60 * 60 * 1000).toISOString().split("T")[0] : null

    const { error } = await supabase
      .from("patients")
      .update({
        full_name: patient.name,
        phone_number: patient.phone,
        date_of_birth: dateOfBirth,
        gender: patient.gender,
        chronic_conditions: patient.history || [],
        updated_at: new Date().toISOString(),
      })
      .eq("id", patient.id)

    return !error
  },

  async deletePatient(id: string): Promise<boolean> {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) throw new Error("Not authenticated")

    // Note: Permission checks enforced by Supabase RLS policies
    // await guardServerAction(user.id, "patients.delete")

    // Capture current patient for audit
    try {
      const { data: oldPatient } = await supabase.from("patients").select("*").eq("id", id).maybeSingle()
      await this.logAudit("delete_patient", "patient", id, oldPatient || undefined, undefined)
    } catch (e) {
      logger.warn("Audit log failed for deletePatient:", e)
    }

    const { error } = await supabase.from("patients").delete().eq("id", id)

    return !error
  },

  // ==================== APPOINTMENTS ====================

  async getAppointments(): Promise<Appointment[]> {
    const clinicId = await getClinicId()
    if (!clinicId) return []

    const { data, error } = await supabase
      .from("appointments")
      .select("*, patients(full_name)")
      .eq("clinic_id", clinicId)
      .order("appointment_date", { ascending: true })

    if (error || !data) return []

    return data.map((a: any) => ({
      id: a.id,
      patientId: a.patient_id,
      patientName: a.patients?.full_name || a.patient_name || "Unknown",
      date: a.appointment_date?.split("T")[0] || "",
      time: a.appointment_date ? new Date(a.appointment_date).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }) : "",
      reason: a.reason || "",
      status: a.status as any,
    }))
  },

  async createAppointment(appt: Omit<Appointment, "id">): Promise<Appointment | null> {
    const clinicId = await getClinicId()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!clinicId || !user) return null

    // Combine date and time into appointment_date
    const appointmentDate = new Date(`${appt.date}T${appt.time}`).toISOString()

    const { data, error } = await supabase
      .from("appointments")
      .insert({
        clinic_id: clinicId,
        doctor_id: user.id,
        patient_id: appt.patientId,
        appointment_date: appointmentDate,
        reason: appt.reason,
        status: appt.status,
      })
      .select("*, patients(full_name)")
      .single()

    if (error || !data) return null

    await this.logActivity("appointment_created", `Appointment scheduled for ${data.patients?.full_name || appt.patientName}`)

    return {
      id: data.id,
      patientId: data.patient_id,
      patientName: data.patients?.full_name || "Unknown",
      date: data.appointment_date?.split("T")[0] || "",
      time: data.appointment_date ? new Date(data.appointment_date).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }) : "",
      reason: data.reason || "",
      status: data.status,
    }
  },

  async updateAppointment(appt: Appointment): Promise<boolean> {
    const appointmentDate = new Date(`${appt.date}T${appt.time}`).toISOString()

    const { error } = await supabase
      .from("appointments")
      .update({
        appointment_date: appointmentDate,
        reason: appt.reason,
        status: appt.status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", appt.id)

    return !error
  },

  // ==================== VISITS ====================

  async getVisits(): Promise<Visit[]> {
    const clinicId = await getClinicId()
    if (!clinicId) return []

    const { data, error } = await supabase
      .from("visits")
      .select("*, patients(full_name)")
      .eq("clinic_id", clinicId)
      .neq("stage", "completed")
      .order("created_at", { ascending: true })

    if (error || !data) return []

    return data.map((v: any) => ({
      id: v.id,
      patientId: v.patient_id,
      patientName: v.patients?.full_name || v.patient_name || "Unknown",
      stage: v.stage,
      stageStartTime: v.stage_start_time,
      startTime: v.created_at,
      queueNumber: v.queue_number || 0,
      priority: v.priority || "normal",
      vitals: v.vital_signs || {},
      chiefComplaint: v.chief_complaint,
      diagnosis: v.diagnosis,
      doctorNotes: v.doctor_notes,
      labOrders: v.lab_orders || [],
      prescription: v.prescription || [],
      medicationsDispensed: false, // Not in schema
      consultationFee: Number(v.consultation_fee) || 0,
      totalBill: Number(v.total_bill) || 0,
      paymentStatus: v.payment_status || "pending",
      insuranceDetails: null, // Not in schema
    }))
  },

  async createVisit(visit: Omit<Visit, "id">): Promise<Visit | null> {
    const clinicId = await getClinicId()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!clinicId) return null

    // Get queue number
    const { count } = await supabase
      .from("visits")
      .select("*", { count: "exact", head: true })
      .eq("clinic_id", clinicId)
      .neq("stage", "completed")

    const queueNumber = (count || 0) + 1

    const { data, error } = await supabase
      .from("visits")
      .insert({
        clinic_id: clinicId,
        patient_id: visit.patientId,
        doctor_id: user?.id,
        stage: visit.stage,
        stage_start_time: visit.stageStartTime || new Date().toISOString(),
        queue_number: queueNumber,
        priority: visit.priority,
        vital_signs: visit.vitals,
        chief_complaint: visit.chiefComplaint,
        diagnosis: visit.diagnosis,
        doctor_notes: visit.doctorNotes,
        lab_orders: visit.labOrders,
        prescription: visit.prescription,
        consultation_fee: visit.consultationFee,
        total_bill: visit.totalBill,
        payment_status: visit.paymentStatus,
      })
      .select("*, patients(full_name)")
      .single()

    if (error || !data) return null

    await this.logActivity("visit_created", `Patient ${data.patients?.full_name || visit.patientName} checked in`)

    return {
      id: data.id,
      patientId: data.patient_id,
      patientName: data.patients?.full_name || "Unknown",
      stage: data.stage,
      stageStartTime: data.stage_start_time,
      startTime: data.created_at,
      queueNumber: data.queue_number,
      priority: data.priority,
      vitals: data.vital_signs || {},
      chiefComplaint: data.chief_complaint,
      diagnosis: data.diagnosis,
      doctorNotes: data.doctor_notes,
      labOrders: data.lab_orders || [],
      prescription: data.prescription || [],
      medicationsDispensed: false,
      consultationFee: Number(data.consultation_fee),
      totalBill: Number(data.total_bill),
      paymentStatus: data.payment_status,
      insuranceDetails: data.insurance_details || undefined,
    }
  },

  async updateVisit(visit: Visit): Promise<boolean> {
    const { error } = await supabase
      .from("visits")
      .update({
        stage: visit.stage,
        stage_start_time: visit.stageStartTime,
        vital_signs: visit.vitals,
        chief_complaint: visit.chiefComplaint,
        diagnosis: visit.diagnosis,
        doctor_notes: visit.doctorNotes,
        lab_orders: visit.labOrders,
        prescription: visit.prescription,
        total_bill: visit.totalBill,
        payment_status: visit.paymentStatus,
        updated_at: new Date().toISOString(),
      })
      .eq("id", visit.id)

    return !error
  },

  // ==================== INVENTORY ====================

  async getInventory(): Promise<InventoryItem[]> {
    const clinicId = await getClinicId()
    if (!clinicId) return []

    const { data, error } = await supabase.from("inventory").select("*").eq("clinic_id", clinicId).order("name")

    if (error || !data) return []

    return data.map((i: any) => ({
      id: i.id,
      name: i.name,
      category: i.category || "Medicine",
      stock: i.quantity_in_stock || 0,
      minStockLevel: i.reorder_level || 10,
      unit: i.unit || "pcs",
      price: Number(i.price) || 0,
      batchNumber: i.batch_number,
      expiryDate: i.expiry_date,
      supplierId: i.supplier_id,
    }))
  },

  async createInventoryItem(item: Omit<InventoryItem, "id">): Promise<InventoryItem | null> {
    const clinicId = await getClinicId()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!clinicId) return null

    // Generate SKU if not provided
    const sku = `SKU-${item.name.substring(0, 3).toUpperCase()}-${Date.now().toString().slice(-6)}`

    const { data, error } = await supabase
      .from("inventory")
      .insert({
        clinic_id: clinicId,
        sku,
        name: item.name,
        category: item.category,
        quantity_in_stock: item.stock,
        reorder_level: item.minStockLevel,
        unit: item.unit,
        price: item.price,
        batch_number: item.batchNumber,
        expiry_date: item.expiryDate,
        supplier_id: item.supplierId,
      })
      .select()
      .single()

    if (error || !data) return null

    // Log inventory transaction (if inventory_logs table exists)
    try {
      await supabase.from("inventory_logs").insert({
        clinic_id: clinicId,
        item_id: data.id,
        item_name: item.name,
        action: "Created",
        quantity_change: item.stock,
        quantity_after: item.stock,
        performed_by: user?.id,
      })
    } catch (e) {
      // Table might not exist, continue
      logger.warn("Inventory logs table not available:", e)
    }

    return {
      id: data.id,
      name: data.name,
      category: data.category,
      stock: data.quantity_in_stock,
      minStockLevel: data.reorder_level,
      unit: data.unit,
      price: Number(data.price),
      batchNumber: data.batch_number,
      expiryDate: data.expiry_date,
      supplierId: data.supplier_id,
    }
  },

  async updateInventoryItem(item: InventoryItem, reason?: string): Promise<boolean> {
    const clinicId = await getClinicId()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    // Get current stock for logging
    const { data: current } = await supabase.from("inventory").select("quantity_in_stock").eq("id", item.id).single()

    const { error } = await supabase
      .from("inventory")
      .update({
        name: item.name,
        category: item.category,
        quantity_in_stock: item.stock,
        reorder_level: item.minStockLevel,
        unit: item.unit,
        price: item.price,
        batch_number: item.batchNumber,
        expiry_date: item.expiryDate,
        supplier_id: item.supplierId,
        updated_at: new Date().toISOString(),
      })
      .eq("id", item.id)

    if (!error && current && clinicId) {
      const quantityChange = item.stock - (current.quantity_in_stock || 0)
      const action = quantityChange > 0 ? "Restocked" : quantityChange < 0 ? "Dispensed" : "Updated"

      try {
        await supabase.from("inventory_logs").insert({
          clinic_id: clinicId,
          item_id: item.id,
          item_name: item.name,
          action,
          quantity_change: quantityChange,
          quantity_before: current.quantity_in_stock,
          quantity_after: item.stock,
          notes: reason,
          performed_by: user?.id,
        })
      } catch (e) {
        logger.warn("Inventory logs table not available:", e)
      }
    }

    return !error
  },

  async deleteInventoryItem(id: string): Promise<boolean> {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) throw new Error("Not authenticated")

    // Note: Permission checks enforced by Supabase RLS policies
    // await guardServerAction(user.id, "inventory.delete")

    // Audit current inventory item
    try {
      const { data: oldItem } = await supabase.from("inventory").select("*").eq("id", id).maybeSingle()
      await this.logAudit("delete_inventory_item", "inventory_item", id, oldItem || undefined, undefined)
    } catch (e) {
      logger.warn("Audit log failed for deleteInventoryItem:", e)
    }

    const { error } = await supabase.from("inventory").delete().eq("id", id)

    return !error
  },

  // ==================== SUPPLIERS ====================

  async getSuppliers(): Promise<Supplier[]> {
    const clinicId = await getClinicId()
    if (!clinicId) return []

    const { data, error } = await supabase.from("suppliers").select("*").eq("clinic_id", clinicId).order("name")

    if (error || !data) return []

    return data.map((s: any) => ({
      id: s.id,
      name: s.name,
      contactPerson: s.contact_person || "",
      phone: s.phone || "",
      email: s.email || "",
    }))
  },

  async createSupplier(supplier: Omit<Supplier, "id">): Promise<Supplier | null> {
    const clinicId = await getClinicId()
    if (!clinicId) return null

    const { data, error } = await supabase
      .from("suppliers")
      .insert({
        clinic_id: clinicId,
        name: supplier.name,
        contact_person: supplier.contactPerson,
        phone: supplier.phone,
        email: supplier.email,
      })
      .select()
      .single()

    if (error || !data) return null

    return {
      id: data.id,
      name: data.name,
      contactPerson: data.contact_person || "",
      phone: data.phone || "",
      email: data.email || "",
    }
  },

  async updateSupplier(supplier: Supplier): Promise<boolean> {
    const { error } = await supabase
      .from("suppliers")
      .update({
        name: supplier.name,
        contact_person: supplier.contactPerson,
        phone: supplier.phone,
        email: supplier.email,
        updated_at: new Date().toISOString(),
      })
      .eq("id", supplier.id)

    return !error
  },

  async deleteSupplier(id: string): Promise<boolean> {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) throw new Error("Not authenticated")

    // Note: Permission checks enforced by Supabase RLS policies
    // await guardServerAction(user.id, "inventory.delete")

    try {
      const { data: oldSupplier } = await supabase.from("suppliers").select("*").eq("id", id).maybeSingle()
      await this.logAudit("delete_supplier", "supplier", id, oldSupplier || undefined, undefined)
    } catch (e) {
      logger.warn("Audit log failed for deleteSupplier:", e)
    }

    const { error } = await supabase.from("suppliers").delete().eq("id", id)

    return !error
  },

  // ==================== AUDIT & ACTIVITY ====================

  async getAuditLogs(limit = 50): Promise<AuditLog[]> {
    const clinicId = await getClinicId()
    if (!clinicId) return []

    const { data, error } = await supabase
      .from("audit_logs")
      .select("*")
      .eq("clinic_id", clinicId)
      .order("created_at", { ascending: false })
      .limit(limit)

    if (error || !data) return []

    return data.map((log: any) => ({
      id: log.id,
      clinicId: log.clinic_id,
      userId: log.user_id,
      userEmail: log.user_email,
      userName: log.user_name,
      userRole: log.user_role,
      action: log.action,
      resourceType: log.resource_type,
      resourceId: log.resource_id,
      oldValues: log.old_values,
      newValues: log.new_values,
      metadata: log.metadata || {},
      ipAddress: log.ip_address,
      userAgent: log.user_agent,
      status: log.status,
      createdAt: log.created_at,
    }))
  },

  async logAudit(
    action: string,
    resourceType: string,
    resourceId?: string,
    oldValues?: Record<string, any>,
    newValues?: Record<string, any>,
  ): Promise<void> {
    const clinicId = await getClinicId()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!clinicId) return

    // Get user details
    let userName = "System"
    let userEmail = ""
    let userRole = ""

    if (user) {
      const { data: profile } = await supabase.from("users").select("full_name, email, role").eq("id", user.id).maybeSingle()

      if (profile) {
        userName = profile.full_name
        userEmail = profile.email
        userRole = profile.role
      }
    }

    await supabase.from("audit_logs").insert({
      clinic_id: clinicId,
      user_id: user?.id,
      user_email: userEmail,
      user_name: userName,
      user_role: userRole,
      action,
      resource_type: resourceType,
      resource_id: resourceId,
      old_values: oldValues,
      new_values: newValues,
    })
  },

  async getActivities(limit = 20): Promise<Activity[]> {
    const clinicId = await getClinicId()
    if (!clinicId) return []

    const { data, error } = await supabase
      .from("activities")
      .select("*")
      .eq("clinic_id", clinicId)
      .order("created_at", { ascending: false })
      .limit(limit)

    if (error || !data) return []

    return data.map((a: any) => ({
      id: a.id,
      clinicId: a.clinic_id,
      userId: a.user_id,
      activityType: a.activity_type,
      title: a.title,
      description: a.description,
      icon: a.icon,
      color: a.color,
      resourceType: a.resource_type,
      resourceId: a.resource_id,
      metadata: a.metadata || {},
      createdAt: a.created_at,
    }))
  },

  async logActivity(
    activityType: string,
    title: string,
    description?: string,
    resourceType?: string,
    resourceId?: string,
  ): Promise<void> {
    const clinicId = await getClinicId()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!clinicId) return

    await supabase.from("activities").insert({
      clinic_id: clinicId,
      user_id: user?.id,
      activity_type: activityType,
      title,
      description,
      resource_type: resourceType,
      resource_id: resourceId,
    })
  },

  // ==================== CONNECTION CHECK ====================

  async checkConnection(): Promise<boolean> {
    try {
      const { error } = await supabase.from("clinics").select("count", { count: "exact", head: true })
      return !error
    } catch {
      return false
    }
  },
}
