import { Patient, Appointment, InventoryItem, Gender, Supplier, InventoryLog, Visit, LabTestProfile, Clinic, ApprovalRequest, SaaSTransaction, SystemLog, SupportTicket } from './types';

export const MOCK_PATIENTS: Patient[] = [
  {
    id: 'P001',
    name: 'Wanjiku Kamau',
    phone: '+254 712 345 678',
    age: 34,
    gender: Gender.Female,
    lastVisit: '2023-10-15',
    notes: 'Patient complains of persistent headache and mild fever. Blood pressure elevated (140/90). Prescribed painkillers and rest.',
    history: ['Malaria treatment (Aug 2023)', 'Routine Checkup (Jan 2023)'],
    vitals: {
      bp: '140/90',
      heartRate: '88',
      temp: '37.8',
      weight: '68'
    }
  },
  {
    id: 'P002',
    name: 'Juma Ochieng',
    phone: '+254 722 987 654',
    age: 45,
    gender: Gender.Male,
    lastVisit: '2023-10-20',
    notes: 'Follow up on fractured arm. Healing well. Cast removal scheduled next week.',
    history: ['Fracture treatment (Sep 2023)'],
    vitals: {
      bp: '120/80',
      heartRate: '72',
      temp: '36.5',
      weight: '75'
    }
  },
  {
    id: 'P003',
    name: 'Amina Mohamed',
    phone: '+254 733 111 222',
    age: 28,
    gender: Gender.Female,
    lastVisit: '2023-10-22',
    notes: 'Prenatal visit. 2nd trimester. Vitals stable. Iron supplements refilled.',
    history: ['Prenatal Visit 1 (Sep 2023)'],
    vitals: {
      bp: '110/70',
      heartRate: '75',
      temp: '36.8',
      weight: '62'
    }
  },
];

export const MOCK_APPOINTMENTS: Appointment[] = [
  { id: 'A001', patientId: 'P001', patientName: 'Wanjiku Kamau', date: '2023-10-27', time: '09:00', reason: 'BP Checkup', status: 'Scheduled' },
  { id: 'A002', patientId: 'P003', patientName: 'Amina Mohamed', date: '2023-10-27', time: '10:30', reason: 'Prenatal Review', status: 'Scheduled' },
  { id: 'A003', patientId: 'P002', patientName: 'Juma Ochieng', date: '2023-10-28', time: '14:00', reason: 'Cast Removal', status: 'Scheduled' },
];

export const MOCK_SUPPLIERS: Supplier[] = [
  { id: 'S001', name: 'MedKenya Distributors', contactPerson: 'John K.', phone: '+254 700 000 001', email: 'orders@medkenya.com' },
  { id: 'S002', name: 'Nairobi Pharma Ltd', contactPerson: 'Sarah M.', phone: '+254 700 000 002', email: 'sales@nbi-pharma.co.ke' },
  { id: 'S003', name: 'Global Health Supplies', contactPerson: 'David O.', phone: '+254 700 000 003', email: 'david@globalhealth.com' },
];

export const MOCK_INVENTORY: InventoryItem[] = [
  { id: 'I001', name: 'Paracetamol 500mg', stock: 1500, minStockLevel: 500, unit: 'Tablets', category: 'Medicine', price: 5, batchNumber: 'B-9923', expiryDate: '2025-12-31', supplierId: 'S001' },
  { id: 'I002', name: 'Amoxicillin 250mg', stock: 400, minStockLevel: 200, unit: 'Tablets', category: 'Medicine', price: 15, batchNumber: 'AMX-001', expiryDate: '2024-06-30', supplierId: 'S002' },
  { id: 'I003', name: 'Cotton Wool', stock: 12, minStockLevel: 20, unit: 'Rolls', category: 'Supply', price: 150, supplierId: 'S003' },
  { id: 'I004', name: 'Malaria Test Kit', stock: 45, minStockLevel: 50, unit: 'Kits', category: 'Lab', price: 200, batchNumber: 'MAL-22', expiryDate: '2023-12-01', supplierId: 'S001' }, // Expiring soon
  { id: 'I005', name: 'Cough Syrup', stock: 8, minStockLevel: 20, unit: 'Bottles', category: 'Medicine', price: 350, batchNumber: 'CS-88', expiryDate: '2025-01-01', supplierId: 'S002' }, // Low stock
];

export const MOCK_LAB_TESTS: LabTestProfile[] = [
    { id: 'T001', name: 'Full Hemogram (CBC)', price: 800, category: 'Hematology' },
    { id: 'T002', name: 'Malaria Smear', price: 300, category: 'Microbiology' },
    { id: 'T003', name: 'Urinalysis', price: 400, category: 'Microbiology' },
    { id: 'T004', name: 'Random Blood Sugar', price: 200, category: 'Biochemistry' },
    { id: 'T005', name: 'Lipid Profile', price: 1500, category: 'Biochemistry' },
    { id: 'T006', name: 'X-Ray (Chest)', price: 1200, category: 'Radiology' },
];

export const MOCK_LOGS: InventoryLog[] = [
  { id: 'L001', itemId: 'I001', itemName: 'Paracetamol 500mg', action: 'Restocked', quantityChange: 1000, notes: 'Monthly restock', timestamp: '2023-10-01T09:00:00Z', user: 'Dr. Andrew' },
  { id: 'L002', itemId: 'I005', itemName: 'Cough Syrup', action: 'Dispensed', quantityChange: -2, notes: 'Prescription #882', timestamp: '2023-10-24T14:30:00Z', user: 'Nurse Sarah' },
];

