import React, { useState, useMemo } from 'react';
import { Patient, Gender, ClinicSettings } from '../types';
import { Search, Plus, Phone, FileText, Sparkles, X, Activity, MessageSquare, MoreHorizontal, Printer, Filter, Edit2, Save, User, Trash2, Send, Loader2, Eye, ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { analyzePatientNotes, draftAppointmentSms } from '../services/geminiService';
import { sendSms } from '../services/smsService';

interface PatientListProps {
  patients: Patient[];
  addPatient: (p: Patient) => void;
  updatePatient: (p: Patient) => void;
  deletePatient: (id: string) => void;
  settings?: ClinicSettings;
}

const PatientList: React.FC<PatientListProps> = ({ patients, addPatient, updatePatient, deletePatient, settings }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Action Menu State
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  // Add Patient State
  const [isAdding, setIsAdding] = useState(false);
  const [newPatientData, setNewPatientData] = useState({
    name: '',
    phone: '',
    age: '',
    gender: Gender.Male,
    notes: '',
    vitals: { bp: '', heartRate: '', temp: '', weight: '' }
  });
  
  // Edit State
  const [isEditing, setIsEditing] = useState(false);
  const [editFormData, setEditFormData] = useState<Patient | null>(null);

  // Vitals Inline Edit State
  const [isEditingVitals, setIsEditingVitals] = useState(false);
  const [tempVitals, setTempVitals] = useState({ bp: '', heartRate: '', temp: '', weight: '' });

  // History State
  const [isAddingHistory, setIsAddingHistory] = useState(false);
  const [newHistoryNote, setNewHistoryNote] = useState('');

  // Filtering & Sorting State
  const [genderFilter, setGenderFilter] = useState<string>('All');
  const [sortBy, setSortBy] = useState<string>('Recent'); // Recent, Name, Age
  
  // AI State
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  
  // SMS State
  const [showSmsModal, setShowSmsModal] = useState(false);
  const [draftingSms, setDraftingSms] = useState(false);
  const [sendingSms, setSendingSms] = useState(false);
  const [smsDraft, setSmsDraft] = useState('');

  // Enhanced Filter Logic
  const filtered = useMemo(() => patients
    .filter(p => {
        const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.phone.includes(searchTerm) || p.id.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesGender = genderFilter === 'All' || p.gender === genderFilter;
        return matchesSearch && matchesGender;
    })
    .sort((a, b) => {
        if (sortBy === 'Name') return a.name.localeCompare(b.name);
        if (sortBy === 'Age') return a.age - b.age;
        // Default to Recent
        return new Date(b.lastVisit).getTime() - new Date(a.lastVisit).getTime();
    }), [patients, searchTerm, genderFilter, sortBy]);

  // Pagination Logic
  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginatedPatients = filtered.slice(
      (currentPage - 1) * itemsPerPage,
      currentPage * itemsPerPage
  );

  const handleAnalyzeNotes = async (notes: string) => {
    setIsAnalyzing(true);
    setAiAnalysis(null);
    const result = await analyzePatientNotes(notes);
    setAiAnalysis(result);
    setIsAnalyzing(false);
  };

  const handleDraftSms = async (patient: Patient) => {
    setShowSmsModal(true);
    setDraftingSms(true);
    // Determine last visit or next likely follow up based on notes (simulated logic for demo)
    const reason = "Follow-up checkup"; 
    const date = "next Tuesday";
    const draft = await draftAppointmentSms(patient.name, date, reason);
    setSmsDraft(draft);
    setDraftingSms(false);
  };

  const handleConfirmSendSms = async () => {
    if (!selectedPatient || !smsDraft) return;

    setSendingSms(true);
    // Use configured settings if available
    const result = await sendSms(selectedPatient.phone, smsDraft, settings?.smsConfig);
    setSendingSms(false);

    if (result.status === 'success') {
        alert(`SMS sent successfully to ${selectedPatient.name}!`);
        setShowSmsModal(false);
        setSmsDraft('');
    } else {
        alert('Failed to send SMS: ' + (result.message || 'Unknown error'));
    }
  };

  const handleEditClick = (patient: Patient) => {
    setEditFormData({ ...patient });
    setIsEditing(true);
    setActiveMenuId(null);
  };

  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    if (editFormData) {
        setEditFormData({
            ...editFormData,
            [e.target.name]: e.target.value
        });
    }
  };

  const handleEditVitalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (editFormData) {
        setEditFormData({
            ...editFormData,
            vitals: {
                ...(editFormData.vitals || { bp: '', heartRate: '', temp: '', weight: '' }),
                [e.target.name]: e.target.value
            }
        });
    }
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editFormData) {
        updatePatient(editFormData);
        setSelectedPatient(editFormData); // Update the view immediately
        setIsEditing(false);
    }
  };

  const handleDelete = (id?: string) => {
    const targetId = id || editFormData?.id;
    if (targetId && confirm(`Are you sure you want to delete this patient record? This action cannot be undone.`)) {
        deletePatient(targetId);
        setIsEditing(false);
        setSelectedPatient(null);
        setActiveMenuId(null);
    }
  };

  const handleAddHistory = (patient: Patient) => {
    if (!newHistoryNote.trim()) return;
    
    const dateStr = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    const entry = `${newHistoryNote} (${dateStr})`;
    
    const updatedPatient = {
        ...patient,
        history: [entry, ...patient.history]
    };
    
    updatePatient(updatedPatient);
    setSelectedPatient(updatedPatient); // Update local view
    setNewHistoryNote('');
    setIsAddingHistory(false);
  };

  // Add Patient Logic
  const handleAddChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setNewPatientData({
      ...newPatientData,
      [e.target.name]: e.target.value
    });
  };

  const handleAddVitalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewPatientData({
        ...newPatientData,
        vitals: {
            ...newPatientData.vitals,
            [e.target.name]: e.target.value
        }
    });
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPatientData.name || !newPatientData.age) return;

    const newPatient: Patient = {
      id: `P${Math.floor(Math.random() * 9000 + 1000)}`, // Simple ID generation
      name: newPatientData.name,
      phone: newPatientData.phone,
      age: Number(newPatientData.age),
      gender: newPatientData.gender as Gender,
      lastVisit: new Date().toISOString().split('T')[0],
      notes: newPatientData.notes,
      history: [],
      vitals: newPatientData.vitals
    };

    addPatient(newPatient);
    setIsAdding(false);
    setNewPatientData({ 
        name: '', phone: '', age: '', gender: Gender.Male, notes: '',
        vitals: { bp: '', heartRate: '', temp: '', weight: '' }
    });
  };

  const handlePrint = () => {
      window.print();
  };

  const handleCall = (phone: string) => {
      window.location.href = `tel:${phone}`;
  };

  // Close menus when clicking outside
  React.useEffect(() => {
      const handleClickOutside = () => setActiveMenuId(null);
      if (activeMenuId) document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
  }, [activeMenuId]);

  const renderPatientDetail = (patient: Patient) => (
    <div className="fixed inset-0 z-50 flex justify-center items-center p-4 sm:p-6 no-print">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" onClick={() => { setSelectedPatient(null); setIsEditingVitals(false); }} />
      
      <div className="bg-white dark:bg-slate-800 w-full max-w-4xl max-h-[90vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col relative animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="bg-white dark:bg-slate-800 border-b border-slate-100 dark:border-slate-700 p-6 flex items-start justify-between">
            <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-full overflow-hidden border-2 border-slate-100 dark:border-slate-700 bg-slate-100 dark:bg-slate-700">
                    <img src={`https://i.pravatar.cc/150?u=${patient.id}`} alt="Avatar" className="w-full h-full object-cover" />
                </div>
                <div>
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        {patient.name}
                        <span className="text-sm font-normal text-slate-400 bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded-full">{patient.id}</span>
                    </h2>
                    <div className="flex items-center text-slate-500 dark:text-slate-400 text-sm font-medium mt-1 gap-3">
                        <span>{patient.gender}</span>
                        <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-600"></span>
                        <span>{patient.age} Years</span>
                        <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-600"></span>
                        <span>{patient.phone}</span>
                    </div>
                </div>
            </div>
            <div className="flex items-center gap-2">
                <button 
                    onClick={() => handleEditClick(patient)}
                    className="p-2 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-full transition-colors text-slate-500 dark:text-slate-400"
                    title="Edit Patient"
                >
                    <Edit2 className="w-5 h-5" />
                </button>
                <button onClick={() => { setSelectedPatient(null); setAiAnalysis(null); setIsEditingVitals(false); }} className="p-2 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-full transition-colors">
                    <X className="w-6 h-6 text-slate-400" />
                </button>
            </div>
        </div>

        <div className="overflow-y-auto flex-1 p-6 md:p-8 space-y-8 bg-gray-50/50 dark:bg-slate-900/50">
            {/* Quick Actions Row */}
            <div className="flex gap-4 overflow-x-auto pb-2">
                <button 
                  onClick={() => handleDraftSms(patient)}
                  className="flex items-center gap-2 px-4 py-2 bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-300 rounded-xl font-medium text-sm hover:bg-brand-100 dark:hover:bg-brand-900/40 transition-colors whitespace-nowrap"
                >
                    <MessageSquare className="w-4 h-4" />
                    Draft SMS Reminder
                </button>
                <button 
                  onClick={() => handleEditClick(patient)}
                  className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-200 rounded-xl font-medium text-sm hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors whitespace-nowrap"
                >
                    <Edit2 className="w-4 h-4" /> Edit Profile
                </button>
                <button 
                    onClick={() => handleCall(patient.phone)}
                    className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-200 rounded-xl font-medium text-sm hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors whitespace-nowrap"
                >
                    <Phone className="w-4 h-4" /> Call Patient
                </button>
                <button 
                    onClick={handlePrint}
                    className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-200 rounded-xl font-medium text-sm hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors whitespace-nowrap"
                >
                    <Printer className="w-4 h-4" /> Print Report
                </button>
            </div>

            {/* SMS Modal */}
            {showSmsModal && (
                <div className="bg-white dark:bg-slate-800 border border-brand-100 dark:border-slate-600 rounded-2xl p-4 shadow-xl animate-in slide-in-from-top-2">
                    <div className="flex justify-between items-center mb-2">
                         <h4 className="font-bold text-brand-800 dark:text-brand-300 flex items-center gap-2 text-sm">
                            <Sparkles className="w-4 h-4" /> AI Generated SMS Draft
                         </h4>
                         <button onClick={() => setShowSmsModal(false)} className="text-slate-400 hover:text-slate-600"><X className="w-4 h-4"/></button>
                    </div>
                    {draftingSms ? (
                        <div className="py-4 flex items-center justify-center text-slate-400 text-sm">
                            <Activity className="w-4 h-4 animate-spin mr-2" /> Drafting message...
                        </div>
                    ) : (
                        <textarea 
                            className="bg-slate-50 dark:bg-slate-900 p-3 rounded-lg text-slate-700 dark:text-slate-200 text-sm border border-slate-200 dark:border-slate-600 w-full h-24 focus:ring-2 focus:ring-brand-500 outline-none resize-none"
                            value={smsDraft}
                            onChange={(e) => setSmsDraft(e.target.value)}
                        />
                    )}
                    {!draftingSms && (
                        <div className="mt-3 flex justify-end gap-2">
                             <button 
                                onClick={handleConfirmSendSms}
                                disabled={sendingSms}
                                className="text-xs font-semibold bg-brand-600 text-white px-4 py-2 rounded-lg hover:bg-brand-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                            >
                                {sendingSms ? <Loader2 className="w-3 h-3 animate-spin"/> : <Send className="w-3 h-3"/>}
                                Send SMS
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* Detailed Notes with AI */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 space-y-4">
                     <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                <FileText className="w-5 h-5 text-slate-400" />
                                Clinical Notes
                            </h3>
                             <button 
                                onClick={() => handleAnalyzeNotes(patient.notes)}
                                disabled={isAnalyzing}
                                className="flex items-center text-xs font-bold text-indigo-600 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-900/30 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 px-3 py-1.5 rounded-lg transition-colors"
                            >
                                {isAnalyzing ? <Activity className="w-3 h-3 mr-1 animate-spin" /> : <Sparkles className="w-3 h-3 mr-1" />}
                                Summarize with AI
                            </button>
                        </div>
                        <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-sm">{patient.notes}</p>
                        
                        {aiAnalysis && (
                             <div className="mt-4 p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl border border-indigo-100 dark:border-indigo-800 text-indigo-900 dark:text-indigo-200 text-sm whitespace-pre-line animate-in fade-in">
                                 <div className="flex items-center gap-2 mb-2 font-bold text-indigo-700 dark:text-indigo-300">
                                     <Sparkles className="w-4 h-4" /> Smart Summary
                                 </div>
                                 {aiAnalysis}
                             </div>
                        )}
                     </div>

                     <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-slate-900 dark:text-white">Visit History</h3>
                            <button 
                                onClick={() => setIsAddingHistory(!isAddingHistory)}
                                className="text-xs text-teal-600 hover:text-teal-700 dark:text-teal-400 dark:hover:text-teal-300 font-medium flex items-center gap-1"
                            >
                                <Plus className="w-3 h-3" /> Add Visit
                            </button>
                        </div>

                        {isAddingHistory && (
                            <div className="mb-4 p-4 bg-slate-50 dark:bg-slate-700/30 rounded-xl border border-slate-100 dark:border-slate-700 animate-in slide-in-from-top-2">
                                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-2">New Visit Summary</label>
                                <textarea
                                    value={newHistoryNote}
                                    onChange={(e) => setNewHistoryNote(e.target.value)}
                                    placeholder="Enter visit summary (e.g. 'Routine Checkup - Prescribed Antibiotics')..."
                                    className="w-full text-sm p-3 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 dark:text-white mb-3 focus:ring-2 focus:ring-teal-500 outline-none resize-none"
                                    rows={3}
                                />
                                <div className="flex justify-end gap-2">
                                    <button 
                                        onClick={() => setIsAddingHistory(false)}
                                        className="text-xs px-3 py-2 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg transition-colors font-medium"
                                    >
                                        Cancel
                                    </button>
                                    <button 
                                        onClick={() => handleAddHistory(patient)}
                                        className="text-xs px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors font-bold"
                                    >
                                        Save Record
                                    </button>
                                </div>
                            </div>
                        )}

                        <div className="space-y-4">
                            {patient.history.length > 0 ? patient.history.map((record, i) => (
                                <div key={i} className="flex items-center justify-between pb-4 border-b border-slate-50 dark:border-slate-700 last:border-0 last:pb-0">
                                    <div className="flex items-center gap-3">
                                        <div className="w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-600"></div>
                                        <span className="text-slate-700 dark:text-slate-300 font-medium text-sm">{record}</span>
                                    </div>
                                    <button className="text-xs text-brand-600 dark:text-brand-400 font-medium hover:underline">View Report</button>
                                </div>
                            )) : (
                                <p className="text-sm text-slate-400 italic">No previous visit history.</p>
                            )}
                        </div>
                     </div>
                </div>

                {/* Vitals Sidebar */}
                <div className="space-y-4">
                    <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm">
                        <div className="flex justify-between items-center mb-4">
                            <h4 className="text-xs font-bold text-slate-400 uppercase">Vitals (Latest)</h4>
                            {!isEditingVitals ? (
                                <button 
                                    onClick={() => {
                                        setTempVitals({
                                            bp: patient.vitals?.bp || '',
                                            heartRate: patient.vitals?.heartRate || '',
                                            temp: patient.vitals?.temp || '',
                                            weight: patient.vitals?.weight || ''
                                        });
                                        setIsEditingVitals(true);
                                    }} 
                                    className="text-xs text-teal-600 dark:text-teal-400 hover:underline flex items-center gap-1 font-bold"
                                >
                                    <Edit2 className="w-3 h-3" /> Edit
                                </button>
                            ) : (
                                <div className="flex gap-2">
                                    <button 
                                        onClick={() => setIsEditingVitals(false)}
                                        className="text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                                    >
                                        Cancel
                                    </button>
                                    <button 
                                        onClick={() => {
                                            const updated = { ...patient, vitals: tempVitals };
                                            updatePatient(updated);
                                            setSelectedPatient(updated);
                                            setIsEditingVitals(false);
                                        }}
                                        className="text-xs text-teal-600 font-bold hover:text-teal-700 dark:hover:text-teal-300 flex items-center gap-1"
                                    >
                                        <Check className="w-3 h-3" /> Save
                                    </button>
                                </div>
                            )}
                        </div>
                        
                        <div className="space-y-4">
                             <div>
                                 <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">Blood Pressure</div>
                                 {isEditingVitals ? (
                                     <input 
                                        value={tempVitals.bp}
                                        onChange={(e) => setTempVitals({...tempVitals, bp: e.target.value})}
                                        className="w-full text-lg font-bold p-1.5 border border-slate-200 dark:border-slate-600 rounded-lg dark:bg-slate-700 dark:text-white outline-none focus:ring-2 focus:ring-teal-500"
                                        placeholder="120/80"
                                     />
                                 ) : (
                                     <div className="text-2xl font-bold text-slate-900 dark:text-white">{patient.vitals?.bp || '--/--'}</div>
                                 )}
                             </div>
                             
                             <div>
                                 <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">Heart Rate</div>
                                 <div className="flex items-center gap-2">
                                     {isEditingVitals ? (
                                         <input 
                                            value={tempVitals.heartRate}
                                            onChange={(e) => setTempVitals({...tempVitals, heartRate: e.target.value})}
                                            className="w-full text-lg font-bold p-1.5 border border-slate-200 dark:border-slate-600 rounded-lg dark:bg-slate-700 dark:text-white outline-none focus:ring-2 focus:ring-teal-500"
                                            placeholder="72"
                                         />
                                     ) : (
                                         <span className="text-2xl font-bold text-slate-900 dark:text-white">{patient.vitals?.heartRate || '--'}</span>
                                     )}
                                     <span className="text-sm font-normal text-slate-400">bpm</span>
                                 </div>
                             </div>

                             <div>
                                 <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">Temperature</div>
                                 <div className="flex items-center gap-2">
                                     {isEditingVitals ? (
                                         <input 
                                            value={tempVitals.temp}
                                            onChange={(e) => setTempVitals({...tempVitals, temp: e.target.value})}
                                            className="w-full text-lg font-bold p-1.5 border border-slate-200 dark:border-slate-600 rounded-lg dark:bg-slate-700 dark:text-white outline-none focus:ring-2 focus:ring-teal-500"
                                            placeholder="36.5"
                                         />
                                     ) : (
                                         <span className="text-2xl font-bold text-slate-900 dark:text-white">{patient.vitals?.temp || '--'}</span>
                                     )}
                                     <span className="text-sm font-normal text-slate-400">°C</span>
                                 </div>
                             </div>

                             <div>
                                 <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">Weight</div>
                                 <div className="flex items-center gap-2">
                                     {isEditingVitals ? (
                                         <input 
                                            value={tempVitals.weight}
                                            onChange={(e) => setTempVitals({...tempVitals, weight: e.target.value})}
                                            className="w-full text-lg font-bold p-1.5 border border-slate-200 dark:border-slate-600 rounded-lg dark:bg-slate-700 dark:text-white outline-none focus:ring-2 focus:ring-teal-500"
                                            placeholder="70"
                                         />
                                     ) : (
                                         <span className="text-2xl font-bold text-slate-900 dark:text-white">{patient.vitals?.weight || '--'}</span>
                                     )}
                                     <span className="text-sm font-normal text-slate-400">kg</span>
                                 </div>
                             </div>
                        </div>
                    </div>
                </div>
            </div>

        </div>
      </div>
    </div>
  );

  return (
    <div className="p-6 md:p-10 bg-gray-50 dark:bg-slate-900 min-h-screen transition-colors duration-200">
      {/* Print-only header */}
      <div className="hidden print-only mb-8 text-center border-b pb-4">
          <h1 className="text-3xl font-bold">JuaAfya Clinic</h1>
          <p>Patient Records Report</p>
          <p className="text-sm text-slate-500">{new Date().toLocaleDateString()}</p>
      </div>

      {selectedPatient ? renderPatientDetail(selectedPatient) : (
          <>
            {/* Edit Patient Modal */}
            {isEditing && editFormData && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in no-print">
                    <div className="bg-white dark:bg-slate-800 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
                        <div className="p-5 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-700/50 sticky top-0 z-10">
                            <h3 className="font-bold text-lg text-slate-900 dark:text-white flex items-center gap-2">
                                <Edit2 className="w-5 h-5 text-teal-600" /> Edit Patient
                            </h3>
                            <button onClick={() => setIsEditing(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5"/></button>
                        </div>
                        <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Full Name</label>
                                <input 
                                    name="name"
                                    value={editFormData.name}
                                    onChange={handleEditChange}
                                    className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none text-slate-900 dark:text-white text-sm"
                                    required
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Phone</label>
                                    <input 
                                        name="phone"
                                        value={editFormData.phone}
                                        onChange={handleEditChange}
                                        className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none text-slate-900 dark:text-white text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Age</label>
                                    <input 
                                        name="age"
                                        type="number"
                                        value={editFormData.age}
                                        onChange={handleEditChange}
                                        className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none text-slate-900 dark:text-white text-sm"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Gender</label>
                                <select 
                                    name="gender"
                                    value={editFormData.gender}
                                    onChange={handleEditChange}
                                    className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none text-slate-900 dark:text-white text-sm"
                                >
                                    <option value={Gender.Male}>Male</option>
                                    <option value={Gender.Female}>Female</option>
                                    <option value={Gender.Other}>Other</option>
                                </select>
                            </div>
                            
                            {/* Vitals Section */}
                            <div className="pt-2">
                                <h4 className="text-xs font-bold text-slate-400 uppercase mb-2">Update Vitals</h4>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">Blood Pressure</label>
                                        <input 
                                            name="bp"
                                            placeholder="120/80"
                                            value={editFormData.vitals?.bp || ''}
                                            onChange={handleEditVitalChange}
                                            className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none text-slate-900 dark:text-white text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">Heart Rate (bpm)</label>
                                        <input 
                                            name="heartRate"
                                            type="number"
                                            placeholder="72"
                                            value={editFormData.vitals?.heartRate || ''}
                                            onChange={handleEditVitalChange}
                                            className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none text-slate-900 dark:text-white text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">Temperature (°C)</label>
                                        <input 
                                            name="temp"
                                            placeholder="36.5"
                                            value={editFormData.vitals?.temp || ''}
                                            onChange={handleEditVitalChange}
                                            className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none text-slate-900 dark:text-white text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">Weight (kg)</label>
                                        <input 
                                            name="weight"
                                            placeholder="70"
                                            value={editFormData.vitals?.weight || ''}
                                            onChange={handleEditVitalChange}
                                            className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none text-slate-900 dark:text-white text-sm"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Notes</label>
                                <textarea 
                                    name="notes"
                                    value={editFormData.notes}
                                    onChange={handleEditChange}
                                    rows={3}
                                    className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none text-slate-900 dark:text-white text-sm resize-none"
                                />
                            </div>
                            <div className="flex gap-3 pt-4">
                                <button 
                                    type="button" 
                                    onClick={() => handleDelete(editFormData.id)}
                                    className="px-4 py-2 text-red-600 dark:text-red-400 font-medium bg-red-50 dark:bg-red-900/20 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors flex items-center justify-center gap-2"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                                <div className="flex-1 flex gap-3">
                                    <button 
                                        type="button" 
                                        onClick={() => setIsEditing(false)}
                                        className="flex-1 py-2 text-slate-600 dark:text-slate-300 font-medium bg-slate-100 dark:bg-slate-700 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button 
                                        type="submit"
                                        className="flex-1 py-2 text-white font-medium bg-teal-600 rounded-lg hover:bg-teal-700 transition-colors flex items-center justify-center gap-2"
                                    >
                                        <Save className="w-4 h-4" /> Save Changes
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Add Patient Modal */}
            {isAdding && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in no-print">
                    <div className="bg-white dark:bg-slate-800 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
                        <div className="p-5 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-700/50 sticky top-0 z-10">
                            <h3 className="font-bold text-lg text-slate-900 dark:text-white flex items-center gap-2">
                                <User className="w-5 h-5 text-teal-600" /> Add New Patient
                            </h3>
                            <button onClick={() => setIsAdding(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5"/></button>
                        </div>
                        <form onSubmit={handleAddSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Full Name</label>
                                <input 
                                    name="name"
                                    value={newPatientData.name}
                                    onChange={handleAddChange}
                                    placeholder="e.g. John Doe"
                                    className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none text-slate-900 dark:text-white text-sm"
                                    required
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Phone</label>
                                    <input 
                                        name="phone"
                                        value={newPatientData.phone}
                                        onChange={handleAddChange}
                                        placeholder="+254..."
                                        className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none text-slate-900 dark:text-white text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Age</label>
                                    <input 
                                        name="age"
                                        type="number"
                                        value={newPatientData.age}
                                        onChange={handleAddChange}
                                        placeholder="0"
                                        className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none text-slate-900 dark:text-white text-sm"
                                        required
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Gender</label>
                                <select 
                                    name="gender"
                                    value={newPatientData.gender}
                                    onChange={handleAddChange}
                                    className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none text-slate-900 dark:text-white text-sm"
                                >
                                    <option value={Gender.Male}>Male</option>
                                    <option value={Gender.Female}>Female</option>
                                    <option value={Gender.Other}>Other</option>
                                </select>
                            </div>

                            {/* Vitals Section */}
                            <div className="pt-2">
                                <h4 className="text-xs font-bold text-slate-400 uppercase mb-2">Initial Vitals (Optional)</h4>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">Blood Pressure</label>
                                        <input 
                                            name="bp"
                                            placeholder="120/80"
                                            value={newPatientData.vitals.bp}
                                            onChange={handleAddVitalChange}
                                            className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none text-slate-900 dark:text-white text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">Heart Rate (bpm)</label>
                                        <input 
                                            name="heartRate"
                                            type="number"
                                            placeholder="72"
                                            value={newPatientData.vitals.heartRate}
                                            onChange={handleAddVitalChange}
                                            className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none text-slate-900 dark:text-white text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">Temperature (°C)</label>
                                        <input 
                                            name="temp"
                                            placeholder="36.5"
                                            value={newPatientData.vitals.temp}
                                            onChange={handleAddVitalChange}
                                            className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none text-slate-900 dark:text-white text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">Weight (kg)</label>
                                        <input 
                                            name="weight"
                                            placeholder="70"
                                            value={newPatientData.vitals.weight}
                                            onChange={handleAddVitalChange}
                                            className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none text-slate-900 dark:text-white text-sm"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Initial Notes</label>
                                <textarea 
                                    name="notes"
                                    value={newPatientData.notes}
                                    onChange={handleAddChange}
                                    rows={3}
                                    placeholder="Reason for visit..."
                                    className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none text-slate-900 dark:text-white text-sm resize-none"
                                />
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button 
                                    type="button" 
                                    onClick={() => setIsAdding(false)}
                                    className="flex-1 py-2 text-slate-600 dark:text-slate-300 font-medium bg-slate-100 dark:bg-slate-700 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="submit"
                                    className="flex-1 py-2 text-white font-medium bg-teal-600 rounded-lg hover:bg-teal-700 transition-colors flex items-center justify-center gap-2"
                                >
                                    <Plus className="w-4 h-4" /> Add Patient
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 no-print">
                <div>
                    <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Patients</h2>
                    <div className="flex gap-2 mt-2">
                        <span className="bg-teal-600 text-white px-3 py-1 rounded-full text-xs font-medium">Daily</span>
                        <span className="bg-white dark:bg-slate-700 text-slate-500 dark:text-slate-300 px-3 py-1 rounded-full text-xs font-medium hover:bg-slate-100 dark:hover:bg-slate-600 cursor-pointer transition-colors">Weekly</span>
                        <span className="bg-white dark:bg-slate-700 text-slate-500 dark:text-slate-300 px-3 py-1 rounded-full text-xs font-medium hover:bg-slate-100 dark:hover:bg-slate-600 cursor-pointer transition-colors">Monthly</span>
                    </div>
                </div>
                
                <div className="flex flex-col sm:flex-row items-center gap-3">
                    {/* Filter Controls */}
                    <div className="flex items-center gap-2">
                        <div className="relative">
                            <select 
                                className="appearance-none bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 pl-3 pr-8 py-2 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 cursor-pointer"
                                value={genderFilter}
                                onChange={(e) => setGenderFilter(e.target.value)}
                            >
                                <option value="All">All Genders</option>
                                <option value="Male">Male</option>
                                <option value="Female">Female</option>
                            </select>
                            <Filter className="w-3 h-3 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                        </div>
                        <div className="relative">
                            <select 
                                className="appearance-none bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 pl-3 pr-8 py-2 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 cursor-pointer"
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                            >
                                <option value="Recent">Sort: Recent</option>
                                <option value="Name">Sort: Name</option>
                                <option value="Age">Sort: Age</option>
                            </select>
                            <Filter className="w-3 h-3 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                        </div>
                    </div>

                    <div className="relative group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 group-focus-within:text-brand-500 transition-colors" />
                        <input 
                            type="text" 
                            placeholder="Search patients..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-9 pr-9 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 dark:text-white rounded-xl text-sm w-full sm:w-64 shadow-sm focus:ring-2 focus:ring-brand-500 focus:outline-none placeholder-slate-400 transition-colors"
                        />
                        {searchTerm && (
                            <button 
                                onClick={() => setSearchTerm('')}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                            >
                                <X className="w-3.5 h-3.5" />
                            </button>
                        )}
                    </div>
                    <button 
                        onClick={() => setIsAdding(true)}
                        className="bg-slate-900 dark:bg-brand-600 text-white p-2 rounded-xl hover:bg-slate-800 dark:hover:bg-brand-700 transition-colors shadow-lg shadow-slate-200 dark:shadow-none"
                    >
                        <Plus className="w-5 h-5" />
                    </button>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-visible transition-colors duration-200 flex flex-col min-h-[400px]">
                <div className="flex-1 overflow-visible">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-gray-50/50 dark:bg-slate-700/50 text-xs uppercase text-slate-400 font-semibold border-b border-gray-100 dark:border-slate-700">
                            <tr>
                                <th className="px-6 py-4">ID</th>
                                <th className="px-6 py-4">Name</th>
                                <th className="px-6 py-4">Age</th>
                                <th className="px-6 py-4">Last Visit</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4">Report</th>
                                <th className="px-6 py-4 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 dark:divide-slate-700 text-sm">
                            {paginatedPatients.length > 0 ? paginatedPatients.map((patient) => (
                                <tr 
                                    key={patient.id} 
                                    className="hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors cursor-pointer group"
                                    onClick={() => setSelectedPatient(patient)}
                                >
                                    <td className="px-6 py-4 font-mono text-slate-500 dark:text-slate-400 text-xs">
                                        #{patient.id}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-600">
                                                <img src={`https://i.pravatar.cc/150?u=${patient.id}`} alt="avatar" className="w-full h-full object-cover" />
                                            </div>
                                            <div>
                                                <div className="font-bold text-slate-900 dark:text-white">{patient.name}</div>
                                                <div className="text-xs text-slate-400">{patient.phone}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-slate-500 dark:text-slate-400 font-medium">{patient.age} years</td>
                                    <td className="px-6 py-4">
                                        <div className="text-slate-900 dark:text-slate-200 font-medium">{patient.lastVisit}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="bg-orange-50 dark:bg-orange-900/30 text-orange-600 dark:text-orange-300 px-3 py-1 rounded-full text-xs font-semibold">
                                            Registered
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2 text-slate-400 hover:text-brand-600 transition-colors">
                                            <FileText className="w-4 h-4" />
                                            <span className="text-xs font-medium">View</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right relative">
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); setActiveMenuId(activeMenuId === patient.id ? null : patient.id); }}
                                            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-600 rounded-full text-slate-400 transition-colors"
                                        >
                                            <MoreHorizontal className="w-5 h-5" />
                                        </button>
                                        
                                        {/* Action Menu */}
                                        {activeMenuId === patient.id && (
                                            <div className="absolute right-8 top-8 w-48 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-100 dark:border-slate-700 z-20 animate-in zoom-in-95 origin-top-right">
                                                <div className="p-1">
                                                    <button onClick={(e) => { e.stopPropagation(); setSelectedPatient(patient); setActiveMenuId(null); }} className="w-full text-left px-3 py-2 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg flex items-center gap-2">
                                                        <Eye className="w-4 h-4" /> View Details
                                                    </button>
                                                    <button onClick={(e) => { e.stopPropagation(); handleEditClick(patient); }} className="w-full text-left px-3 py-2 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg flex items-center gap-2">
                                                        <Edit2 className="w-4 h-4" /> Edit Profile
                                                    </button>
                                                    <div className="h-px bg-slate-100 dark:bg-slate-700 my-1"></div>
                                                    <button onClick={(e) => { e.stopPropagation(); handleDelete(patient.id); }} className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg flex items-center gap-2 font-medium">
                                                        <Trash2 className="w-4 h-4" /> Delete Patient
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                                        No patients found matching your criteria.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                    <div className="p-4 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between mt-auto">
                        <div className="text-sm text-slate-500 dark:text-slate-400">
                            Showing page {currentPage} of {totalPages}
                        </div>
                        <div className="flex gap-2">
                            <button 
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed text-slate-600 dark:text-slate-300"
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </button>
                            <button 
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                                className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed text-slate-600 dark:text-slate-300"
                            >
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                )}
            </div>
          </>
      )}
    </div>
  );
};

export default PatientList;
