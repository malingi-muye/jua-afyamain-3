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
    }
};