export const MOCK_VISITS: Visit[] = [
  { 
    id: 'V100', 
    patientId: 'P001', 
    patientName: 'Wanjiku Kamau', 
    stage: 'Consultation', 
    stageStartTime: new Date(Date.now() - 1000 * 60 * 15).toISOString(), // 15 mins ago
    startTime: new Date(Date.now() - 1000 * 60 * 45).toISOString(), // 45 mins ago
    queueNumber: 1, 
    priority: 'Normal',
    vitals: { bp: '130/85', temp: '37.2', weight: '68', heartRate: '80' },
    labOrders: [],
    prescription: [],
    medicationsDispensed: false,
    consultationFee: 500,
    totalBill: 500,
    paymentStatus: 'Pending'
  },
  { 
    id: 'V101', 
    patientId: 'P003', 
    patientName: 'Amina Mohamed', 
    stage: 'Vitals', // Updated from Triage
    stageStartTime: new Date(Date.now() - 1000 * 60 * 5).toISOString(), // 5 mins ago
    startTime: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
    queueNumber: 2, 
    priority: 'Urgent',
    labOrders: [],
    prescription: [],
    medicationsDispensed: false,
    consultationFee: 500,
    totalBill: 500,
    paymentStatus: 'Pending'
  }
];

export const MOCK_CLINICS: Clinic[] = [
    { id: 'C001', name: 'JuaAfya Downtown', ownerName: 'Dr. Andrew', email: 'andrew@juaafya.com', plan: 'Pro', status: 'Active', joinedDate: '2023-01-15', lastPaymentDate: '2023-10-01', nextPaymentDate: '2023-11-01', revenueYTD: 450000 },
    { id: 'C002', name: 'Sunrise Medical', ownerName: 'Dr. Keziah', email: 'keziah@sunrise.com', plan: 'Enterprise', status: 'Active', joinedDate: '2023-03-10', lastPaymentDate: '2023-10-05', nextPaymentDate: '2023-11-05', revenueYTD: 1200000 },
    { id: 'C003', name: 'Mombasa Road Clinic', ownerName: 'Peter O.', email: 'peter@mrclinic.co.ke', plan: 'Free', status: 'Active', joinedDate: '2023-08-22', lastPaymentDate: '-', nextPaymentDate: '-', revenueYTD: 0 },
    { id: 'C004', name: 'Westlands Health', ownerName: 'Sarah M.', email: 'sarah@westhealth.com', plan: 'Pro', status: 'Suspended', joinedDate: '2022-11-01', lastPaymentDate: '2023-08-01', nextPaymentDate: '2023-09-01', revenueYTD: 340000 },
];

export const MOCK_REQUESTS: ApprovalRequest[] = [
    { id: 'R001', type: 'New Clinic', clinicName: 'Afya Bora Eastleigh', requesterName: 'Ahmed Y.', date: '2023-10-26', details: 'New registration request. Documents verified.', status: 'Pending' },
    { id: 'R002', type: 'Plan Upgrade', clinicName: 'Mombasa Road Clinic', requesterName: 'Peter O.', date: '2023-10-25', details: 'Request to upgrade from Free to Pro plan.', status: 'Pending' },
    { id: 'R003', type: 'Refund', clinicName: 'Westlands Health', requesterName: 'Sarah M.', date: '2023-10-20', details: 'Refund request for downtime on Oct 15th.', status: 'Rejected' },
];

export const MOCK_SAAS_TRANSACTIONS: SaaSTransaction[] = [
    { id: 'TX-9901', clinicName: 'JuaAfya Downtown', amount: 5000, date: '2023-10-01', status: 'Success', method: 'Card', plan: 'Pro' },
    { id: 'TX-9902', clinicName: 'Sunrise Medical', amount: 12000, date: '2023-10-05', status: 'Success', method: 'M-Pesa', plan: 'Enterprise' },
    { id: 'TX-9903', clinicName: 'Westlands Health', amount: 5000, date: '2023-10-03', status: 'Failed', method: 'Card', plan: 'Pro' },
    { id: 'TX-9904', clinicName: 'Afya Bora Eastleigh', amount: 5000, date: '2023-10-27', status: 'Pending', method: 'M-Pesa', plan: 'Pro' },
];

export const MOCK_SYSTEM_LOGS: SystemLog[] = [
    { id: 'SL-001', action: 'System Backup', admin: 'Automated', target: 'Database', timestamp: '2023-10-28T02:00:00Z', status: 'Success' },
    { id: 'SL-002', action: 'Suspend Clinic', admin: 'System Owner', target: 'Westlands Health', timestamp: '2023-10-27T14:30:00Z', status: 'Warning' },
    { id: 'SL-003', action: 'Pricing Update', admin: 'System Owner', target: 'Pro Plan', timestamp: '2023-10-25T09:15:00Z', status: 'Success' },
    { id: 'SL-004', action: 'Failed Login', admin: 'Unknown IP', target: 'Admin Portal', timestamp: '2023-10-24T22:10:00Z', status: 'Error' },
    { id: 'SL-005', action: 'Provision Clinic', admin: 'System Owner', target: 'Sunrise Medical', timestamp: '2023-03-10T10:00:00Z', status: 'Success' },
];

export const MOCK_TICKETS: SupportTicket[] = [
    { id: 'TK-1024', clinicName: 'JuaAfya Downtown', subject: 'SMS Gateway Timeout', priority: 'High', status: 'Open', dateCreated: '2023-10-28', lastUpdate: '10 mins ago' },
    { id: 'TK-1023', clinicName: 'Sunrise Medical', subject: 'Report Export Issues', priority: 'Medium', status: 'In Progress', dateCreated: '2023-10-27', lastUpdate: '2 hours ago' },
    { id: 'TK-1020', clinicName: 'Mombasa Road Clinic', subject: 'How to add new staff?', priority: 'Low', status: 'Resolved', dateCreated: '2023-10-25', lastUpdate: '1 day ago' },
];
