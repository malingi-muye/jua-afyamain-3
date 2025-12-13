import React, { useState, useMemo, useEffect } from 'react';
import { Clinic, ApprovalRequest, TeamMember, SaaSTransaction, SaaSPlatformSettings, SystemLog, SupportTicket } from '../types';
import { MOCK_CLINICS, MOCK_REQUESTS, MOCK_SAAS_TRANSACTIONS, MOCK_SYSTEM_LOGS, MOCK_TICKETS } from '../constants';
import { 
  Shield, Activity, DollarSign, Building2, CheckCircle, XCircle, MoreHorizontal, 
  Search, Filter, Smartphone, CreditCard, ChevronDown, Download, AlertTriangle, 
  Settings, ToggleLeft, ToggleRight, Trash2, Eye, Mail, Server, ArrowUpRight, Save,
  FileText, UserCheck, Ban, Check, X, KeyRound, Loader2, PieChart as PieIcon,
  Plus, MessageSquare, RefreshCw, Database, Undo2, Play, Calendar, Landmark, Receipt,
  LifeBuoy, ChevronLeft, ChevronRight, HardDrive, Printer, Copy, Send, User
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, Legend } from 'recharts';

interface SuperAdminDashboardProps {
    currentUser: TeamMember;
    switchUser: (member: TeamMember) => void;
    team: TeamMember[];
    activeTab: 'overview' | 'clinics' | 'approvals' | 'payments' | 'settings' | 'support';
}

const COLORS = {
  primary: '#4f46e5',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  neutral: '#94a3b8',
  dark: '#1e293b'
};

