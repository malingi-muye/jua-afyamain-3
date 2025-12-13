/**
 * Enterprise Database Service
 * Handles all database operations with multitenancy support
 */

import { supabase } from "@/lib/supabaseClient"
import type { User, Organization, OrganizationInvitation, AuditLog, Activity, UserRole } from "@/types/enterprise"
import type { Patient, Appointment, Visit, InventoryItem, Supplier } from "@/types"

// Helper to get current user's organization ID
async function getOrganizationId(): Promise<string | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const { data } = await supabase.from("users").select("organization_id").eq("id", user.id).single()

  return data?.organization_id || null
}

export const enterpriseDb = {
  // ==================== ORGANIZATION ====================

  async getOrganization(): Promise<Organization | null> {
    const orgId = await getOrganizationId()
    if (!orgId) return null

    const { data, error } = await supabase.from("organizations").select("*").eq("id", orgId).single()

    if (error || !data) return null

    return {
      id: data.id,
      name: data.name,
      slug: data.slug,
      ownerId: data.owner_id,
      logoUrl: data.logo_url,
      email: data.email,
      phone: data.phone,
      address: data.address,
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
    const orgId = await getOrganizationId()
    if (!orgId) return false

    const dbUpdates: Record<string, any> = {}
    if (updates.name) dbUpdates.name = updates.name
    if (updates.email) dbUpdates.email = updates.email
    if (updates.phone) dbUpdates.phone = updates.phone
    if (updates.address) dbUpdates.address = updates.address
    if (updates.logoUrl) dbUpdates.logo_url = updates.logoUrl
    if (updates.settings) dbUpdates.settings = updates.settings
    dbUpdates.updated_at = new Date().toISOString()

    const { error } = await supabase.from("organizations").update(dbUpdates).eq("id", orgId)

    return !error
  },

  // ==================== USERS / TEAM ====================

  async getTeamMembers(): Promise<User[]> {
    const orgId = await getOrganizationId()
    if (!orgId) return []

    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("organization_id", orgId)
      .order("created_at", { ascending: false })

    if (error || !data) return []

    return data.map((u) => ({
      id: u.id,
      organizationId: u.organization_id,
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
    const orgId = await getOrganizationId()
    if (!orgId) return []

    const { data, error } = await supabase
      .from("organization_invitations")
      .select("*")
      .eq("organization_id", orgId)
      .order("created_at", { ascending: false })

    if (error || !data) return []

    return data.map((inv) => ({
      id: inv.id,
      organizationId: inv.organization_id,
      email: inv.email,
      role: inv.role as UserRole,
      invitedBy: inv.invited_by,
      token: inv.token,
      status: inv.status,
      expiresAt: inv.expires_at,
      acceptedAt: inv.accepted_at,
      createdAt: inv.created_at,
    }))
  },

  async createInvitation(email: string, role: UserRole): Promise<OrganizationInvitation | null> {
    const orgId = await getOrganizationId()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!orgId || !user) return null

    const { data, error } = await supabase
      .from("organization_invitations")
      .insert({
        organization_id: orgId,
        email: email.toLowerCase().trim(),
        role,
        invited_by: user.id,
      })
      .select()
      .single()

    if (error || !data) return null

    return {
      id: data.id,
      organizationId: data.organization_id,
      email: data.email,
      role: data.role as UserRole,
      invitedBy: data.invited_by,
      token: data.token,
      status: data.status,
      expiresAt: data.expires_at,
      acceptedAt: data.accepted_at,
      createdAt: data.created_at,
    }
  },

  async cancelInvitation(invitationId: string): Promise<boolean> {
    const { error } = await supabase
      .from("organization_invitations")
      .update({ status: "cancelled" })
      .eq("id", invitationId)

    return !error
  },

  // ==================== PATIENTS ====================

  async getPatients(): Promise<Patient[]> {
    const orgId = await getOrganizationId()
    if (!orgId) return []

    const { data, error } = await supabase
      .from("patients")
      .select("*")
      .eq("organization_id", orgId)
      .order("created_at", { ascending: false })

    if (error || !data) return []

    return data.map((p) => ({
      id: p.id,
      name: p.full_name,
      phone: p.phone || "",
      age: p.age || 0,
      gender: p.gender || "Other",
      lastVisit: p.last_visit_at?.split("T")[0] || "",
      notes: p.notes || "",
      history: p.medical_history || [],
      vitals: p.vitals || {},
    }))
  },

  async createPatient(patient: Omit<Patient, "id">): Promise<Patient | null> {
    const orgId = await getOrganizationId()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!orgId) return null

    const { data, error } = await supabase
      .from("patients")
      .insert({
        organization_id: orgId,
        full_name: patient.name,
        phone: patient.phone,
        age: patient.age,
        gender: patient.gender,
        notes: patient.notes,
        vitals: patient.vitals,
        medical_history: patient.history,
        created_by: user?.id,
      })
      .select()
      .single()

    if (error || !data) return null

    // Log activity
    await this.logActivity("patient_created", `New patient registered: ${patient.name}`)

    return {
      id: data.id,
      name: data.full_name,
      phone: data.phone || "",
      age: data.age || 0,
      gender: data.gender || "Other",
      lastVisit: data.last_visit_at?.split("T")[0] || "",
      notes: data.notes || "",
      history: data.medical_history || [],
      vitals: data.vitals || {},
    }
  },

  async updatePatient(patient: Patient): Promise<boolean> {
    const { error } = await supabase
      .from("patients")
      .update({
        full_name: patient.name,
        phone: patient.phone,
        age: patient.age,
        gender: patient.gender,
        notes: patient.notes,
        vitals: patient.vitals,
        medical_history: patient.history,
        last_visit_at: patient.lastVisit ? new Date(patient.lastVisit).toISOString() : null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", patient.id)

    return !error
  },

  async deletePatient(id: string): Promise<boolean> {
    const { error } = await supabase.from("patients").delete().eq("id", id)

    return !error
  },

  // ==================== APPOINTMENTS ====================

  async getAppointments(): Promise<Appointment[]> {
    const orgId = await getOrganizationId()
    if (!orgId) return []

    const { data, error } = await supabase
      .from("appointments")
      .select("*")
      .eq("organization_id", orgId)
      .order("scheduled_date", { ascending: true })

    if (error || !data) return []

    return data.map((a) => ({
      id: a.id,
      patientId: a.patient_id,
      patientName: a.patient_name,
      date: a.scheduled_date,
      time: a.scheduled_time,
      reason: a.reason || "",
      status: a.status as any,
    }))
  },

  async createAppointment(appt: Omit<Appointment, "id">): Promise<Appointment | null> {
    const orgId = await getOrganizationId()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!orgId) return null

    const { data, error } = await supabase
      .from("appointments")
      .insert({
        organization_id: orgId,
        patient_id: appt.patientId,
        patient_name: appt.patientName,
        scheduled_date: appt.date,
        scheduled_time: appt.time,
        reason: appt.reason,
        status: appt.status,
        created_by: user?.id,
      })
      .select()
      .single()

    if (error || !data) return null

    await this.logActivity("appointment_created", `Appointment scheduled for ${appt.patientName}`)

    return {
      id: data.id,
      patientId: data.patient_id,
      patientName: data.patient_name,
      date: data.scheduled_date,
      time: data.scheduled_time,
      reason: data.reason || "",
      status: data.status,
    }
  },

  async updateAppointment(appt: Appointment): Promise<boolean> {
    const { error } = await supabase
      .from("appointments")
      .update({
        scheduled_date: appt.date,
        scheduled_time: appt.time,
        reason: appt.reason,
        status: appt.status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", appt.id)

    return !error
  },

  // ==================== VISITS ====================

  async getVisits(): Promise<Visit[]> {
    const orgId = await getOrganizationId()
    if (!orgId) return []

    const { data, error } = await supabase
      .from("visits")
      .select("*")
      .eq("organization_id", orgId)
      .neq("stage", "Completed")
      .order("start_time", { ascending: true })

    if (error || !data) return []

    return data.map((v) => ({
      id: v.id,
      patientId: v.patient_id,
      patientName: v.patient_name,
      stage: v.stage,
      stageStartTime: v.stage_start_time,
      startTime: v.start_time,
      queueNumber: v.queue_number || 0,
      priority: v.priority || "Normal",
      vitals: v.vitals || {},
      chiefComplaint: v.chief_complaint,
      diagnosis: v.diagnosis,
      doctorNotes: v.doctor_notes,
      labOrders: v.lab_orders || [],
      prescription: v.prescription || [],
      medicationsDispensed: v.medications_dispensed || false,
      consultationFee: Number(v.consultation_fee) || 0,
      totalBill: Number(v.total_bill) || 0,
      paymentStatus: v.payment_status || "Pending",
      insuranceDetails: v.insurance_details,
    }))
  },

  async createVisit(visit: Omit<Visit, "id">): Promise<Visit | null> {
    const orgId = await getOrganizationId()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!orgId) return null

    // Get queue number
    const { count } = await supabase
      .from("visits")
      .select("*", { count: "exact", head: true })
      .eq("organization_id", orgId)
      .neq("stage", "Completed")

    const queueNumber = (count || 0) + 1

    const { data, error } = await supabase
      .from("visits")
      .insert({
        organization_id: orgId,
        patient_id: visit.patientId,
        patient_name: visit.patientName,
        stage: visit.stage,
        stage_start_time: visit.stageStartTime,
        start_time: visit.startTime,
        queue_number: queueNumber,
        priority: visit.priority,
        vitals: visit.vitals,
        chief_complaint: visit.chiefComplaint,
        diagnosis: visit.diagnosis,
        doctor_notes: visit.doctorNotes,
        lab_orders: visit.labOrders,
        prescription: visit.prescription,
        medications_dispensed: visit.medicationsDispensed,
        consultation_fee: visit.consultationFee,
        total_bill: visit.totalBill,
        payment_status: visit.paymentStatus,
        insurance_details: visit.insuranceDetails,
      })
      .select()
      .single()

    if (error || !data) return null

    await this.logActivity("visit_created", `Patient ${visit.patientName} checked in`)

    return {
      id: data.id,
      patientId: data.patient_id,
      patientName: data.patient_name,
      stage: data.stage,
      stageStartTime: data.stage_start_time,
      startTime: data.start_time,
      queueNumber: data.queue_number,
      priority: data.priority,
      vitals: data.vitals || {},
      chiefComplaint: data.chief_complaint,
      diagnosis: data.diagnosis,
      doctorNotes: data.doctor_notes,
      labOrders: data.lab_orders || [],
      prescription: data.prescription || [],
      medicationsDispensed: data.medications_dispensed,
      consultationFee: Number(data.consultation_fee),
      totalBill: Number(data.total_bill),
      paymentStatus: data.payment_status,
      insuranceDetails: data.insurance_details,
    }
  },

  async updateVisit(visit: Visit): Promise<boolean> {
    const { error } = await supabase
      .from("visits")
      .update({
        stage: visit.stage,
        stage_start_time: visit.stageStartTime,
        vitals: visit.vitals,
        chief_complaint: visit.chiefComplaint,
        diagnosis: visit.diagnosis,
        doctor_notes: visit.doctorNotes,
        lab_orders: visit.labOrders,
        prescription: visit.prescription,
        medications_dispensed: visit.medicationsDispensed,
        total_bill: visit.totalBill,
        payment_status: visit.paymentStatus,
        updated_at: new Date().toISOString(),
      })
      .eq("id", visit.id)

    return !error
  },

  // ==================== INVENTORY ====================

  async getInventory(): Promise<InventoryItem[]> {
    const orgId = await getOrganizationId()
    if (!orgId) return []

    const { data, error } = await supabase.from("inventory").select("*").eq("organization_id", orgId).order("name")

    if (error || !data) return []

    return data.map((i) => ({
      id: i.id,
      name: i.name,
      category: i.category || "Medicine",
      stock: i.stock || 0,
      minStockLevel: i.min_stock_level || 10,
      unit: i.unit || "pcs",
      price: Number(i.price) || 0,
      batchNumber: i.batch_number,
      expiryDate: i.expiry_date,
      supplierId: i.supplier_id,
    }))
  },

  async createInventoryItem(item: Omit<InventoryItem, "id">): Promise<InventoryItem | null> {
    const orgId = await getOrganizationId()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!orgId) return null

    const { data, error } = await supabase
      .from("inventory")
      .insert({
        organization_id: orgId,
        name: item.name,
        category: item.category,
        stock: item.stock,
        min_stock_level: item.minStockLevel,
        unit: item.unit,
        price: item.price,
        batch_number: item.batchNumber,
        expiry_date: item.expiryDate,
        supplier_id: item.supplierId,
        created_by: user?.id,
      })
      .select()
      .single()

    if (error || !data) return null

    // Log inventory transaction
    await supabase.from("inventory_logs").insert({
      organization_id: orgId,
      item_id: data.id,
      item_name: item.name,
      action: "Created",
      quantity_change: item.stock,
      quantity_after: item.stock,
      performed_by: user?.id,
    })

    return {
      id: data.id,
      name: data.name,
      category: data.category,
      stock: data.stock,
      minStockLevel: data.min_stock_level,
      unit: data.unit,
      price: Number(data.price),
      batchNumber: data.batch_number,
      expiryDate: data.expiry_date,
      supplierId: data.supplier_id,
    }
  },

  async updateInventoryItem(item: InventoryItem, reason?: string): Promise<boolean> {
    const orgId = await getOrganizationId()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    // Get current stock for logging
    const { data: current } = await supabase.from("inventory").select("stock").eq("id", item.id).single()

    const { error } = await supabase
      .from("inventory")
      .update({
        name: item.name,
        category: item.category,
        stock: item.stock,
        min_stock_level: item.minStockLevel,
        unit: item.unit,
        price: item.price,
        batch_number: item.batchNumber,
        expiry_date: item.expiryDate,
        supplier_id: item.supplierId,
        updated_at: new Date().toISOString(),
      })
      .eq("id", item.id)

    if (!error && current && orgId) {
      const quantityChange = item.stock - (current.stock || 0)
      const action = quantityChange > 0 ? "Restocked" : quantityChange < 0 ? "Dispensed" : "Updated"

      await supabase.from("inventory_logs").insert({
        organization_id: orgId,
        item_id: item.id,
        item_name: item.name,
        action,
        quantity_change: quantityChange,
        quantity_before: current.stock,
        quantity_after: item.stock,
        notes: reason,
        performed_by: user?.id,
      })
    }

    return !error
  },

  async deleteInventoryItem(id: string): Promise<boolean> {
    const { error } = await supabase.from("inventory").delete().eq("id", id)

    return !error
  },

  // ==================== SUPPLIERS ====================

  async getSuppliers(): Promise<Supplier[]> {
    const orgId = await getOrganizationId()
    if (!orgId) return []

    const { data, error } = await supabase.from("suppliers").select("*").eq("organization_id", orgId).order("name")

    if (error || !data) return []

    return data.map((s) => ({
      id: s.id,
      name: s.name,
      contactPerson: s.contact_person || "",
      phone: s.phone || "",
      email: s.email || "",
    }))
  },

  async createSupplier(supplier: Omit<Supplier, "id">): Promise<Supplier | null> {
    const orgId = await getOrganizationId()
    if (!orgId) return null

    const { data, error } = await supabase
      .from("suppliers")
      .insert({
        organization_id: orgId,
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
    const { error } = await supabase.from("suppliers").delete().eq("id", id)

    return !error
  },

  // ==================== AUDIT & ACTIVITY ====================

  async getAuditLogs(limit = 50): Promise<AuditLog[]> {
    const orgId = await getOrganizationId()
    if (!orgId) return []

    const { data, error } = await supabase
      .from("audit_logs")
      .select("*")
      .eq("organization_id", orgId)
      .order("created_at", { ascending: false })
      .limit(limit)

    if (error || !data) return []

    return data.map((log) => ({
      id: log.id,
      organizationId: log.organization_id,
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
    const orgId = await getOrganizationId()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!orgId) return

    // Get user details
    let userName = "System"
    let userEmail = ""
    let userRole = ""

    if (user) {
      const { data: profile } = await supabase.from("users").select("full_name, email, role").eq("id", user.id).single()

      if (profile) {
        userName = profile.full_name
        userEmail = profile.email
        userRole = profile.role
      }
    }

    await supabase.from("audit_logs").insert({
      organization_id: orgId,
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
    const orgId = await getOrganizationId()
    if (!orgId) return []

    const { data, error } = await supabase
      .from("activities")
      .select("*")
      .eq("organization_id", orgId)
      .order("created_at", { ascending: false })
      .limit(limit)

    if (error || !data) return []

    return data.map((a) => ({
      id: a.id,
      organizationId: a.organization_id,
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
    const orgId = await getOrganizationId()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!orgId) return

    await supabase.from("activities").insert({
      organization_id: orgId,
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
      const { error } = await supabase.from("organizations").select("count", { count: "exact", head: true })
      return !error
    } catch {
      return false
    }
  },
}
