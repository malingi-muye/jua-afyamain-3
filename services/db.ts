import { supabase } from '../lib/supabaseClient';
import { Patient, InventoryItem, Appointment, Visit, Supplier } from '../types';

export const db = {
    // --- Connection Check ---
    checkConnection: async (): Promise<boolean> => {
        try {
            // Check connection by querying a lightweight table or system info
            const { error } = await supabase.from('clinics').select('count', { count: 'exact', head: true });
            return !error;
        } catch (e) {
            console.error("Supabase connection check failed:", e);
            return false;
        }
    },

    // --- Patients ---
    getPatients: async (): Promise<Patient[]> => {
        const { data, error } = await supabase.from('patients').select('*').order('created_at', { ascending: false });
        if (error) throw error;

        return (data || []).map((p: any) => ({
            id: p.id,
            name: p.name,
            phone: p.phone,
            age: p.age,
            gender: p.gender,
            notes: p.notes,
            lastVisit: p.last_visit || new Date().toISOString().split('T')[0],
            history: p.history || [],
            vitals: p.vitals || {}
        }));
    },

    createPatient: async (patient: Patient): Promise<Patient> => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { id, ...payload } = patient; // Remove temporary ID

        const { data, error } = await supabase.from('patients').insert({
            name: payload.name,
            phone: payload.phone,
            age: payload.age,
            gender: payload.gender,
            notes: payload.notes,
            history: payload.history,
            vitals: payload.vitals,
            last_visit: payload.lastVisit
        }).select().single();

        if (error) throw error;

        return {
            id: data.id,
            name: data.name,
            phone: data.phone,
            age: data.age,
            gender: data.gender,
            notes: data.notes,
            lastVisit: data.last_visit,
            history: data.history || [],
            vitals: data.vitals || {}
        };
    },

    updatePatient: async (patient: Patient) => {
        const { error } = await supabase.from('patients').update({
            name: patient.name,
            phone: patient.phone,
            age: patient.age,
            gender: patient.gender,
            notes: patient.notes,
            history: patient.history,
            vitals: patient.vitals,
            last_visit: patient.lastVisit
        }).eq('id', patient.id);

        if (error) throw error;
    },

    deletePatient: async (id: string) => {
        const { error } = await supabase.from('patients').delete().eq('id', id);
        if (error) throw error;
    },

    // --- Inventory ---
    getInventory: async (): Promise<InventoryItem[]> => {
        const { data, error } = await supabase.from('inventory').select('*').order('name');
        if (error) throw error;

        return (data || []).map((i: any) => ({
            id: i.id,
            name: i.name,
            category: i.category,
            stock: i.stock,
            minStockLevel: i.min_stock_level,
            unit: i.unit,
            price: i.price,
            batchNumber: i.batch_number,
            expiryDate: i.expiry_date,
            supplierId: i.supplier_id
        }));
    },

    createInventoryItem: async (item: InventoryItem): Promise<InventoryItem> => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { id, ...payload } = item;

        const { data, error } = await supabase.from('inventory').insert({
            name: payload.name,
            category: payload.category,
            stock: payload.stock,
            min_stock_level: payload.minStockLevel,
            unit: payload.unit,
            price: payload.price,
            batch_number: payload.batchNumber,
            expiry_date: payload.expiryDate,
            supplier_id: payload.supplierId
        }).select().single();

        if (error) throw error;

        return {
            id: data.id,
            name: data.name,
            category: data.category,
            stock: data.stock,
            minStockLevel: data.min_stock_level,
            unit: data.unit,
            price: data.price,
            batchNumber: data.batch_number,
            expiryDate: data.expiry_date,
            supplierId: data.supplier_id
        };
    },

    updateInventoryItem: async (item: InventoryItem) => {
        const { error } = await supabase.from('inventory').update({
            name: item.name,
            category: item.category,
            stock: item.stock,
            min_stock_level: item.minStockLevel,
            unit: item.unit,
            price: item.price,
            batch_number: item.batchNumber,
            expiry_date: item.expiryDate,
            supplier_id: item.supplierId
        }).eq('id', item.id);
        if (error) throw error;
    },

    deleteInventoryItem: async (id: string) => {
        const { error } = await supabase.from('inventory').delete().eq('id', id);
        if (error) throw error;
    },

    // --- Appointments ---
    getAppointments: async (): Promise<Appointment[]> => {
        const { data, error } = await supabase.from('appointments').select('*').order('date', { ascending: true });
        if (error) throw error;

        return (data || []).map((a: any) => ({
            id: a.id,
            patientId: a.patient_id,
            patientName: a.patient_name,
            date: a.date,
            time: a.time,
            reason: a.reason,
            status: a.status
        }));
    },

    createAppointment: async (appt: Appointment): Promise<Appointment> => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { id, ...payload } = appt;

        const { data, error } = await supabase.from('appointments').insert({
            patient_id: payload.patientId,
            patient_name: payload.patientName,
            date: payload.date,
            time: payload.time,
            reason: payload.reason,
            status: payload.status
        }).select().single();

        if (error) throw error;

        return {
            id: data.id,
            patientId: data.patient_id,
            patientName: data.patient_name,
            date: data.date,
            time: data.time,
            reason: data.reason,
            status: data.status
        };
    },

    updateAppointment: async (appt: Appointment) => {
        const { error } = await supabase.from('appointments').update({
            date: appt.date,
            time: appt.time,
            reason: appt.reason,
            status: appt.status
        }).eq('id', appt.id);
        if (error) throw error;
    },

    // --- Visits ---
    getVisits: async (): Promise<Visit[]> => {
        const { data, error } = await supabase.from('visits').select('*').neq('stage', 'Completed');
        if (error) throw error;

        return (data || []).map((v: any) => ({
            id: v.id,
            patientId: v.patient_id,
            patientName: v.patient_name,
            stage: v.stage,
            stageStartTime: v.stage_start_time,
            startTime: v.start_time,
            queueNumber: v.queue_number,
            priority: v.priority,
            vitals: v.vitals || {},
            labOrders: v.lab_orders || [],
            prescription: v.prescription || [],
            medicationsDispensed: v.medications_dispensed,
            consultationFee: v.consultation_fee,
            totalBill: v.total_bill,
            paymentStatus: v.payment_status,
            chiefComplaint: v.chief_complaint,
            diagnosis: v.diagnosis,
            doctorNotes: v.doctor_notes
        }));
    },

    createVisit: async (visit: Visit): Promise<Visit> => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { id, ...payload } = visit;

        const { data, error } = await supabase.from('visits').insert({
            patient_id: payload.patientId,
            patient_name: payload.patientName,
            stage: payload.stage,
            stage_start_time: payload.stageStartTime,
            start_time: payload.startTime,
            queue_number: payload.queueNumber,
            priority: payload.priority,
            vitals: payload.vitals,
            lab_orders: payload.labOrders,
            prescription: payload.prescription,
            medications_dispensed: payload.medicationsDispensed,
            consultation_fee: payload.consultationFee,
            total_bill: payload.totalBill,
            payment_status: payload.paymentStatus,
            chief_complaint: payload.chiefComplaint,
            diagnosis: payload.diagnosis,
            doctor_notes: payload.doctorNotes
        }).select().single();

        if (error) throw error;

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
            labOrders: data.lab_orders || [],
            prescription: data.prescription || [],
            medicationsDispensed: data.medications_dispensed,
            consultationFee: data.consultation_fee,
            totalBill: data.total_bill,
            paymentStatus: data.payment_status,
            chiefComplaint: data.chief_complaint,
            diagnosis: data.diagnosis,
            doctorNotes: data.doctor_notes
        };
    },

    updateVisit: async (visit: Visit) => {
        const { error } = await supabase.from('visits').update({
            stage: visit.stage,
            stage_start_time: visit.stageStartTime,
            vitals: visit.vitals,
            lab_orders: visit.labOrders,
            prescription: visit.prescription,
            medications_dispensed: visit.medicationsDispensed,
            total_bill: visit.totalBill,
            payment_status: visit.paymentStatus,
            chief_complaint: visit.chiefComplaint,
            diagnosis: visit.diagnosis,
            doctor_notes: visit.doctorNotes
        }).eq('id', visit.id);

        if (error) {
            console.warn("DB Update failed (possibly running on mock IDs in Demo Mode)", error);
            throw error;
        }
    },

    // --- Suppliers ---
    getSuppliers: async (): Promise<Supplier[]> => {
        const { data, error } = await supabase.from('suppliers').select('*');
        if (error) throw error;

        return (data || []).map((s: any) => ({
            id: s.id,
            name: s.name,
            contactPerson: s.contact_person,
            phone: s.phone,
            email: s.email
        }));
    },

    createSupplier: async (supplier: Supplier): Promise<Supplier> => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { id, ...payload } = supplier;

        const { data, error } = await supabase.from('suppliers').insert({
            name: payload.name,
            contact_person: payload.contactPerson,
            phone: payload.phone,
            email: payload.email
        }).select().single();

        if (error) throw error;

        return {
            id: data.id,
            name: data.name,
            contactPerson: data.contact_person,
            phone: data.phone,
            email: data.email
        };
    },

    updateSupplier: async (supplier: Supplier) => {
        const { error } = await supabase.from('suppliers').update({
            name: supplier.name,
            contact_person: supplier.contactPerson,
            phone: supplier.phone,
            email: supplier.email
        }).eq('id', supplier.id);

        if (error) throw error;
    },

    deleteSupplier: async (id: string) => {
        const { error } = await supabase.from('suppliers').delete().eq('id', id);
        if (error) throw error;
    },

    // --- Settings ---
    getSettings: async (): Promise<import('../types').ClinicSettings | null> => {
        // Get current user's clinic_id first
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return null;

        // Get user's clinic_id
        const { data: userData } = await supabase
            .from('users')
            .select('clinic_id')
            .eq('id', user.id)
            .single();

        if (!userData?.clinic_id) {
            // No clinic associated - return null
            return null;
        }

        const { data, error } = await supabase
            .from('clinics')
            .select('*')
            .eq('id', userData.clinic_id)
            .maybeSingle(); // Use maybeSingle() instead of single() to handle 0 rows

        if (error) {
            console.error("Error fetching settings:", error);
            return null;
        }

        if (!data) {
            // No clinic found - return null
            return null;
        }

        const c = data;
        const settingsJson = c.settings || {};

        return {
            name: c.name,
            phone: c.phone || "",
            email: c.email || "",
            location: c.location || "",
            currency: c.currency || "KES",
            timezone: c.timezone || "Africa/Nairobi",
            language: "English",
            logo: c.logo_url || "",
            smsEnabled: settingsJson.smsEnabled ?? true,
            smsConfig: settingsJson.smsConfig || { apiKey: "", senderId: "" },
            paymentConfig: settingsJson.paymentConfig || { provider: "None", apiKey: "", secretKey: "", testMode: true, isConfigured: false },
            notifications: settingsJson.notifications || { appointmentReminders: true, lowStockAlerts: true, dailyReports: false, marketingEmails: false, alertEmail: c.email },
            security: settingsJson.security || { twoFactorEnabled: false, lastPasswordChange: new Date().toISOString().split('T')[0] },
            billing: {
                plan: c.plan === 'free' ? 'Free' : c.plan === 'pro' ? 'Pro' : 'Enterprise',
                status: c.status === 'active' ? 'Active' : 'Past Due',
                nextBillingDate: c.trial_ends_at || new Date().toISOString().split('T')[0],
                paymentMethod: settingsJson.billing?.paymentMethod || { type: "Card", last4: "0000", brand: "Generic", expiry: "00/00" }
            },
            team: settingsJson.team || []
        };
    },

    updateSettings: async (settings: import('../types').ClinicSettings) => {
        const settingsJson = {
            smsEnabled: settings.smsEnabled,
            smsConfig: settings.smsConfig,
            paymentConfig: settings.paymentConfig,
            notifications: settings.notifications,
            security: settings.security,
            billing: {
                paymentMethod: settings.billing.paymentMethod
            },
            team: settings.team
        };

        const updates = {
            name: settings.name,
            email: settings.email,
            phone: settings.phone,
            location: settings.location,
            currency: settings.currency,
            timezone: settings.timezone,
            logo_url: settings.logo,
            settings: settingsJson,
        };

        // Update the clinic (RLS ensures it only updates the user's clinic)
        // We use a dummy condition like 'id is not null' to satisfy the update requirement without knowing ID
        const { error } = await supabase.from('clinics').update(updates).neq('id', '00000000-0000-0000-0000-000000000000');

        if (error) throw error;
    },

    // --- Super Admin ---
    getAllClinics: async (): Promise<import('../types').Clinic[]> => {
        const { data, error } = await supabase.from('clinics').select('*');
        if (error) throw error;

        return data.map((c: any) => ({
            id: c.id,
            name: c.name,
            ownerName: "Owner", // We'd need to join with users table to get real owner name
            email: c.email,
            plan: c.plan === 'free' ? 'Free' : c.plan === 'pro' ? 'Pro' : 'Enterprise',
            status: c.status === 'active' ? 'Active' : c.status === 'pending' ? 'Pending' : 'Suspended',
            joinedDate: c.created_at ? c.created_at.split('T')[0] : new Date().toISOString().split('T')[0],
            lastPaymentDate: '-',
            nextPaymentDate: c.trial_ends_at || '-',
            revenueYTD: 0 // Need a transactions table for this
        }));
    },

    createClinic: async (clinic: Partial<import('../types').Clinic>) => {
        const { data, error } = await supabase.from('clinics').insert({
            name: clinic.name,
            email: clinic.email,
            plan: clinic.plan?.toLowerCase(),
            status: clinic.status?.toLowerCase() || 'active',
            // owner_id left null or handled by trigger/logic
        }).select().single();

        if (error) throw error;
        return data;
    },

    updateClinic: async (id: string, updates: Partial<import('../types').Clinic>) => {
        const dbUpdates: any = {};
        if (updates.name) dbUpdates.name = updates.name;
        if (updates.email) dbUpdates.email = updates.email;
        if (updates.plan) dbUpdates.plan = updates.plan.toLowerCase();
        if (updates.status) dbUpdates.status = updates.status.toLowerCase();

        const { error } = await supabase.from('clinics').update(dbUpdates).eq('id', id);
        if (error) throw error;
    },

    deleteClinic: async (id: string) => {
        const { error } = await supabase.from('clinics').delete().eq('id', id);
        if (error) throw error;
    },

    // --- SaaS Transactions ---
    getTransactions: async (): Promise<import('../types').SaaSTransaction[]> => {
        const { data, error } = await supabase.from('transactions').select('*, clinics(name)');
        if (error) throw error;

        return data.map((t: any) => ({
            id: t.id,
            clinicName: t.clinics?.name || 'Unknown',
            amount: t.amount,
            date: t.created_at.split('T')[0],
            status: t.status,
            method: t.method,
            plan: t.plan
        }));
    },

    createTransaction: async (txn: Partial<import('../types').SaaSTransaction> & { clinicId: string }) => {
        const { data, error } = await supabase.from('transactions').insert({
            clinic_id: txn.clinicId,
            amount: txn.amount,
            status: txn.status,
            method: txn.method,
            plan: txn.plan,
            // reference: txn.reference // Assuming generated or passed
        }).select().single();
        if (error) throw error;
        return data;
    },

    updateTransaction: async (id: string, updates: Partial<import('../types').SaaSTransaction>) => {
        const { error } = await supabase.from('transactions').update(updates).eq('id', id);
        if (error) throw error;
    },

    // --- Support Tickets ---
    getSupportTickets: async (): Promise<import('../types').SupportTicket[]> => {
        const { data, error } = await supabase.from('support_tickets').select('*, clinics(name)');
        if (error) throw error;

        return data.map((t: any) => ({
            id: t.id,
            clinicName: t.clinics?.name || 'Unknown',
            subject: t.subject,
            priority: t.priority,
            status: t.status,
            dateCreated: t.created_at.split('T')[0],
            lastUpdate: t.updated_at.split('T')[0]
        }));
    },

    createSupportTicket: async (ticket: Partial<import('../types').SupportTicket> & { clinicId: string, userId?: string, messages: any[] }) => {
        const { data, error } = await supabase.from('support_tickets').insert({
            clinic_id: ticket.clinicId,
            user_id: ticket.userId,
            subject: ticket.subject,
            priority: ticket.priority,
            status: 'Open',
            messages: ticket.messages
        }).select().single();
        if (error) throw error;
        return data;
    },

    updateSupportTicket: async (id: string, updates: Partial<import('../types').SupportTicket> & { messages?: any[] }) => {
        const payload: any = {
            status: updates.status,
            priority: updates.priority,
            updated_at: new Date().toISOString()
        };
        if (updates.messages) payload.messages = updates.messages;

        const { error } = await supabase.from('support_tickets').update(payload).eq('id', id);
        if (error) throw error;
    },

    // --- Notifications ---
    getNotifications: async (userId: string): Promise<any[]> => {
        try {
            const { data, error } = await supabase.from('notifications').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(10);
            if (error) {
                // Fallback if table doesn't exist
                return [
                    { id: '1', title: 'Welcome', message: 'Welcome to JuaAfya Super Admin.', type: 'info', created_at: new Date().toISOString() }
                ];
            }
            return data || [];
        } catch (e) {
            console.warn("Notifications fetch failed", e);
            return [
                { id: '1', title: 'Welcome', message: 'Welcome to JuaAfya Super Admin.', type: 'info', created_at: new Date().toISOString() }
            ];
        }
    },

    // --- User Profile ---
    updateUser: async (id: string, updates: Partial<{ name: string; email: string; phone: string; avatar: string; designation?: string; address?: string }>) => {
        const payload: any = {};
        if (updates.name) payload.full_name = updates.name;
        if (updates.avatar) payload.avatar_url = updates.avatar;
        // Add other fields if schema supports them (phone, designation, etc.)

        const { error } = await supabase.from('users').update(payload).eq('id', id);

        if (error) throw error;
    },

    // --- Platform Settings ---
    getPlatformSettings: async (): Promise<any> => {
        try {
            // Try to fetch from a 'platform_settings' table, id=1
            const { data, error } = await supabase.from('platform_settings').select('*').eq('id', 1).single();
            if (error || !data) {
                return {
                    maintenanceMode: false,
                    allowNewRegistrations: true,
                    globalAnnouncement: '',
                    pricing: { free: 0, pro: 5000, enterprise: 15000 },
                    gateways: {
                        mpesa: { paybill: '522522', account: 'JUAAFYA', name: 'JuaAfya Ltd', enabled: true },
                        bank: { name: 'KCB Bank', branch: 'Head Office', account: '1100223344', swift: 'KCBLKENX', enabled: true },
                        paystack: { publicKey: '', secretKey: '', enabled: false }
                    }
                };
            }
            return data.settings;
        } catch (e) {
            console.warn("Platform settings fetch failed, using defaults", e);
            return {
                maintenanceMode: false,
                allowNewRegistrations: true,
                globalAnnouncement: '',
                pricing: { free: 0, pro: 5000, enterprise: 15000 },
                gateways: {
                    mpesa: { paybill: '522522', account: 'JUAAFYA', name: 'JuaAfya Ltd' },
                    bank: { name: 'KCB Bank', branch: 'Head Office', account: '1100223344', swift: 'KCBLKENX' }
                }
            };
        }
    },

    savePlatformSettings: async (settings: any) => {
        const { error } = await supabase.from('platform_settings').upsert({ id: 1, settings });
        if (error) throw error;
    }
};