// -- Reusable Pagination Component --
const Pagination: React.FC<{
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
}> = ({ currentPage, totalPages, onPageChange }) => {
    if (totalPages <= 1) return null;
    return (
        <div className="flex justify-between items-center px-6 py-4 border-t border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800">
            <span className="text-sm text-slate-500 dark:text-slate-400">
                Page {currentPage} of {totalPages}
            </span>
            <div className="flex gap-2">
                <button 
                    onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="p-2 border border-slate-200 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 text-slate-600 dark:text-slate-300"
                >
                    <ChevronLeft className="w-4 h-4" />
                </button>
                <button 
                    onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="p-2 border border-slate-200 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 text-slate-600 dark:text-slate-300"
                >
                    <ChevronRight className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
};

const SuperAdminDashboard: React.FC<SuperAdminDashboardProps> = ({ currentUser, switchUser, team, activeTab }) => {
  
  // -- Data State --
  const [clinics, setClinics] = useState<Clinic[]>(MOCK_CLINICS);
  const [requests, setRequests] = useState<ApprovalRequest[]>(MOCK_REQUESTS);
  const [transactions, setTransactions] = useState<SaaSTransaction[]>(MOCK_SAAS_TRANSACTIONS);
  const [systemLogs, setSystemLogs] = useState<SystemLog[]>(MOCK_SYSTEM_LOGS);
  const [supportTickets, setSupportTickets] = useState<SupportTicket[]>(MOCK_TICKETS);
  const [platformSettings, setPlatformSettings] = useState<SaaSPlatformSettings>({
      maintenanceMode: false,
      allowNewRegistrations: true,
      globalAnnouncement: '',
      pricing: { free: 0, pro: 5000, enterprise: 15000 }
  });

  // -- Pagination State --
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // -- UI State --
  const [isProcessing, setIsProcessing] = useState<string | null>(null); // Stores ID of processing item or 'global'
  const [toast, setToast] = useState<{message: string, type: 'success' | 'error' | 'info'} | null>(null);
  const [settingsSubTab, setSettingsSubTab] = useState<'general' | 'pricing' | 'logs' | 'backups'>('general');
  const [paymentsSubTab, setPaymentsSubTab] = useState<'transactions' | 'subscriptions' | 'gateways'>('transactions');

  // -- Modal State --
  const [showAddClinic, setShowAddClinic] = useState(false);
  const [showBroadcast, setShowBroadcast] = useState(false);
  const [showRecordPayment, setShowRecordPayment] = useState(false);
  const [selectedClinic, setSelectedClinic] = useState<Clinic | null>(null);
  const [actionMenuOpenId, setActionMenuOpenId] = useState<string | null>(null);
  
  // New Modals
  const [showInvoice, setShowInvoice] = useState(false);
  const [currentInvoiceData, setCurrentInvoiceData] = useState<any>(null);
  
  const [showBackupProgress, setShowBackupProgress] = useState(false);
  const [backupType, setBackupType] = useState<'create' | 'restore'>('create');
  const [backupProgress, setBackupProgress] = useState(0);

  // Ticket Modal
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [ticketReply, setTicketReply] = useState('');
  const [supportSearch, setSupportSearch] = useState('');
  const [supportStatusFilter, setSupportStatusFilter] = useState<'All' | 'Open' | 'Resolved' | 'In Progress'>('All');

  // -- Forms --
  const [newClinicForm, setNewClinicForm] = useState({ name: '', owner: '', email: '', plan: 'Free' });
  const [broadcastMsg, setBroadcastMsg] = useState('');
  const [logFilter, setLogFilter] = useState({ type: 'All', search: '' });
  
  // Payment Recording Form
  const [recordPaymentForm, setRecordPaymentForm] = useState({ 
      clinicId: '', 
      amount: '', 
      date: new Date().toISOString().split('T')[0], 
      method: 'Bank Transfer', 
      ref: '' 
  });

  // Gateway Config (Local Mock)
  const [gatewayConfig, setGatewayConfig] = useState({
      mpesa: { paybill: '522522', account: 'JUAAFYA', name: 'JuaAfya Ltd' },
      bank: { name: 'KCB Bank', branch: 'Head Office', account: '1100223344', swift: 'KCBLKENX' }
  });

  // -- Filter State --
  const [clinicSearch, setClinicSearch] = useState('');
  const [clinicStatusFilter, setClinicStatusFilter] = useState<'All' | 'Active' | 'Suspended'>('All');
  const [clinicPlanFilter, setClinicPlanFilter] = useState<'All' | 'Free' | 'Pro' | 'Enterprise'>('All');
  
  const [transactionSearch, setTransactionSearch] = useState('');
  const [transactionStatusFilter, setTransactionStatusFilter] = useState<'All' | 'Success' | 'Pending' | 'Failed'>('All');

  const [approvalFilter, setApprovalFilter] = useState<'All' | 'Pending' | 'Approved' | 'Rejected'>('All');

  // -- Effects --
  useEffect(() => {
      if (toast) {
          const timer = setTimeout(() => setToast(null), 3000);
          return () => clearTimeout(timer);
      }
  }, [toast]);

  // Reset pagination on tab switch
  useEffect(() => {
      setCurrentPage(1);
  }, [activeTab, settingsSubTab, paymentsSubTab, supportStatusFilter]);

  const showNotification = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
      setToast({ message, type });
  };

  const simulateAsyncAction = async (id: string, action: () => void) => {
      setIsProcessing(id);
      await new Promise(resolve => setTimeout(resolve, 800)); // Simulate network
      action();
      setIsProcessing(null);
  };

  const copyToClipboard = (text: string) => {
      navigator.clipboard.writeText(text);
      showNotification('Copied to clipboard', 'info');
  };

  // -- Derived Stats --
  const stats = useMemo(() => ({
      totalClinics: clinics.length,
      activeClinics: clinics.filter(c => c.status === 'Active').length,
      pendingRequests: requests.filter(r => r.status === 'Pending').length,
      monthlyRevenue: transactions.filter(t => t.status === 'Success').reduce((acc, t) => acc + t.amount, 0),
      failedPayments: transactions.filter(t => t.status === 'Failed').length,
      openTickets: supportTickets.filter(t => t.status !== 'Resolved').length
  }), [clinics, requests, transactions, supportTickets]);

  const planDistribution = useMemo(() => [
      { name: 'Free', value: clinics.filter(c => c.plan === 'Free').length, color: COLORS.neutral },
      { name: 'Pro', value: clinics.filter(c => c.plan === 'Pro').length, color: COLORS.primary },
      { name: 'Enterprise', value: clinics.filter(c => c.plan === 'Enterprise').length, color: COLORS.success }
  ], [clinics]);

  const recentRevenue = useMemo(() => {
      return transactions.slice(0, 5).map(t => ({
          name: t.date.split('-').slice(1).join('/'),
          amount: t.amount
      })).reverse();
  }, [transactions]);

  // -- Helpers --
  const exportToCSV = (data: any[], filename: string) => {
      if (!data.length) {
          showNotification('No data available to export', 'error');
          return;
      }
      const headers = Object.keys(data[0]);
      const rows = data.map(obj => headers.map(header => JSON.stringify(obj[header])).join(','));
      const csvContent = [headers.join(','), ...rows].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showNotification('Export started successfully', 'success');
  };

  // -- Handlers --

  const handleBackupOperation = (type: 'create' | 'restore') => {
      if (type === 'restore' && !confirm("CRITICAL WARNING: This will overwrite live data with the selected snapshot. Are you absolutely sure?")) return;
      
      setBackupType(type);
      setShowBackupProgress(true);
      setBackupProgress(0);

      // Simulate Progress
      let progress = 0;
      const interval = setInterval(() => {
          progress += Math.floor(Math.random() * 10) + 5;
          if (progress >= 100) {
              progress = 100;
              clearInterval(interval);
              setTimeout(() => {
                  setShowBackupProgress(false);
                  showNotification(type === 'create' ? 'System snapshot created successfully.' : 'System restored from backup.', 'success');
              }, 500);
          }
          setBackupProgress(progress);
      }, 200);
  };

  const handleGenerateInvoice = (transaction: SaaSTransaction | null, clinic?: Clinic) => {
      // If transaction exists, show receipt. If clinic passed, generate new invoice preview.
      const data = transaction || {
          id: `INV-${Date.now()}`,
          clinicName: clinic?.name || 'Unknown Clinic',
          amount: clinic ? platformSettings.pricing[clinic.plan.toLowerCase() as keyof typeof platformSettings.pricing] : 0,
          date: new Date().toISOString().split('T')[0],
          status: 'Unpaid',
          method: 'Pending',
          plan: clinic?.plan || 'Pro'
      };
      setCurrentInvoiceData(data);
      setShowInvoice(true);
  };

  // ... (Existing handlers: handleRecordPayment, handleSaveGateways, etc. preserved) ...
  const handleRecordPayment = () => {
      if (!recordPaymentForm.clinicId || !recordPaymentForm.amount) return;
      
      simulateAsyncAction('record-payment', () => {
          // 1. Create Transaction
          const clinic = clinics.find(c => c.id === recordPaymentForm.clinicId);
          if (!clinic) return;

          const newTx: SaaSTransaction = {
              id: `TX-${Date.now()}`,
              clinicName: clinic.name,
              amount: parseFloat(recordPaymentForm.amount),
              date: recordPaymentForm.date,
              status: 'Success',
              method: recordPaymentForm.method as any,
              plan: clinic.plan
          };
          setTransactions(prev => [newTx, ...prev]);

          // 2. Update Clinic Dates (Add 1 month to nextPaymentDate)
          const nextDate = new Date(clinic.nextPaymentDate !== '-' ? clinic.nextPaymentDate : new Date());
          nextDate.setMonth(nextDate.getMonth() + 1);
          
          setClinics(prev => prev.map(c => c.id === clinic.id ? {
              ...c,
              lastPaymentDate: recordPaymentForm.date,
              nextPaymentDate: nextDate.toISOString().split('T')[0],
              revenueYTD: c.revenueYTD + parseFloat(recordPaymentForm.amount)
          } : c));

          setShowRecordPayment(false);
          setRecordPaymentForm({ clinicId: '', amount: '', date: new Date().toISOString().split('T')[0], method: 'Bank Transfer', ref: '' });
          showNotification('Payment recorded & subscription extended', 'success');
      });
  };

  const handleSaveGateways = () => {
      simulateAsyncAction('save-gateways', () => {
          showNotification('Payment gateway settings updated', 'success');
      });
  };

  const handleApproveRequest = (id: string) => {
      const request = requests.find(r => r.id === id);
      simulateAsyncAction(id, () => {
          setRequests(prev => prev.map(r => r.id === id ? { ...r, status: 'Approved' } : r));
          
          if (request?.type === 'New Clinic') {
              const newClinic: Clinic = {
                  id: `C${Date.now()}`,
                  name: request.clinicName,
                  ownerName: request.requesterName,
                  email: `admin@${request.clinicName.toLowerCase().replace(/\s/g, '')}.com`,
                  plan: 'Free',
                  status: 'Active',
                  joinedDate: new Date().toISOString().split('T')[0],
                  lastPaymentDate: '-',
                  nextPaymentDate: '-',
                  revenueYTD: 0
              };
              setClinics(prev => [newClinic, ...prev]);
              showNotification(`Clinic "${newClinic.name}" provisioned successfully`, 'success');
          } else {
              showNotification('Request processed successfully', 'success');
          }
      });
  };

  const handleRejectRequest = (id: string) => {
      simulateAsyncAction(id, () => {
          setRequests(prev => prev.map(r => r.id === id ? { ...r, status: 'Rejected' } : r));
          showNotification('Request rejected', 'info');
      });
  };

  const handleSuspendClinic = (id: string) => {
      simulateAsyncAction(id, () => {
          setClinics(prev => prev.map(c => c.id === id ? { ...c, status: c.status === 'Suspended' ? 'Active' : 'Suspended' } : c));
          setActionMenuOpenId(null);
          showNotification('Clinic status updated', 'success');
      });
  };

  const handleDeleteClinic = (id: string) => {
      if(confirm('Are you sure? This deletes all tenant data and cannot be undone.')) {
          simulateAsyncAction(id, () => {
              setClinics(prev => prev.filter(c => c.id !== id));
              setActionMenuOpenId(null);
              showNotification('Clinic deleted permanently', 'info');
          });
      }
  };

  const handleProvisionNewClinic = () => {
      if (!newClinicForm.name || !newClinicForm.email) return;
      simulateAsyncAction('add-clinic', () => {
          const newClinic: Clinic = {
              id: `C${Date.now()}`,
              name: newClinicForm.name,
              ownerName: newClinicForm.owner,
              email: newClinicForm.email,
              plan: newClinicForm.plan as any,
              status: 'Active',
              joinedDate: new Date().toISOString().split('T')[0],
              lastPaymentDate: '-',
              nextPaymentDate: '-',
              revenueYTD: 0
          };
          setClinics(prev => [newClinic, ...prev]);
          setShowAddClinic(false);
          setNewClinicForm({ name: '', owner: '', email: '', plan: 'Free' });
          showNotification('New clinic onboarded successfully', 'success');
      });
  };

  const handleRefund = (txId: string) => {
      if (!confirm("Process refund for this transaction?")) return;
      simulateAsyncAction(txId, () => {
          setTransactions(prev => prev.map(t => t.id === txId ? { ...t, status: 'Failed' } : t)); 
          showNotification(`Refund processed for ${txId}`, 'success');
      });
  };

  const toggleSettings = (field: keyof SaaSPlatformSettings) => {
      setPlatformSettings(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const handleBroadcast = () => {
      if (!broadcastMsg) return;
      simulateAsyncAction('broadcast', () => {
          setPlatformSettings(prev => ({ ...prev, globalAnnouncement: broadcastMsg }));
          setShowBroadcast(false);
          setBroadcastMsg('');
          showNotification('Global announcement updated', 'success');
      });
  };

  const handleImpersonate = (clinic: Clinic) => {
      const targetUser = team.find(t => t.email === clinic.email || t.name === clinic.ownerName);
      if (confirm(`Security Audit: You are about to sign in as an Admin for "${clinic.name}". All actions will be logged.`)) {
          simulateAsyncAction('impersonate', () => {
              if (targetUser) {
                  showNotification(`Impersonation active. Redirecting to ${clinic.name}...`, 'success');
                  setTimeout(() => switchUser(targetUser), 1000);
              } else {
                  showNotification(`Simulated login as ${clinic.ownerName}. (User not found in demo session)`, 'info');
              }
          });
      }
  };

  const handleResetPassword = (email: string) => {
      simulateAsyncAction('reset-pwd', () => {
          showNotification(`Password reset instructions sent to ${email}`, 'success');
      });
  };

  const handleEmailOwner = (email: string) => {
      window.location.href = `mailto:${email}`;
  };

  const handleSaveSettings = () => {
      simulateAsyncAction('save-settings', () => {
          showNotification('Platform configuration saved successfully.', 'success');
      });
  };

  const handleSavePricing = () => {
      simulateAsyncAction('save-pricing', () => {
          showNotification('Pricing tiers updated and published.', 'success');
      });
  };

  const handleResolveTicket = (id: string) => {
      simulateAsyncAction(id, () => {
          setSupportTickets(prev => prev.map(t => t.id === id ? {...t, status: 'Resolved'} : t));
          if (selectedTicket && selectedTicket.id === id) {
              setSelectedTicket(prev => prev ? {...prev, status: 'Resolved'} : null);
          }
          showNotification('Ticket marked as resolved', 'success');
      });
  };

  const handleSendReply = () => {
      if (!selectedTicket || !ticketReply.trim()) return;
      
      simulateAsyncAction('reply', () => {
          // In a real app, this would append to a message list
          const updatedTicket = {
              ...selectedTicket, 
              lastUpdate: 'Just now',
              status: selectedTicket.status === 'Resolved' ? 'In Progress' : selectedTicket.status
          };
          
          setSupportTickets(prev => prev.map(t => t.id === selectedTicket.id ? updatedTicket : t));
          setSelectedTicket(updatedTicket);
          setTicketReply('');
          showNotification('Reply sent successfully', 'success');
      });
  };

  // -- Render Methods --

  const renderOverview = () => (
      <div className="space-y-6 animate-in fade-in">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700">
                  <div className="flex justify-between items-start">
                      <div>
                          <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Total Clinics</p>
                          <h3 className="text-3xl font-bold text-slate-900 dark:text-white mt-1">{stats.totalClinics}</h3>
                      </div>
                      <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 rounded-xl"><Building2 className="w-6 h-6"/></div>
                  </div>
                  <div className="mt-4 flex items-center text-sm text-indigo-600 font-medium"><span className="mr-1">↑ 2</span> new this month</div>
              </div>
              <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700">
                  <div className="flex justify-between items-start">
                      <div>
                          <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Recurring Revenue (MRR)</p>
                          <h3 className="text-3xl font-bold text-slate-900 dark:text-white mt-1">KSh {stats.monthlyRevenue.toLocaleString()}</h3>
                      </div>
                      <div className="p-3 bg-green-50 dark:bg-green-900/20 text-green-600 rounded-xl"><DollarSign className="w-6 h-6"/></div>
                  </div>
                  <div className="mt-4 flex items-center text-sm text-green-600 font-medium"><span className="mr-1">↑ 15%</span> vs last month</div>
              </div>
              <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700">
                  <div className="flex justify-between items-start">
                      <div>
                          <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Pending Approvals</p>
                          <h3 className="text-3xl font-bold text-slate-900 dark:text-white mt-1">{stats.pendingRequests}</h3>
                      </div>
                      <div className="p-3 bg-orange-50 dark:bg-orange-900/20 text-orange-600 rounded-xl"><Activity className="w-6 h-6"/></div>
                  </div>
                  <div className="mt-4 flex items-center text-sm text-slate-500 font-medium">Requires attention</div>
              </div>
              <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700">
                  <div className="flex justify-between items-start">
                      <div>
                          <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">System Status</p>
                          <h3 className="text-xl font-bold text-green-600 mt-2 flex items-center gap-2">
                            <CheckCircle className="w-5 h-5"/> {platformSettings.maintenanceMode ? 'Maintenance' : 'Operational'}
                          </h3>
                      </div>
                      <div className="p-3 bg-teal-50 dark:bg-teal-900/20 text-teal-600 rounded-xl"><Server className="w-6 h-6"/></div>
                  </div>
                  <div className="mt-4 flex items-center gap-3">
                      <div className="flex-1 bg-slate-100 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                          <div className="bg-green-500 w-[92%] h-full"></div>
                      </div>
                      <span className="text-xs font-medium text-slate-500">99.9% Uptime</span>
                  </div>
              </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
               {/* Quick Actions & Activity */}
               <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col">
                  <div className="flex justify-between items-center mb-6">
                       <h3 className="font-bold text-slate-900 dark:text-white">Quick Actions</h3>
                       <button onClick={() => setShowBroadcast(true)} className="text-xs font-bold text-teal-600 hover:text-teal-700 flex items-center gap-1">
                           <MessageSquare className="w-4 h-4" /> Broadcast
                       </button>
                  </div>
                  <div className="flex-1 space-y-4">
                      {requests.slice(0, 3).map(req => (
                          <div key={req.id} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700/30 rounded-xl border border-slate-100 dark:border-slate-700">
                              <div>
                                  <p className="font-bold text-slate-900 dark:text-white text-sm">{req.clinicName}</p>
                                  <p className="text-xs text-slate-500">{req.type} • {req.requesterName}</p>
                              </div>
                              <span className={`px-2 py-1 rounded text-xs font-bold ${
                                  req.status === 'Pending' ? 'bg-orange-100 text-orange-700' :
                                  req.status === 'Approved' ? 'bg-green-100 text-green-700' :
                                  'bg-red-100 text-red-700'
                              }`}>{req.status}</span>
                          </div>
                      ))}
                      {requests.length === 0 && <p className="text-center text-slate-400 text-sm py-4">No pending requests.</p>}
                  </div>
               </div>

               {/* Growth Chart */}
               <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700">
                   <h3 className="font-bold text-slate-900 dark:text-white mb-6">Platform Growth (Active Clinics)</h3>
                   <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={[
                                {name: 'Jan', val: 12}, {name: 'Feb', val: 15}, {name: 'Mar', val: 22}, 
                                {name: 'Apr', val: 28}, {name: 'May', val: 35}, {name: 'Jun', val: 42}
                            ]}>
                                <defs>
                                <linearGradient id="colorGrowth" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor={COLORS.primary} stopOpacity={0.3}/>
                                    <stop offset="95%" stopColor={COLORS.primary} stopOpacity={0}/>
                                </linearGradient>
                                </defs>
                                <CartesianGrid vertical={false} stroke="#e2e8f0" strokeOpacity={0.3} strokeDasharray="4 4" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11}} />
                                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11}} />
                                <Tooltip contentStyle={{backgroundColor: '#1e293b', borderRadius: '8px', border: 'none', color: '#fff'}} />
                                <Area type="monotone" dataKey="val" stroke={COLORS.primary} strokeWidth={3} fill="url(#colorGrowth)" />
                            </AreaChart>
                        </ResponsiveContainer>
                   </div>
               </div>
          </div>
      </div>
  );

  const renderSupport = () => {
      const statusColors = { 'Open': 'bg-red-100 text-red-700 border-red-200', 'In Progress': 'bg-orange-100 text-orange-700 border-orange-200', 'Resolved': 'bg-green-100 text-green-700 border-green-200' };
      const priorityColors = { 'Low': 'text-slate-500 bg-slate-100', 'Medium': 'text-blue-600 bg-blue-50', 'High': 'text-orange-600 bg-orange-50', 'Critical': 'text-red-600 bg-red-50' };

      const filteredTickets = supportTickets.filter(t => {
          const matchSearch = t.clinicName.toLowerCase().includes(supportSearch.toLowerCase()) || t.subject.toLowerCase().includes(supportSearch.toLowerCase());
          const matchStatus = supportStatusFilter === 'All' || t.status === supportStatusFilter;
          return matchSearch && matchStatus;
      });

      return (
          <div className="space-y-6 animate-in fade-in">
              <div className="flex gap-4">
                  <div className="flex-1 bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 flex items-center justify-between">
                      <div>
                          <p className="text-slate-500 text-xs font-bold uppercase">Open Tickets</p>
                          <h3 className="text-3xl font-bold text-slate-900 dark:text-white mt-1">{stats.openTickets}</h3>
                      </div>
                      <LifeBuoy className="w-8 h-8 text-indigo-500 opacity-50"/>
                  </div>
                  <div className="flex-1 bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 flex items-center justify-between">
                      <div>
                          <p className="text-slate-500 text-xs font-bold uppercase">Critical Issues</p>
                          <h3 className="text-3xl font-bold text-red-600 mt-1">{supportTickets.filter(t => t.priority === 'Critical').length}</h3>
                      </div>
                      <AlertTriangle className="w-8 h-8 text-red-500 opacity-50"/>
                  </div>
              </div>

              {/* Toolbar */}
              <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col sm:flex-row justify-between items-center gap-4">
                  <div className="flex gap-4 w-full sm:w-auto">
                      <div className="relative flex-1 sm:w-64">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                          <input 
                              placeholder="Search tickets..." 
                              value={supportSearch}
                              onChange={(e) => setSupportSearch(e.target.value)}
                              className="w-full pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-slate-700 rounded-xl text-sm outline-none dark:text-white border border-slate-200 dark:border-slate-600" 
                          />
                      </div>
                      <div className="relative">
                          <select 
                              value={supportStatusFilter}
                              onChange={(e) => setSupportStatusFilter(e.target.value as any)}
                              className="appearance-none bg-slate-50 dark:bg-slate-700 px-4 py-2.5 pr-8 rounded-xl text-sm font-medium outline-none dark:text-white border border-slate-200 dark:border-slate-600 cursor-pointer h-full"
                          >
                              <option value="All">All Status</option>
                              <option value="Open">Open</option>
                              <option value="In Progress">In Progress</option>
                              <option value="Resolved">Resolved</option>
                          </select>
                          <Filter className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400 pointer-events-none" />
                      </div>
                  </div>
              </div>

              <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden min-h-[400px]">
                  <table className="w-full text-left text-sm">
                      <thead className="bg-slate-50 dark:bg-slate-700/50 text-xs uppercase text-slate-400 font-semibold border-b border-slate-100 dark:border-slate-700">
                          <tr>
                              <th className="px-6 py-4">ID</th>
                              <th className="px-6 py-4">Clinic</th>
                              <th className="px-6 py-4">Subject</th>
                              <th className="px-6 py-4">Priority</th>
                              <th className="px-6 py-4">Status</th>
                              <th className="px-6 py-4">Last Update</th>
                              <th className="px-6 py-4 text-right">Action</th>
                          </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50 dark:divide-slate-700">
                          {filteredTickets.map(ticket => (
                              <tr key={ticket.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                                  <td className="px-6 py-4 font-mono text-xs text-slate-500">{ticket.id}</td>
                                  <td className="px-6 py-4 font-bold text-slate-900 dark:text-white">{ticket.clinicName}</td>
                                  <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{ticket.subject}</td>
                                  <td className="px-6 py-4">
                                      <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${priorityColors[ticket.priority]}`}>
                                          {ticket.priority}
                                      </span>
                                  </td>
                                  <td className="px-6 py-4">
                                      <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase border ${statusColors[ticket.status]}`}>
                                          {ticket.status}
                                      </span>
                                  </td>
                                  <td className="px-6 py-4 text-slate-500 text-xs">{ticket.lastUpdate}</td>
                                  <td className="px-6 py-4 text-right">
                                      <div className="flex justify-end gap-2">
                                          <button 
                                            onClick={() => setSelectedTicket(ticket)}
                                            className="px-3 py-1.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg text-xs font-bold transition-colors flex items-center gap-1"
                                          >
                                              <Eye className="w-3 h-3" /> View
                                          </button>
                                      </div>
                                  </td>
                              </tr>
                          ))}
                      </tbody>
                  </table>
                  {filteredTickets.length === 0 && (
                      <div className="p-12 text-center text-slate-400">
                          <LifeBuoy className="w-12 h-12 mx-auto mb-4 opacity-20" />
                          <p>No matching tickets found.</p>
                      </div>
                  )}
              </div>
          </div>
      );
  }

  const renderClinics = () => {
      const filteredClinics = clinics.filter(c => {
          const matchSearch = c.name.toLowerCase().includes(clinicSearch.toLowerCase()) || c.ownerName.toLowerCase().includes(clinicSearch.toLowerCase());
          const matchStatus = clinicStatusFilter === 'All' || c.status === clinicStatusFilter;
          const matchPlan = clinicPlanFilter === 'All' || c.plan === clinicPlanFilter;
          return matchSearch && matchStatus && matchPlan;
      });

      return (
          <div className="space-y-6 animate-in fade-in">
              <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
                  <div className="flex items-center gap-3 w-full sm:w-auto">
                      <div className="relative flex-1 sm:w-64">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                          <input 
                              placeholder="Search clinics..." 
                              value={clinicSearch}
                              onChange={(e) => setClinicSearch(e.target.value)}
                              className="w-full pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-slate-700 rounded-xl text-sm outline-none dark:text-white border border-slate-200 dark:border-slate-600" 
                          />
                      </div>
                      <div className="flex gap-2">
                          <select value={clinicStatusFilter} onChange={(e) => setClinicStatusFilter(e.target.value as any)} className="bg-slate-50 dark:bg-slate-700 px-3 py-2.5 rounded-xl text-sm outline-none dark:text-white border border-slate-200 dark:border-slate-600 cursor-pointer">
                              <option value="All">All Status</option>
                              <option value="Active">Active</option>
                              <option value="Suspended">Suspended</option>
                          </select>
                      </div>
                  </div>
                  <button onClick={() => setShowAddClinic(true)} className="bg-indigo-600 text-white px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-indigo-700 transition-colors flex items-center gap-2 shadow-lg shadow-indigo-200 dark:shadow-none w-full sm:w-auto justify-center">
                      <Plus className="w-4 h-4" /> Add Clinic
                  </button>
              </div>

              <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
                  <table className="w-full text-left text-sm">
                      <thead className="bg-slate-50 dark:bg-slate-700/50 text-xs uppercase text-slate-400 font-semibold border-b border-slate-100 dark:border-slate-700">
                          <tr>
                              <th className="px-6 py-4">Clinic Name</th>
                              <th className="px-6 py-4">Owner</th>
                              <th className="px-6 py-4">Plan</th>
                              <th className="px-6 py-4">Status</th>
                              <th className="px-6 py-4">Revenue YTD</th>
                              <th className="px-6 py-4 text-right">Actions</th>
                          </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50 dark:divide-slate-700">
                          {filteredClinics.map(clinic => (
                              <tr key={clinic.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                                  <td className="px-6 py-4 font-bold text-slate-900 dark:text-white">{clinic.name}</td>
                                  <td className="px-6 py-4 text-slate-600 dark:text-slate-300">
                                      <div className="flex flex-col">
                                          <span>{clinic.ownerName}</span>
                                          <span className="text-xs text-slate-400">{clinic.email}</span>
                                      </div>
                                  </td>
                                  <td className="px-6 py-4">
                                      <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${
                                          clinic.plan === 'Enterprise' ? 'bg-purple-100 text-purple-700' : 
                                          clinic.plan === 'Pro' ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-600'
                                      }`}>{clinic.plan}</span>
                                  </td>
                                  <td className="px-6 py-4">
                                      <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${
                                          clinic.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                      }`}>{clinic.status}</span>
                                  </td>
                                  <td className="px-6 py-4 font-mono text-slate-700 dark:text-slate-300">KSh {clinic.revenueYTD.toLocaleString()}</td>
                                  <td className="px-6 py-4 text-right">
                                      <div className="flex justify-end gap-2">
                                          <button onClick={() => handleImpersonate(clinic)} className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg" title="Login as Admin">
                                              <KeyRound className="w-4 h-4" />
                                          </button>
                                          <button onClick={() => handleSuspendClinic(clinic.id)} className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg" title={clinic.status === 'Active' ? 'Suspend' : 'Activate'}>
                                              <Ban className="w-4 h-4" />
                                          </button>
                                          <button onClick={() => handleDeleteClinic(clinic.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg" title="Delete">
                                              <Trash2 className="w-4 h-4" />
                                          </button>
                                      </div>
                                  </td>
                              </tr>
                          ))}
                      </tbody>
                  </table>
              </div>
          </div>
      );
  };

  const renderApprovals = () => {
      const filteredRequests = requests.filter(r => approvalFilter === 'All' || r.status === approvalFilter);

      return (
          <div className="space-y-6 animate-in fade-in">
              <div className="flex items-center gap-4 bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
                  <span className="text-sm font-bold text-slate-500">Filter Status:</span>
                  <div className="flex gap-2">
                      {['All', 'Pending', 'Approved', 'Rejected'].map(status => (
                          <button
                              key={status}
                              onClick={() => setApprovalFilter(status as any)}
                              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                  approvalFilter === status 
                                  ? 'bg-indigo-600 text-white' 
                                  : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                              }`}
                          >
                              {status}
                          </button>
                      ))}
                  </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredRequests.map(req => (
                      <div key={req.id} className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 relative overflow-hidden group">
                          <div className={`absolute top-0 left-0 w-1.5 h-full ${
                              req.status === 'Pending' ? 'bg-orange-500' : req.status === 'Approved' ? 'bg-green-500' : 'bg-red-500'
                          }`}></div>
                          <div className="flex justify-between items-start mb-4 pl-2">
                              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">{req.type}</span>
                              <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                                  req.status === 'Pending' ? 'bg-orange-100 text-orange-700' : 
                                  req.status === 'Approved' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                              }`}>{req.status}</span>
                          </div>
                          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1 pl-2">{req.clinicName}</h3>
                          <p className="text-sm text-slate-500 pl-2 mb-4">Requester: {req.requesterName}</p>
                          <div className="bg-slate-50 dark:bg-slate-700/50 p-3 rounded-xl mb-4 ml-2">
                              <p className="text-xs text-slate-600 dark:text-slate-300 italic">"{req.details}"</p>
                          </div>
                          <div className="flex gap-2 pl-2">
                              {req.status === 'Pending' && (
                                  <>
                                      <button 
                                          onClick={() => handleApproveRequest(req.id)}
                                          disabled={isProcessing === req.id}
                                          className="flex-1 py-2 bg-green-600 text-white rounded-lg text-xs font-bold hover:bg-green-700 flex items-center justify-center gap-1 disabled:opacity-50"
                                      >
                                          {isProcessing === req.id ? <Loader2 className="w-3 h-3 animate-spin"/> : <Check className="w-3 h-3"/>} Approve
                                      </button>
                                      <button 
                                          onClick={() => handleRejectRequest(req.id)}
                                          disabled={isProcessing === req.id}
                                          className="flex-1 py-2 bg-white border border-red-200 text-red-600 rounded-lg text-xs font-bold hover:bg-red-50 flex items-center justify-center gap-1 disabled:opacity-50"
                                      >
                                          <X className="w-3 h-3"/> Reject
                                      </button>
                                  </>
                              )}
                              {req.status !== 'Pending' && (
                                  <button className="flex-1 py-2 bg-slate-100 dark:bg-slate-700 text-slate-500 rounded-lg text-xs font-bold cursor-default">
                                      Processed
                                  </button>
                              )}
                          </div>
                      </div>
                  ))}
                  {filteredRequests.length === 0 && <div className="col-span-full text-center py-12 text-slate-400">No requests found.</div>}
              </div>
          </div>
      );
  };

  const renderPayments = () => {
      const filteredTransactions = transactions.filter(t => {
          const matchSearch = t.clinicName.toLowerCase().includes(transactionSearch.toLowerCase()) || t.id.toLowerCase().includes(transactionSearch.toLowerCase());
          const matchStatus = transactionStatusFilter === 'All' || t.status === transactionStatusFilter;
          return matchSearch && matchStatus;
      });

      return (
          <div className="space-y-6 animate-in fade-in">
              {/* Payments Sub-nav */}
              <div className="flex bg-slate-100 dark:bg-slate-800/50 p-1 rounded-xl w-fit">
                  {['transactions', 'gateways'].map(tab => (
                      <button
                          key={tab}
                          onClick={() => setPaymentsSubTab(tab as any)}
                          className={`px-4 py-2 rounded-lg text-sm font-bold transition-all capitalize ${
                              paymentsSubTab === tab ? 'bg-white dark:bg-slate-700 shadow text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400'
                          }`}
                      >
                          {tab}
                      </button>
                  ))}
              </div>

              {paymentsSubTab === 'transactions' && (
                  <>
                      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
                          <div className="flex items-center gap-3 w-full sm:w-auto">
                              <div className="relative flex-1 sm:w-64">
                                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                  <input 
                                      placeholder="Search transaction..." 
                                      value={transactionSearch}
                                      onChange={(e) => setTransactionSearch(e.target.value)}
                                      className="w-full pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-slate-700 rounded-xl text-sm outline-none dark:text-white border border-slate-200 dark:border-slate-600" 
                                  />
                              </div>
                              <select value={transactionStatusFilter} onChange={(e) => setTransactionStatusFilter(e.target.value as any)} className="bg-slate-50 dark:bg-slate-700 px-3 py-2.5 rounded-xl text-sm outline-none dark:text-white border border-slate-200 dark:border-slate-600 cursor-pointer">
                                  <option value="All">All Status</option>
                                  <option value="Success">Success</option>
                                  <option value="Pending">Pending</option>
                                  <option value="Failed">Failed</option>
                              </select>
                          </div>
                          <button onClick={() => setShowRecordPayment(true)} className="bg-indigo-600 text-white px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-indigo-700 transition-colors flex items-center gap-2 shadow-lg shadow-indigo-200 dark:shadow-none">
                              <Plus className="w-4 h-4" /> Record Payment
                          </button>
                      </div>

                      <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
                          <table className="w-full text-left text-sm">
                              <thead className="bg-slate-50 dark:bg-slate-700/50 text-xs uppercase text-slate-400 font-semibold border-b border-slate-100 dark:border-slate-700">
                                  <tr>
                                      <th className="px-6 py-4">Transaction ID</th>
                                      <th className="px-6 py-4">Clinic</th>
                                      <th className="px-6 py-4">Date</th>
                                      <th className="px-6 py-4">Plan</th>
                                      <th className="px-6 py-4">Amount</th>
                                      <th className="px-6 py-4">Method</th>
                                      <th className="px-6 py-4 text-center">Status</th>
                                      <th className="px-6 py-4 text-right">Actions</th>
                                  </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-50 dark:divide-slate-700">
                                  {filteredTransactions.map(tx => (
                                      <tr key={tx.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                                          <td className="px-6 py-4 font-mono text-xs text-slate-500">{tx.id}</td>
                                          <td className="px-6 py-4 font-bold text-slate-900 dark:text-white">{tx.clinicName}</td>
                                          <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{tx.date}</td>
                                          <td className="px-6 py-4">{tx.plan}</td>
                                          <td className="px-6 py-4 font-mono font-bold">KSh {tx.amount.toLocaleString()}</td>
                                          <td className="px-6 py-4 text-xs text-slate-500">{tx.method}</td>
                                          <td className="px-6 py-4 text-center">
                                              <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${
                                                  tx.status === 'Success' ? 'bg-green-100 text-green-700' :
                                                  tx.status === 'Pending' ? 'bg-orange-100 text-orange-700' :
                                                  'bg-red-100 text-red-700'
                                              }`}>{tx.status}</span>
                                          </td>
                                          <td className="px-6 py-4 text-right">
                                              <div className="flex justify-end gap-2">
                                                  <button onClick={() => handleGenerateInvoice(tx)} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg" title="View Receipt">
                                                      <Receipt className="w-4 h-4" />
                                                  </button>
                                                  {tx.status === 'Success' && (
                                                      <button onClick={() => handleRefund(tx.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg" title="Refund">
                                                          <Undo2 className="w-4 h-4" />
                                                      </button>
                                                  )}
                                              </div>
                                          </td>
                                      </tr>
                                  ))}
                              </tbody>
                          </table>
                      </div>
                  </>
              )}

              {paymentsSubTab === 'gateways' && (
                  <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 max-w-4xl mx-auto">
                      <div className="flex justify-between items-center mb-8">
                          <h3 className="text-xl font-bold text-slate-900 dark:text-white">Payment Gateways</h3>
                          <button 
                              onClick={handleSaveGateways}
                              disabled={isProcessing === 'save-gateways'}
                              className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2"
                          >
                              {isProcessing === 'save-gateways' ? <Loader2 className="w-4 h-4 animate-spin"/> : <Save className="w-4 h-4"/>} Save Changes
                          </button>
                      </div>

                      <div className="space-y-8">
                          <div className="p-6 bg-slate-50 dark:bg-slate-700/30 rounded-2xl border border-slate-200 dark:border-slate-600">
                              <div className="flex items-center gap-3 mb-6">
                                  <Smartphone className="w-6 h-6 text-green-600" />
                                  <h4 className="text-lg font-bold text-slate-800 dark:text-white">M-Pesa Integration (Daraja API)</h4>
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                  <div>
                                      <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Paybill Number</label>
                                      <input 
                                          value={gatewayConfig.mpesa.paybill} 
                                          onChange={(e) => setGatewayConfig({...gatewayConfig, mpesa: {...gatewayConfig.mpesa, paybill: e.target.value}})}
                                          className="w-full p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-xl text-sm outline-none dark:text-white"
                                      />
                                  </div>
                                  <div>
                                      <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Account Name</label>
                                      <input 
                                          value={gatewayConfig.mpesa.name} 
                                          onChange={(e) => setGatewayConfig({...gatewayConfig, mpesa: {...gatewayConfig.mpesa, name: e.target.value}})}
                                          className="w-full p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-xl text-sm outline-none dark:text-white"
                                      />
                                  </div>
                              </div>
                          </div>

                          <div className="p-6 bg-slate-50 dark:bg-slate-700/30 rounded-2xl border border-slate-200 dark:border-slate-600">
                              <div className="flex items-center gap-3 mb-6">
                                  <Landmark className="w-6 h-6 text-blue-600" />
                                  <h4 className="text-lg font-bold text-slate-800 dark:text-white">Bank Details (Manual Transfer)</h4>
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                  <div>
                                      <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Bank Name</label>
                                      <input 
                                          value={gatewayConfig.bank.name} 
                                          onChange={(e) => setGatewayConfig({...gatewayConfig, bank: {...gatewayConfig.bank, name: e.target.value}})}
                                          className="w-full p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-xl text-sm outline-none dark:text-white"
                                      />
                                  </div>
                                  <div>
                                      <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Account Number</label>
                                      <input 
                                          value={gatewayConfig.bank.account} 
                                          onChange={(e) => setGatewayConfig({...gatewayConfig, bank: {...gatewayConfig.bank, account: e.target.value}})}
                                          className="w-full p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-xl text-sm outline-none dark:text-white"
                                      />
                                  </div>
                                  <div>
                                      <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Branch</label>
                                      <input 
                                          value={gatewayConfig.bank.branch} 
                                          onChange={(e) => setGatewayConfig({...gatewayConfig, bank: {...gatewayConfig.bank, branch: e.target.value}})}
                                          className="w-full p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-xl text-sm outline-none dark:text-white"
                                      />
                                  </div>
                                  <div>
                                      <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Swift Code</label>
                                      <input 
                                          value={gatewayConfig.bank.swift} 
                                          onChange={(e) => setGatewayConfig({...gatewayConfig, bank: {...gatewayConfig.bank, swift: e.target.value}})}
                                          className="w-full p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-xl text-sm outline-none dark:text-white"
                                      />
                                  </div>
                              </div>
                          </div>
                      </div>
                  </div>
              )}
          </div>
      );
  };

  const renderSettings = () => {
      const filteredLogs = systemLogs.filter(l => 
          (logFilter.type === 'All' || l.action.toLowerCase().includes(logFilter.type.toLowerCase())) &&
          (l.admin.toLowerCase().includes(logFilter.search.toLowerCase()) || l.target.toLowerCase().includes(logFilter.search.toLowerCase()))
      );

      return (
          <div className="space-y-6 animate-in fade-in">
              <div className="flex bg-slate-100 dark:bg-slate-800/50 p-1 rounded-xl w-fit">
                  {['general', 'pricing', 'logs', 'backups'].map(tab => (
                      <button
                          key={tab}
                          onClick={() => setSettingsSubTab(tab as any)}
                          className={`px-4 py-2 rounded-lg text-sm font-bold transition-all capitalize ${
                              settingsSubTab === tab ? 'bg-white dark:bg-slate-700 shadow text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400'
                          }`}
                      >
                          {tab}
                      </button>
                  ))}
              </div>

              {settingsSubTab === 'general' && (
                  <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 max-w-4xl">
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Platform Configuration</h3>
                      <div className="space-y-6">
                          <div className="flex items-center justify-between p-4 border border-slate-200 dark:border-slate-600 rounded-xl">
                              <div>
                                  <div className="font-bold text-slate-800 dark:text-white">Maintenance Mode</div>
                                  <div className="text-xs text-slate-500">Disable access for all non-admin users</div>
                              </div>
                              <button 
                                  onClick={() => toggleSettings('maintenanceMode')}
                                  className={`w-12 h-6 rounded-full relative transition-colors ${platformSettings.maintenanceMode ? 'bg-indigo-600' : 'bg-slate-300'}`}
                              >
                                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${platformSettings.maintenanceMode ? 'left-7' : 'left-1'}`}></div>
                              </button>
                          </div>
                          
                          <div className="flex items-center justify-between p-4 border border-slate-200 dark:border-slate-600 rounded-xl">
                              <div>
                                  <div className="font-bold text-slate-800 dark:text-white">Allow New Registrations</div>
                                  <div className="text-xs text-slate-500">Enable new clinics to sign up</div>
                              </div>
                              <button 
                                  onClick={() => toggleSettings('allowNewRegistrations')}
                                  className={`w-12 h-6 rounded-full relative transition-colors ${platformSettings.allowNewRegistrations ? 'bg-green-600' : 'bg-slate-300'}`}
                              >
                                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${platformSettings.allowNewRegistrations ? 'left-7' : 'left-1'}`}></div>
                              </button>
                          </div>

                          <div className="pt-6 border-t border-slate-100 dark:border-slate-700">
                              <label className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 block">Global Announcement</label>
                              <div className="flex gap-2">
                                  <input 
                                      value={platformSettings.globalAnnouncement}
                                      onChange={(e) => setPlatformSettings({...platformSettings, globalAnnouncement: e.target.value})}
                                      className="flex-1 p-3 bg-slate-50 dark:bg-slate-700 rounded-xl border border-slate-200 dark:border-slate-600 outline-none text-sm dark:text-white"
                                      placeholder="Message visible to all tenants..."
                                  />
                                  <button onClick={handleSaveSettings} className="bg-indigo-600 text-white px-4 rounded-xl text-sm font-bold hover:bg-indigo-700">Save</button>
                              </div>
                          </div>
                      </div>
                  </div>
              )}

              {settingsSubTab === 'pricing' && (
                  <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 max-w-4xl">
                      <div className="flex justify-between items-center mb-6">
                          <h3 className="text-lg font-bold text-slate-900 dark:text-white">Subscription Pricing</h3>
                          <button 
                              onClick={handleSavePricing}
                              disabled={isProcessing === 'save-pricing'}
                              className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-bold hover:bg-indigo-700 disabled:opacity-50"
                          >
                              {isProcessing === 'save-pricing' ? 'Saving...' : 'Update Pricing'}
                          </button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          <div className="p-6 border-2 border-slate-100 dark:border-slate-700 rounded-2xl">
                              <div className="text-center mb-4">
                                  <h4 className="font-bold text-slate-600 dark:text-slate-400">Free Tier</h4>
                              </div>
                              <div className="flex items-center justify-center gap-1 mb-2">
                                  <span className="text-slate-400 text-sm">KSh</span>
                                  <input 
                                      type="number"
                                      value={platformSettings.pricing.free}
                                      onChange={(e) => setPlatformSettings({...platformSettings, pricing: {...platformSettings.pricing, free: parseInt(e.target.value)}})}
                                      className="w-20 p-1 text-center font-bold text-xl bg-transparent border-b border-slate-300 outline-none dark:text-white"
                                  />
                              </div>
                              <p className="text-center text-xs text-slate-400">/ month</p>
                          </div>
                          <div className="p-6 border-2 border-indigo-100 dark:border-indigo-900/30 bg-indigo-50/50 dark:bg-indigo-900/10 rounded-2xl relative">
                              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-indigo-600 text-white px-2 py-0.5 rounded text-[10px] uppercase font-bold">Popular</div>
                              <div className="text-center mb-4">
                                  <h4 className="font-bold text-indigo-700 dark:text-indigo-400">Pro Tier</h4>
                              </div>
                              <div className="flex items-center justify-center gap-1 mb-2">
                                  <span className="text-slate-400 text-sm">KSh</span>
                                  <input 
                                      type="number"
                                      value={platformSettings.pricing.pro}
                                      onChange={(e) => setPlatformSettings({...platformSettings, pricing: {...platformSettings.pricing, pro: parseInt(e.target.value)}})}
                                      className="w-24 p-1 text-center font-bold text-xl bg-transparent border-b border-indigo-300 outline-none text-indigo-900 dark:text-white"
                                  />
                              </div>
                              <p className="text-center text-xs text-slate-400">/ month</p>
                          </div>
                          <div className="p-6 border-2 border-slate-100 dark:border-slate-700 rounded-2xl">
                              <div className="text-center mb-4">
                                  <h4 className="font-bold text-slate-600 dark:text-slate-400">Enterprise</h4>
                              </div>
                              <div className="flex items-center justify-center gap-1 mb-2">
                                  <span className="text-slate-400 text-sm">KSh</span>
                                  <input 
                                      type="number"
                                      value={platformSettings.pricing.enterprise}
                                      onChange={(e) => setPlatformSettings({...platformSettings, pricing: {...platformSettings.pricing, enterprise: parseInt(e.target.value)}})}
                                      className="w-24 p-1 text-center font-bold text-xl bg-transparent border-b border-slate-300 outline-none dark:text-white"
                                  />
                              </div>
                              <p className="text-center text-xs text-slate-400">/ month</p>
                          </div>
                      </div>
                  </div>
              )}

              {settingsSubTab === 'logs' && (
                  <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700">
                      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
                          <h3 className="font-bold text-slate-900 dark:text-white">System Audit Logs</h3>
                          <div className="flex gap-2 w-full sm:w-auto">
                              <input 
                                  placeholder="Search logs..." 
                                  value={logFilter.search}
                                  onChange={(e) => setLogFilter({...logFilter, search: e.target.value})}
                                  className="pl-4 pr-4 py-2 bg-slate-50 dark:bg-slate-700 rounded-lg text-sm outline-none dark:text-white border border-slate-200 dark:border-slate-600 w-full sm:w-64" 
                              />
                              <button onClick={() => exportToCSV(filteredLogs, 'audit_logs')} className="p-2 border border-slate-200 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-500">
                                  <Download className="w-4 h-4"/>
                              </button>
                          </div>
                      </div>
                      <div className="overflow-x-auto">
                          <table className="w-full text-left text-sm">
                              <thead className="bg-slate-50 dark:bg-slate-700/50 text-xs uppercase text-slate-400 font-semibold border-b border-slate-100 dark:border-slate-700">
                                  <tr>
                                      <th className="px-6 py-4">Timestamp</th>
                                      <th className="px-6 py-4">Action</th>
                                      <th className="px-6 py-4">Admin</th>
                                      <th className="px-6 py-4">Target</th>
                                      <th className="px-6 py-4 text-center">Status</th>
                                  </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-50 dark:divide-slate-700">
                                  {filteredLogs.map(log => (
                                      <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30">
                                          <td className="px-6 py-4 text-xs font-mono text-slate-500">{new Date(log.timestamp).toLocaleString()}</td>
                                          <td className="px-6 py-4 font-bold text-slate-900 dark:text-white">{log.action}</td>
                                          <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{log.admin}</td>
                                          <td className="px-6 py-4 text-slate-500">{log.target}</td>
                                          <td className="px-6 py-4 text-center">
                                              <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${
                                                  log.status === 'Success' ? 'bg-green-100 text-green-700' :
                                                  log.status === 'Warning' ? 'bg-orange-100 text-orange-700' : 'bg-red-100 text-red-700'
                                              }`}>{log.status}</span>
                                          </td>
                                      </tr>
                                  ))}
                              </tbody>
                          </table>
                      </div>
                  </div>
              )}

              {settingsSubTab === 'backups' && (
                  <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 max-w-4xl">
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Database Backups</h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                          <div className="p-6 bg-slate-50 dark:bg-slate-700/30 rounded-2xl border border-slate-200 dark:border-slate-600">
                              <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 rounded-full flex items-center justify-center mb-4">
                                  <HardDrive className="w-6 h-6" />
                              </div>
                              <h4 className="font-bold text-slate-900 dark:text-white mb-1">Create Snapshot</h4>
                              <p className="text-xs text-slate-500 mb-4">Manual backup of all tenant databases.</p>
                              <button 
                                  onClick={() => handleBackupOperation('create')}
                                  className="w-full py-2 bg-indigo-600 text-white rounded-lg text-sm font-bold hover:bg-indigo-700"
                              >
                                  Start Backup
                              </button>
                          </div>
                          
                          <div className="p-6 bg-slate-50 dark:bg-slate-700/30 rounded-2xl border border-slate-200 dark:border-slate-600">
                              <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 text-orange-600 rounded-full flex items-center justify-center mb-4">
                                  <RefreshCw className="w-6 h-6" />
                              </div>
                              <h4 className="font-bold text-slate-900 dark:text-white mb-1">Restore Data</h4>
                              <p className="text-xs text-slate-500 mb-4">Rollback to a previous system state.</p>
                              <button 
                                  onClick={() => handleBackupOperation('restore')}
                                  className="w-full py-2 bg-white dark:bg-slate-600 border border-slate-300 dark:border-slate-500 text-slate-700 dark:text-white rounded-lg text-sm font-bold hover:bg-slate-50 dark:hover:bg-slate-500"
                              >
                                  Restore...
                              </button>
                          </div>
                      </div>

                      <div>
                          <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-4">Recent Snapshots</h4>
                          <div className="space-y-3">
                              {[1, 2, 3].map((i) => (
                                  <div key={i} className="flex items-center justify-between p-3 border border-slate-100 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700/30">
                                      <div className="flex items-center gap-3">
                                          <Database className="w-4 h-4 text-slate-400" />
                                          <span className="text-sm font-mono text-slate-600 dark:text-slate-300">snapshot_v{45-i}_auto.sql</span>
                                      </div>
                                      <span className="text-xs text-slate-400">{i * 6} hours ago</span>
                                  </div>
                              ))}
                          </div>
                      </div>
                  </div>
              )}
          </div>
      );
  };

  return (
    <div className="p-6 md:p-10 bg-gray-50 dark:bg-slate-900 min-h-screen transition-colors duration-200">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
            <div>
                 <h2 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                     <Shield className="w-8 h-8 text-indigo-600"/> Super Admin Portal
                 </h2>
                 <p className="text-slate-500 dark:text-slate-400 mt-1">
                    {activeTab === 'overview' && 'System Overview'}
                    {activeTab === 'clinics' && 'Tenant Management'}
                    {activeTab === 'approvals' && 'Pending Requests'}
                    {activeTab === 'payments' && 'Financial Transactions & Subscriptions'}
                    {activeTab === 'support' && 'Helpdesk Tickets'}
                    {activeTab === 'settings' && 'Global Configuration'}
                 </p>
            </div>
            
            {/* User Profile / Switcher */}
            <div className="flex items-center gap-4">
                <div className="text-right hidden md:block">
                    <div className="text-sm font-bold text-slate-900 dark:text-white">{currentUser.name}</div>
                    <div className="text-xs text-indigo-600 font-bold">System Owner</div>
                </div>
                <div className="w-10 h-10 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold shadow-lg shadow-indigo-200 dark:shadow-none">SO</div>
            </div>
        </div>

        {/* Content Area */}
        <div className="min-h-[500px]">
            {activeTab === 'overview' && renderOverview()}
            {activeTab === 'clinics' && renderClinics()}
            {activeTab === 'approvals' && renderApprovals()} 
            {activeTab === 'payments' && renderPayments()}
            {activeTab === 'support' && renderSupport()}
            {activeTab === 'settings' && renderSettings()}
        </div>

        {/* --- MODALS --- */}

        {/* Ticket Detail Modal */}
        {selectedTicket && (
            <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in">
                <div className="bg-white dark:bg-slate-800 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 flex flex-col max-h-[85vh]">
                    <div className="p-6 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/50 flex justify-between items-start">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <span className="font-mono text-xs text-slate-500 bg-slate-200 dark:bg-slate-600 px-1.5 py-0.5 rounded">#{selectedTicket.id}</span>
                                <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                                    selectedTicket.priority === 'Critical' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'
                                }`}>{selectedTicket.priority} Priority</span>
                            </div>
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white">{selectedTicket.subject}</h3>
                            <p className="text-sm text-slate-500">{selectedTicket.clinicName} • {selectedTicket.dateCreated}</p>
                        </div>
                        <button onClick={() => setSelectedTicket(null)} className="text-slate-400 hover:text-slate-600"><XCircle className="w-6 h-6"/></button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 bg-slate-50 dark:bg-slate-900 space-y-4">
                        {/* Mock Conversation */}
                        <div className="flex gap-3">
                            <div className="w-8 h-8 rounded-full bg-slate-300 flex-shrink-0 flex items-center justify-center"><User className="w-4 h-4 text-slate-600"/></div>
                            <div className="bg-white dark:bg-slate-700 p-4 rounded-2xl rounded-tl-none shadow-sm max-w-[85%]">
                                <p className="text-sm text-slate-700 dark:text-slate-200">Hi support, we are facing an issue with the SMS gateway since this morning. Messages are delayed.</p>
                                <span className="text-[10px] text-slate-400 mt-2 block">10:00 AM</span>
                            </div>
                        </div>
                        
                        <div className="flex gap-3 flex-row-reverse">
                            <div className="w-8 h-8 rounded-full bg-indigo-600 flex-shrink-0 flex items-center justify-center text-white font-bold text-xs">SA</div>
                            <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800 p-4 rounded-2xl rounded-tr-none shadow-sm max-w-[85%]">
                                <p className="text-sm text-indigo-900 dark:text-indigo-200">Hello, thanks for reporting. We are checking the gateway status now.</p>
                                <span className="text-[10px] text-indigo-400 mt-2 block">10:15 AM</span>
                            </div>
                        </div>

                        {selectedTicket.status === 'Resolved' && (
                            <div className="flex justify-center my-4">
                                <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                                    <CheckCircle className="w-3 h-3"/> Ticket Resolved
                                </span>
                            </div>
                        )}
                    </div>

                    <div className="p-4 bg-white dark:bg-slate-800 border-t border-slate-100 dark:border-slate-700">
                        {selectedTicket.status !== 'Resolved' ? (
                            <div className="flex gap-2">
                                <textarea 
                                    className="flex-1 p-3 bg-slate-50 dark:bg-slate-700 border-none rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white text-sm resize-none"
                                    rows={2}
                                    placeholder="Type your reply..."
                                    value={ticketReply}
                                    onChange={(e) => setTicketReply(e.target.value)}
                                />
                                <div className="flex flex-col gap-2">
                                    <button 
                                        onClick={handleSendReply}
                                        disabled={isProcessing === 'reply' || !ticketReply}
                                        className="p-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50"
                                    >
                                        {isProcessing === 'reply' ? <Loader2 className="w-5 h-5 animate-spin"/> : <Send className="w-5 h-5"/>}
                                    </button>
                                    <button 
                                        onClick={() => handleResolveTicket(selectedTicket.id)}
                                        className="p-3 bg-green-50 text-green-600 rounded-xl hover:bg-green-100" 
                                        title="Mark Resolved"
                                    >
                                        <CheckCircle className="w-5 h-5"/>
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <button 
                                onClick={() => {
                                    const reopened = { ...selectedTicket, status: 'Open' as const };
                                    setSupportTickets(prev => prev.map(t => t.id === selectedTicket.id ? reopened : t));
                                    setSelectedTicket(reopened);
                                }}
                                className="w-full py-3 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold rounded-xl hover:bg-slate-200 dark:hover:bg-slate-600"
                            >
                                Reopen Ticket
                            </button>
                        )}
                    </div>
                </div>
            </div>
        )}

        {/* Invoice Modal */}
        {showInvoice && currentInvoiceData && (
            <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in">
                <div className="bg-white w-full max-w-2xl rounded-sm shadow-2xl overflow-hidden animate-in zoom-in-95 flex flex-col max-h-[90vh]">
                    {/* Invoice Paper Style */}
                    <div className="p-8 flex-1 overflow-y-auto font-serif text-slate-800 bg-white">
                        <div className="flex justify-between items-start border-b-2 border-slate-800 pb-6 mb-6">
                            <div>
                                <h1 className="text-3xl font-bold tracking-tight mb-2">INVOICE</h1>
                                <p className="text-sm text-slate-500 font-sans">#{currentInvoiceData.id}</p>
                            </div>
                            <div className="text-right font-sans">
                                <h2 className="text-xl font-bold text-indigo-600">JuaAfya SaaS Ltd</h2>
                                <p className="text-xs text-slate-500">Nairobi, Kenya</p>
                                <p className="text-xs text-slate-500">VAT: P000123456</p>
                            </div>
                        </div>

                        <div className="flex justify-between mb-8 font-sans text-sm">
                            <div>
                                <p className="text-xs font-bold text-slate-400 uppercase mb-1">Bill To:</p>
                                <p className="font-bold text-lg">{currentInvoiceData.clinicName}</p>
                                <p className="text-slate-500">Subscription: {currentInvoiceData.plan}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-xs font-bold text-slate-400 uppercase mb-1">Date:</p>
                                <p className="font-bold">{currentInvoiceData.date}</p>
                                <p className="text-xs font-bold text-slate-400 uppercase mt-2 mb-1">Status:</p>
                                <span className={`inline-block px-2 py-0.5 rounded text-xs font-bold uppercase ${currentInvoiceData.status === 'Success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                    {currentInvoiceData.status === 'Success' ? 'PAID' : 'UNPAID'}
                                </span>
                            </div>
                        </div>

                        <table className="w-full mb-8 border-collapse font-sans text-sm">
                            <thead>
                                <tr className="bg-slate-100 border-y border-slate-200">
                                    <th className="py-3 px-4 text-left font-bold text-slate-600">Description</th>
                                    <th className="py-3 px-4 text-right font-bold text-slate-600">Amount</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr className="border-b border-slate-100">
                                    <td className="py-4 px-4">JuaAfya {currentInvoiceData.plan} Plan Subscription (Monthly)</td>
                                    <td className="py-4 px-4 text-right">KSh {currentInvoiceData.amount.toLocaleString()}</td>
                                </tr>
                                <tr className="border-b border-slate-100">
                                    <td className="py-4 px-4">Tax (16% VAT)</td>
                                    <td className="py-4 px-4 text-right">KSh {(currentInvoiceData.amount * 0.16).toLocaleString()}</td>
                                </tr>
                            </tbody>
                            <tfoot>
                                <tr>
                                    <td className="py-4 px-4 text-right font-bold text-lg">Total</td>
                                    <td className="py-4 px-4 text-right font-bold text-lg">KSh {(currentInvoiceData.amount * 1.16).toLocaleString()}</td>
                                </tr>
                            </tfoot>
                        </table>

                        <div className="text-center text-xs text-slate-400 font-sans mt-12">
                            <p>Thank you for your business.</p>
                            <p>For inquiries, contact billing@juaafya.com</p>
                        </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="bg-slate-50 border-t border-slate-200 p-4 flex justify-between items-center font-sans">
                        <button onClick={() => setShowInvoice(false)} className="text-slate-500 font-bold hover:text-slate-700">Close</button>
                        <div className="flex gap-3">
                            <button onClick={() => window.print()} className="flex items-center gap-2 px-4 py-2 border border-slate-300 rounded-lg font-bold text-slate-600 hover:bg-white transition-colors">
                                <Printer className="w-4 h-4"/> Print
                            </button>
                            <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 transition-colors shadow-lg">
                                <Download className="w-4 h-4"/> Download PDF
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        )}

        {/* Backup Progress Modal */}
        {showBackupProgress && (
            <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/90 backdrop-blur-md animate-in fade-in">
                <div className="bg-white dark:bg-slate-800 w-full max-w-md rounded-2xl p-8 shadow-2xl text-center">
                    <div className="mb-6 relative inline-block">
                        <Database className={`w-16 h-16 ${backupType === 'restore' ? 'text-orange-500' : 'text-indigo-500'} animate-pulse`} />
                        <div className="absolute inset-0 border-4 border-indigo-100 rounded-full animate-ping opacity-25"></div>
                    </div>
                    <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                        {backupType === 'create' ? 'Creating System Snapshot...' : 'Restoring Database...'}
                    </h3>
                    <p className="text-slate-500 dark:text-slate-400 mb-8">Please wait. Do not close this window.</p>
                    
                    <div className="w-full bg-slate-100 dark:bg-slate-700 h-4 rounded-full overflow-hidden relative mb-2">
                        <div 
                            className={`h-full transition-all duration-300 ${backupType === 'create' ? 'bg-indigo-600' : 'bg-orange-500'}`}
                            style={{ width: `${backupProgress}%` }}
                        ></div>
                    </div>
                    <p className="text-sm font-bold text-slate-600 dark:text-slate-300">{backupProgress}% Complete</p>
                </div>
            </div>
        )}

        {/* Record Payment Modal */}
        {showRecordPayment && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
                <div className="bg-white dark:bg-slate-800 w-full max-w-md rounded-2xl p-6 shadow-2xl animate-in zoom-in-95">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <Plus className="w-5 h-5 text-indigo-600" /> Record Offline Payment
                        </h3>
                        <button onClick={() => setShowRecordPayment(false)} className="text-slate-400 hover:text-slate-600"><XCircle className="w-6 h-6"/></button>
                    </div>
                    <div className="space-y-4">
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Clinic</label>
                            <select 
                                value={recordPaymentForm.clinicId} 
                                onChange={(e) => {
                                    const cId = e.target.value;
                                    const c = clinics.find(c => c.id === cId);
                                    const planCost = c ? platformSettings.pricing[c.plan.toLowerCase() as keyof typeof platformSettings.pricing] : 0;
                                    setRecordPaymentForm({...recordPaymentForm, clinicId: cId, amount: planCost ? planCost.toString() : ''});
                                }}
                                className="w-full p-3 bg-slate-50 dark:bg-slate-700 rounded-xl border border-slate-200 dark:border-slate-600 outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
                            >
                                <option value="">-- Select Clinic --</option>
                                {clinics.filter(c => c.plan !== 'Free').map(c => (
                                    <option key={c.id} value={c.id}>{c.name} ({c.plan})</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Amount (KSh)</label>
                            <input 
                                type="number"
                                value={recordPaymentForm.amount} 
                                onChange={(e) => setRecordPaymentForm({...recordPaymentForm, amount: e.target.value})}
                                className="w-full p-3 bg-slate-50 dark:bg-slate-700 rounded-xl border border-slate-200 dark:border-slate-600 outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
                                placeholder="5000"
                            />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Payment Method</label>
                            <select 
                                value={recordPaymentForm.method} 
                                onChange={(e) => setRecordPaymentForm({...recordPaymentForm, method: e.target.value})}
                                className="w-full p-3 bg-slate-50 dark:bg-slate-700 rounded-xl border border-slate-200 dark:border-slate-600 outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
                            >
                                <option value="Bank Transfer">Bank Transfer</option>
                                <option value="Cash">Cash</option>
                                <option value="Cheque">Cheque</option>
                                <option value="M-Pesa">M-Pesa (Manual)</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Reference ID (Optional)</label>
                            <input 
                                value={recordPaymentForm.ref} 
                                onChange={(e) => setRecordPaymentForm({...recordPaymentForm, ref: e.target.value})}
                                className="w-full p-3 bg-slate-50 dark:bg-slate-700 rounded-xl border border-slate-200 dark:border-slate-600 outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
                                placeholder="Transaction Ref"
                            />
                        </div>
                        <div className="flex gap-3 mt-6">
                            <button onClick={() => setShowRecordPayment(false)} className="flex-1 py-3 font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 rounded-xl hover:bg-slate-200 transition-colors">Cancel</button>
                            <button 
                                onClick={handleRecordPayment}
                                disabled={isProcessing === 'record-payment' || !recordPaymentForm.clinicId || !recordPaymentForm.amount}
                                className="flex-1 py-3 font-bold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                {isProcessing === 'record-payment' ? <Loader2 className="w-4 h-4 animate-spin"/> : <Check className="w-4 h-4" />} Save
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        )}

        {/* Add Clinic Modal */}
        {showAddClinic && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
                <div className="bg-white dark:bg-slate-800 w-full max-w-lg rounded-2xl p-6 shadow-2xl animate-in zoom-in-95">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <Plus className="w-5 h-5 text-indigo-600" /> Provision New Clinic
                        </h3>
                        <button onClick={() => setShowAddClinic(false)} className="text-slate-400 hover:text-slate-600"><XCircle className="w-6 h-6"/></button>
                    </div>
                    <div className="space-y-4">
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Clinic Name</label>
                            <input 
                                value={newClinicForm.name} 
                                onChange={(e) => setNewClinicForm({...newClinicForm, name: e.target.value})}
                                className="w-full p-3 bg-slate-50 dark:bg-slate-700 rounded-xl border border-slate-200 dark:border-slate-600 outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
                                placeholder="e.g. City Health Center"
                            />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Admin Owner Name</label>
                            <input 
                                value={newClinicForm.owner} 
                                onChange={(e) => setNewClinicForm({...newClinicForm, owner: e.target.value})}
                                className="w-full p-3 bg-slate-50 dark:bg-slate-700 rounded-xl border border-slate-200 dark:border-slate-600 outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
                                placeholder="e.g. Dr. John Doe"
                            />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Admin Email</label>
                            <input 
                                value={newClinicForm.email} 
                                onChange={(e) => setNewClinicForm({...newClinicForm, email: e.target.value})}
                                className="w-full p-3 bg-slate-50 dark:bg-slate-700 rounded-xl border border-slate-200 dark:border-slate-600 outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
                                placeholder="admin@clinic.com"
                            />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Initial Plan</label>
                            <select 
                                value={newClinicForm.plan}
                                onChange={(e) => setNewClinicForm({...newClinicForm, plan: e.target.value})}
                                className="w-full p-3 bg-slate-50 dark:bg-slate-700 rounded-xl border border-slate-200 dark:border-slate-600 outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
                            >
                                <option value="Free">Free</option>
                                <option value="Pro">Pro</option>
                                <option value="Enterprise">Enterprise</option>
                            </select>
                        </div>
                        <div className="flex gap-3 mt-6">
                            <button onClick={() => setShowAddClinic(false)} className="flex-1 py-3 font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 rounded-xl hover:bg-slate-200 transition-colors">Cancel</button>
                            <button 
                                onClick={handleProvisionNewClinic}
                                disabled={isProcessing === 'add-clinic' || !newClinicForm.name}
                                className="flex-1 py-3 font-bold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                {isProcessing === 'add-clinic' ? <Loader2 className="w-4 h-4 animate-spin"/> : <Check className="w-4 h-4" />} Create Clinic
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        )}

        {/* Broadcast Modal */}
        {showBroadcast && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
                <div className="bg-white dark:bg-slate-800 w-full max-w-md rounded-2xl p-6 shadow-2xl animate-in zoom-in-95">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <MessageSquare className="w-5 h-5 text-teal-600" /> Broadcast System Alert
                        </h3>
                        <button onClick={() => setShowBroadcast(false)} className="text-slate-400 hover:text-slate-600"><XCircle className="w-6 h-6"/></button>
                    </div>
                    <p className="text-sm text-slate-500 mb-4">This message will be visible on the dashboard of ALL clinics.</p>
                    <textarea 
                        className="w-full p-4 bg-slate-50 dark:bg-slate-700 rounded-xl border border-slate-200 dark:border-slate-600 outline-none text-sm dark:text-white h-32"
                        placeholder="e.g., System maintenance scheduled for Saturday 2 AM..."
                        value={broadcastMsg}
                        onChange={(e) => setBroadcastMsg(e.target.value)}
                        autoFocus
                    />
                    <div className="flex gap-3 mt-6">
                        <button onClick={() => setShowBroadcast(false)} className="flex-1 py-3 font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 rounded-xl hover:bg-slate-200 transition-colors">Cancel</button>
                        <button 
                            onClick={handleBroadcast}
                            disabled={isProcessing === 'broadcast' || !broadcastMsg}
                            className="flex-1 py-3 font-bold text-white bg-teal-600 rounded-xl hover:bg-teal-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            {isProcessing === 'broadcast' ? <Loader2 className="w-4 h-4 animate-spin"/> : <Play className="w-4 h-4" />} Publish
                        </button>
                    </div>
                </div>
            </div>
        )}

        {/* Toast Notification */}
        {toast && (
            <div className={`fixed bottom-6 right-6 px-6 py-4 rounded-xl shadow-2xl border flex items-center gap-3 animate-in slide-in-from-bottom-5 z-[60] ${
                toast.type === 'success' ? 'bg-white dark:bg-slate-800 border-green-500 text-green-600' :
                toast.type === 'error' ? 'bg-white dark:bg-slate-800 border-red-500 text-red-600' :
                'bg-white dark:bg-slate-800 border-indigo-500 text-indigo-600'
            }`}>
                {toast.type === 'success' ? <CheckCircle className="w-5 h-5" /> : 
                 toast.type === 'error' ? <XCircle className="w-5 h-5" /> : 
                 <Activity className="w-5 h-5" />}
                <span className="font-bold text-sm">{toast.message}</span>
            </div>
        )}
    </div>
  );
};

export default SuperAdminDashboard;
