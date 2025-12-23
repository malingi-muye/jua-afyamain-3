export interface Clinic {
  id: string
  name: string
  slug: string
  owner_id?: string
  email?: string
  phone?: string
  location?: string
  logo_url?: string
  country: string
  currency: string
  timezone: string
  plan: "free" | "pro" | "enterprise"
  plan_seats: number
  status: "active" | "suspended" | "pending" | "cancelled"
  trial_ends_at?: string
  settings?: Record<string, any>
  metadata?: Record<string, any>
  created_at: string
  updated_at: string
}

export interface User {
  id: string
  clinic_id?: string
  email: string
  full_name: string
  phone?: string
  avatar_url?: string
  role: "super_admin" | "admin" | "doctor" | "nurse" | "receptionist" | "lab_tech" | "pharmacist" | "accountant"
  department?: string
  license_number?: string
  specialization?: string
  status: "active" | "invited" | "suspended" | "deactivated"
  last_login_at?: string
  last_active_at?: string
  preferences?: Record<string, any>
  created_at: string
  updated_at: string
}

export interface Patient {
  id: string
  clinic_id: string
  mrn: string
  email?: string
  full_name: string
  date_of_birth?: string
  phone_number?: string
  gender?: string
  blood_type?: string
  allergies?: string[]
  chronic_conditions?: string[]
  next_of_kin_name?: string
  next_of_kin_phone?: string
  insurance_provider?: string
  insurance_number?: string
  created_at: string
  updated_at: string
}

export interface Appointment {
  id: string
  clinic_id: string
  doctor_id: string
  patient_id: string
  appointment_date: string
  duration_minutes: number
  status: "scheduled" | "completed" | "cancelled" | "no-show"
  reason?: string
  notes?: string
  created_at: string
  updated_at: string
}

export interface Visit {
  id: string
  clinic_id: string
  patient_id: string
  doctor_id?: string
  queue_number?: number
  stage: string
  stage_start_time?: string
  priority: "normal" | "urgent" | "emergency"
  vital_signs?: Record<string, any>
  chief_complaint?: string
  diagnosis?: string
  doctor_notes?: string
  lab_orders?: any[]
  prescription?: any[]
  consultation_fee: number
  total_bill: number
  payment_status: "pending" | "paid"
  created_at: string
  updated_at: string
}

export interface InventoryItem {
  id: string
  clinic_id: string
  sku: string
  name: string
  category: "Medicine" | "Supply" | "Lab" | "Equipment"
  quantity_in_stock: number
  reorder_level: number
  unit: string
  price: number
  supplier_id?: string
  batch_number?: string
  expiry_date?: string
  created_at: string
  updated_at: string
}
