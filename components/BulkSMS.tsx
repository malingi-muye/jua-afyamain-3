import React, { useState, useEffect } from 'react';
import { Patient, Gender, ClinicSettings } from '../types';
import {
    MessageSquare, Users, Send, Clock, CheckCircle, AlertCircle,
    Search, Filter, Sparkles, X, History, Plus, Loader2, Play
} from 'lucide-react';
import { draftCampaignMessage } from '../services/geminiService';
import { sendSMS } from '../services/smsService';
import { enterpriseDb } from '../services/enterprise-db';

interface BulkSMSProps {
    patients: Patient[];
    showToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
    settings?: ClinicSettings;
}

interface Campaign {
    id: string;
    date: string;
    message: string;
    recipientCount: number;
    status: 'Completed' | 'Failed';
    cost: number;
    type: 'Broadcast' | 'Reminder';
}

const BulkSMS: React.FC<BulkSMSProps> = ({ patients, showToast, settings }) => {
    const [activeTab, setActiveTab] = useState<'compose' | 'history'>('compose');
    const [loadingAI, setLoadingAI] = useState(false);

    // -- Compose State --
    const [message, setMessage] = useState('');
    const [audience, setAudience] = useState<'all' | 'male' | 'female' | 'manual'>('all');
    const [manualNumbers, setManualNumbers] = useState('');

    // -- AI Modal --
    const [showAiModal, setShowAiModal] = useState(false);
    const [aiTopic, setAiTopic] = useState('');
    const [aiTone, setAiTone] = useState('Professional');

    // -- Sending State --
    const [isSending, setIsSending] = useState(false);
    const [progress, setProgress] = useState(0);
    const [sentCount, setSentCount] = useState(0);
    const [totalToSend, setTotalToSend] = useState(0);

    // -- History State --
    const [history, setHistory] = useState<Campaign[]>([]);

    // -- Helpers --
    const getRecipients = () => {
        if (audience === 'all') return patients;
        if (audience === 'male') return patients.filter(p => p.gender === Gender.Male);
        if (audience === 'female') return patients.filter(p => p.gender === Gender.Female);

        // Manual parsing
        if (audience === 'manual') {
            return manualNumbers.split(',').map((num, idx) => ({
                id: `manual-${idx}`,
                name: 'Unknown',
                phone: num.trim(),
                age: 0,
                gender: Gender.Other,
                lastVisit: '',
                notes: '',
                history: []
            })).filter(p => p.phone.length > 5); // Basic filter
        }
        return [];
    };

    const recipients = getRecipients();
    const estimatedCost = recipients.length * 1.5; // Assuming 1.5 KSh per SMS

    const handleGenerateAI = async () => {
        if (!aiTopic) return;
        setLoadingAI(true);
        const draft = await draftCampaignMessage(aiTopic, aiTone);
        setMessage(draft);
        setLoadingAI(false);
        setShowAiModal(false);
    };

    const handleSendCampaign = async () => {
        if (!message || recipients.length === 0) return;

        setIsSending(true);
        setProgress(0);
        setSentCount(0);
        setTotalToSend(recipients.length);

        const campaignId = `campaign-${Date.now()}`;
        // Log campaign start
        await enterpriseDb.logAudit(
            'sms_campaign_started',
            'sms_campaign',
            campaignId,
            {},
            { recipientCount: recipients.length, message: message.substring(0, 100) }
        );
        await enterpriseDb.logActivity('sms_campaign', `Bulk SMS campaign started`, `Sending to ${recipients.length} recipients`);

        let successCount = 0;

        // Simulate sending in batches to avoid freezing UI and simulating API latency
        const batchSize = 5;
        for (let i = 0; i < recipients.length; i += batchSize) {
            const batch = recipients.slice(i, i + batchSize);

            await Promise.all(batch.map(async (recipient) => {
                try {
                    const res = await sendSMS({
                        phone_number: recipient.phone,
                        message: message,
                        sender_id: settings?.smsConfig?.senderId
                    });
                    if (res.success) successCount++;
                } catch (error) {
                    console.error('Error sending SMS to', recipient.phone, error);
                }
            }));


            // Update progress
            const currentSent = Math.min(i + batchSize, recipients.length);
            setSentCount(currentSent);
            setProgress((currentSent / recipients.length) * 100);
        }

        // Log campaign completion
        await enterpriseDb.logAudit(
            'sms_campaign_completed',
            'sms_campaign',
            campaignId,
            {},
            { successCount, totalCount: recipients.length, cost: estimatedCost }
        );
        await enterpriseDb.logActivity('sms_campaign', `Bulk SMS campaign completed`, `${successCount}/${recipients.length} messages sent successfully`);

        setIsSending(false);
        showToast(`Campaign sent! ${successCount}/${recipients.length} messages delivered.`, 'success');

        // Add to history
        const newCampaign: Campaign = {
            id: campaignId,
            date: new Date().toISOString().split('T')[0],
            message: message.substring(0, 50) + '...',
            recipientCount: successCount,
            status: successCount > 0 ? 'Completed' : 'Failed',
            cost: estimatedCost,
            type: 'Broadcast'
        };
        setHistory([newCampaign, ...history]);

        // Reset compose
        setMessage('');
        setAudience('all');
    };

    return (
        <div className="p-4 md:p-8 bg-gray-50 dark:bg-slate-900 min-h-screen transition-colors duration-200">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                <div>
                    <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Broadcast SMS</h2>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">Reach your patients with bulk messaging campaigns.</p>
                </div>

                {/* Toggle Tabs */}
                <div className="flex p-1 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                    <button
                        onClick={() => setActiveTab('compose')}
                        className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'compose' ? 'bg-teal-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'}`}
                    >
                        <MessageSquare className="w-4 h-4" /> Compose
                    </button>
                    <button
                        onClick={() => setActiveTab('history')}
                        className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'history' ? 'bg-teal-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'}`}
                    >
                        <History className="w-4 h-4" /> History
                    </button>
                </div>
            </div>

            {activeTab === 'compose' ? (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in slide-in-from-bottom-4">
                    {/* Compose Column */}
                    <div className="lg:col-span-2 space-y-6">

                        {/* 1. Audience Selection */}
                        <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700">
                            <h3 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                                <Users className="w-5 h-5 text-teal-600" /> Target Audience
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                                {[
                                    { id: 'all', label: 'All Patients' },
                                    { id: 'male', label: 'Male Only' },
                                    { id: 'female', label: 'Female Only' },
                                    { id: 'manual', label: 'Manual Input' }
                                ].map((opt) => (
                                    <button
                                        key={opt.id}
                                        onClick={() => setAudience(opt.id as any)}
                                        className={`p-4 rounded-xl border-2 text-sm font-bold transition-all ${audience === opt.id
                                            ? 'border-teal-600 bg-teal-50 dark:bg-teal-900/20 text-teal-700 dark:text-teal-400'
                                            : 'border-slate-100 dark:border-slate-700 hover:border-teal-200 dark:hover:border-slate-600 text-slate-600 dark:text-slate-300'
                                            }`}
                                    >
                                        {opt.label}
                                    </button>
                                ))}
                            </div>

                            {audience === 'manual' ? (
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Enter Phone Numbers (comma separated)</label>
                                    <textarea
                                        value={manualNumbers}
                                        onChange={(e) => setManualNumbers(e.target.value)}
                                        placeholder="+254712345678, +254700000000"
                                        className="w-full p-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 outline-none text-slate-900 dark:text-white h-24"
                                    />
                                </div>
                            ) : (
                                <div className="p-4 bg-slate-50 dark:bg-slate-700/30 rounded-xl border border-slate-100 dark:border-slate-700 flex justify-between items-center">
                                    <div className="flex items-center gap-2">
                                        <Filter className="w-4 h-4 text-slate-400" />
                                        <span className="text-sm font-medium text-slate-600 dark:text-slate-300">Selected Recipients</span>
                                    </div>
                                    <span className="text-lg font-bold text-teal-600 dark:text-teal-400">{recipients.length} Patients</span>
                                </div>
                            )}
                        </div>

                        {/* 2. Message Editor */}
                        <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                    <MessageSquare className="w-5 h-5 text-teal-600" /> Message Content
                                </h3>
                                <button
                                    onClick={() => setShowAiModal(true)}
                                    className="text-xs bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors"
                                >
                                    <Sparkles className="w-3.5 h-3.5" /> Draft with AI
                                </button>
                            </div>

                            <textarea
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                className="w-full p-4 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 outline-none text-slate-900 dark:text-white h-40 resize-none font-medium leading-relaxed"
                                placeholder="Type your message here..."
                            />

                            <div className="flex justify-between items-center mt-3 text-xs text-slate-500 dark:text-slate-400 font-medium">
                                <div className="flex items-center gap-4">
                                    <span>{message.length} chars</span>
                                    <span>{Math.ceil(message.length / 160)} SMS segment(s)</span>
                                </div>
                                <span className={message.length > 160 ? 'text-amber-500' : 'text-slate-400'}>Max 160 recommended</span>
                            </div>
                        </div>
                    </div>

                    {/* Summary Column */}
                    <div className="lg:col-span-1 space-y-6">
                        <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 sticky top-4">
                            <h3 className="font-bold text-slate-900 dark:text-white mb-6">Campaign Summary</h3>

                            <div className="space-y-4 mb-8">
                                <div className="flex justify-between items-center pb-4 border-b border-slate-50 dark:border-slate-700">
                                    <span className="text-slate-500 dark:text-slate-400 text-sm">Recipients</span>
                                    <span className="font-bold text-slate-900 dark:text-white">{recipients.length}</span>
                                </div>
                                <div className="flex justify-between items-center pb-4 border-b border-slate-50 dark:border-slate-700">
                                    <span className="text-slate-500 dark:text-slate-400 text-sm">Segments per user</span>
                                    <span className="font-bold text-slate-900 dark:text-white">{Math.max(1, Math.ceil(message.length / 160))}</span>
                                </div>
                                <div className="flex justify-between items-center pb-4 border-b border-slate-50 dark:border-slate-700">
                                    <span className="text-slate-500 dark:text-slate-400 text-sm">Cost per SMS</span>
                                    <span className="font-bold text-slate-900 dark:text-white">KSh 1.50</span>
                                </div>
                                <div className="flex justify-between items-center pt-2">
                                    <span className="text-slate-900 dark:text-white font-bold">Total Estimated Cost</span>
                                    <span className="font-bold text-xl text-teal-600">KSh {estimatedCost.toLocaleString()}</span>
                                </div>
                            </div>

                            {!isSending ? (
                                <button
                                    onClick={handleSendCampaign}
                                    disabled={!message || recipients.length === 0}
                                    className="w-full py-4 bg-slate-900 dark:bg-teal-600 text-white font-bold rounded-2xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                                >
                                    <Send className="w-5 h-5" /> Send Campaign
                                </button>
                            ) : (
                                <div className="space-y-3">
                                    <div className="flex justify-between text-xs font-bold text-slate-600 dark:text-slate-300">
                                        <span>Sending...</span>
                                        <span>{Math.round(progress)}%</span>
                                    </div>
                                    <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-3 overflow-hidden">
                                        <div
                                            className="bg-teal-500 h-full rounded-full transition-all duration-300"
                                            style={{ width: `${progress}%` }}
                                        ></div>
                                    </div>
                                    <div className="text-center text-xs text-slate-400">
                                        {sentCount} / {totalToSend} delivered
                                    </div>
                                </div>
                            )}

                            <div className="mt-6 p-4 bg-amber-50 dark:bg-amber-900/10 rounded-xl border border-amber-100 dark:border-amber-900/30">
                                <div className="flex items-start gap-3">
                                    <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-500 shrink-0 mt-0.5" />
                                    <p className="text-xs text-amber-800 dark:text-amber-200 leading-relaxed">
                                        Messages are sent via the Platform SMS Gateway. Ensure your account has sufficient credits before sending large broadcasts.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden animate-in fade-in slide-in-from-bottom-4">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left min-w-[800px]">
                            <thead className="bg-slate-50 dark:bg-slate-700/50 text-xs uppercase text-slate-400 font-semibold border-b border-slate-100 dark:border-slate-700">
                                <tr>
                                    <th className="px-6 py-4">Date</th>
                                    <th className="px-6 py-4">Message Preview</th>
                                    <th className="px-6 py-4 text-center">Recipients</th>
                                    <th className="px-6 py-4 text-center">Cost</th>
                                    <th className="px-6 py-4 text-center">Status</th>
                                    <th className="px-6 py-4 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50 dark:divide-slate-700 text-sm">
                                {history.map((campaign) => (
                                    <tr key={campaign.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                                        <td className="px-6 py-4 text-slate-600 dark:text-slate-300 whitespace-nowrap">
                                            {campaign.date}
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="text-slate-900 dark:text-white font-medium truncate max-w-xs">{campaign.message}</p>
                                        </td>
                                        <td className="px-6 py-4 text-center font-bold text-slate-700 dark:text-slate-200">
                                            {campaign.recipientCount}
                                        </td>
                                        <td className="px-6 py-4 text-center text-slate-600 dark:text-slate-300">
                                            KSh {campaign.cost}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 text-xs font-bold border border-green-100 dark:border-green-900">
                                                <CheckCircle className="w-3 h-3" /> Completed
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button className="text-teal-600 dark:text-teal-400 text-xs font-bold hover:underline">View Report</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* AI Drafting Modal */}
            {showAiModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-white dark:bg-slate-800 w-full max-w-md rounded-2xl p-6 shadow-2xl animate-in zoom-in-95">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                <Sparkles className="w-5 h-5 text-indigo-500" /> AI Message Drafter
                            </h3>
                            <button onClick={() => setShowAiModal(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-1 block">Campaign Topic</label>
                                <input
                                    value={aiTopic} onChange={e => setAiTopic(e.target.value)}
                                    className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
                                    placeholder="e.g. Free Eye Checkup Camp"
                                    autoFocus
                                />
                            </div>
                            <div>
                                <label className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-1 block">Tone</label>
                                <select
                                    value={aiTone} onChange={e => setAiTone(e.target.value)}
                                    className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
                                >
                                    <option value="Professional">Professional</option>
                                    <option value="Urgent">Urgent</option>
                                    <option value="Friendly">Friendly</option>
                                    <option value="Educational">Educational</option>
                                </select>
                            </div>

                            <div className="flex gap-3 mt-6">
                                <button onClick={() => setShowAiModal(false)} className="flex-1 py-3 font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 rounded-xl hover:bg-slate-200 transition-colors">Cancel</button>
                                <button
                                    onClick={handleGenerateAI}
                                    disabled={loadingAI || !aiTopic}
                                    className="flex-1 py-3 font-bold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2"
                                >
                                    {loadingAI ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />} Generate
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BulkSMS;
