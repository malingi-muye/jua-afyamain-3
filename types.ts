export enum Gender {
  Male = "Male",
  Female = "Female",
  Other = "Other",
}

export interface Patient {
  id: string
  name: string
  phone: string
  age: number
  gender: Gender
  lastVisit: string
  notes: string
  history: string[] // Array of past visit summaries
  vitals?: {
    bp: string
    heartRate: string
    temp: string
    weight: string
  }
}

export interface Appointment {
  id: string
  patientId: string
  patientName: string
  date: string
  time: string
  reason: string
  status: "Scheduled" | "Completed" | "Cancelled"
}

export interface Supplier {
  id: string
  name: string
  contactPerson: string
  phone: string
  email: string
}

export interface InventoryItem {
  id: string
  name: string
  stock: number
  minStockLevel: number // Reorder point
  unit: string
  category: "Medicine" | "Supply" | "Lab" | "Equipment"
  price: number
  batchNumber?: string
  expiryDate?: string
  supplierId?: string
}

export interface InventoryLog {
  id: string
  itemId: string
  itemName: string
  action: "Created" | "Updated" | "Restocked" | "Deleted" | "Dispensed"
  quantityChange?: number
  notes: string
  timestamp: string
  user: string
}

export interface ChatMessage {
  id: string
  role: "user" | "model"
  text: string
  timestamp: Date
}

export interface NotificationPreferences {
  appointmentReminders: boolean
  lowStockAlerts: boolean
  dailyReports: boolean
  marketingEmails: boolean
  alertEmail: string
}

export interface BillingInfo {
  plan: "Free" | "Pro" | "Enterprise"
  status: "Active" | "Past Due"
  nextBillingDate: string
  paymentMethod: {
    type: "Card" | "M-Pesa"
    last4: string // or phone number suffix
    brand: string
    expiry?: string
  }
}

export type Role =
  | "SuperAdmin"
  | "Admin"
  | "Doctor"
  | "Nurse"
  | "Receptionist"
  | "Lab Tech"
  | "Pharmacist"
  | "Accountant"

export interface TeamMember {
  id: string
  clinicId?: string
  name: string
  email: string
  phone?: string
  role: Role
  status: "Active" | "Invited" | "Deactivated"
  lastActive: string
  avatar?: string
}

export interface SmsConfig {
  apiKey: string
  senderId: string
  providerUrl?: string
}

export interface PaymentConfig {
  provider: "PayStack" | "None"
  apiKey: string
  secretKey: string
  webhookUrl?: string
  webhookSecret?: string
  testMode: boolean
  isConfigured: boolean
}

export interface ClinicSettings {
  name: string
  phone: string
  email: string
  logo?: string
  location: string
  currency: string
  language: string
  timezone: string
  smsEnabled: boolean // Legacy simplified toggle
  smsConfig: SmsConfig
  paymentConfig: PaymentConfig
  notifications: NotificationPreferences
  security: {
    twoFactorEnabled: boolean
    lastPasswordChange: string
  }
  billing: BillingInfo
  team: TeamMember[]
}

export interface Notification {
  id: string
  message: string
  type: "success" | "error" | "info"
}

// -- NEW: Patient Flow Types --

// Updated Workflow: Check-In -> Vitals (Optional) -> Consultation -> Lab -> Billing -> Pharmacy -> Clearance -> Completed
export type VisitStage =
  | "Check-In"
  | "Vitals"
  | "Consultation"
  | "Lab"
  | "Billing"
  | "Pharmacy"
  | "Clearance"
  | "Completed"
export type VisitPriority = "Normal" | "Urgent" | "Emergency"

export interface PrescriptionItem {
  inventoryId: string
  name: string
  dosage: string // e.g., "1x3 for 5 days"
  quantity: number
  price: number
}

export interface LabTestProfile {
  id: string
  name: string
  price: number
  category: "Hematology" | "Microbiology" | "Biochemistry" | "Radiology"
}

export interface LabOrder {
  id: string
  testId: string
  testName: string
  status: "Pending" | "Completed"
  result?: string
  notes?: string
  price: number
  orderedAt: string
  completedAt?: string
}

export interface Visit {
  id: string
  patientId: string
  patientName: string
  stage: VisitStage
  stageStartTime: string // ISO String to track wait times
  startTime: string // ISO String
  queueNumber: number
  priority: VisitPriority

  // Insurance
  insuranceDetails?: {
    provider: string
    memberNumber: string
  }

  // Vitals Data (formerly Triage)
  vitals?: {
    bp: string
    temp: string
    weight: string
    heartRate: string
    spo2?: string
  }

  // Doctor Data
  chiefComplaint?: string
  diagnosis?: string
  doctorNotes?: string

  // Orders
  labOrders: LabOrder[]
  prescription: PrescriptionItem[]
  medicationsDispensed: boolean

  // Billing Data
  consultationFee: number
  totalBill: number
  paymentStatus: "Pending" | "Paid"
}

// -- Super Admin Types --

export interface Clinic {
  id: string
  name: string
  ownerName: string
  email: string
  plan: "Free" | "Pro" | "Enterprise"
  status: "Active" | "Suspended" | "Pending"
  joinedDate: string
  lastPaymentDate: string
  nextPaymentDate: string
  revenueYTD: number
}

export interface ApprovalRequest {
  id: string
  type: "New Clinic" | "Refund" | "Plan Upgrade"
  clinicName: string
  requesterName: string
  date: string
  details: string
  status: "Pending" | "Approved" | "Rejected"
}

export interface SaaSTransaction {
  id: string
  clinicName: string
  amount: number
  date: string
  status: "Success" | "Failed" | "Pending"
  method: "Card" | "M-Pesa"
  plan: string
}

export interface SaaSPlatformSettings {
  maintenanceMode: boolean
  allowNewRegistrations: boolean
  globalAnnouncement: string
  pricing: {
    free: number
    pro: number
    enterprise: number
  }
}

export interface SystemLog {
  id: string
  action: string
  admin: string
  target: string
  timestamp: string
  status: "Success" | "Warning" | "Error"
}

export interface SupportTicket {
  id: string
  clinicName: string
  subject: string
  priority: "Low" | "Medium" | "High" | "Critical"
  status: "Open" | "In Progress" | "Resolved"
  dateCreated: string
  lastUpdate: string
}

export type ViewState =
  | "dashboard"
  | "reception" // Reception Dashboard
  | "triage" // Nurse Dashboard
  | "consultation" // Doctor Dashboard
  | "lab-work" // Lab Dashboard
  | "billing-desk" // Billing Dashboard
  | "patients"
  | "appointments"
  | "pharmacy"
  | "reports"
  | "settings"
  | "profile"
  | "bulk-sms"
  | "whatsapp-agent"
  // Super Admin Specific Views
  | "sa-overview"
  | "sa-clinics"
  | "sa-approvals"
  | "sa-payments"
  | "sa-support"
  | "sa-settings"

export interface User {
  id: string
  clinicId?: string
  fullName: string
  email: string
  phone?: string
  role: Role
  avatarUrl?: string
  status: "Active" | "Invited" | "Deactivated" | "Suspended"
  lastActiveAt?: string
  createdAt?: string
  updatedAt?: string
}

export interface AuditLogEntry {
  id: string
  clinicId?: string
  userId?: string
  userName?: string
  userRole?: string
  action: string
  resourceType: string
  resourceId?: string
  details?: Record<string, any>
  ipAddress?: string
  userAgent?: string
  status: "Success" | "Failed" | "Warning"
  createdAt: string
}
