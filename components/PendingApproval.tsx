import React from 'react';
import { Clock, LogOut, CheckCircle, ShieldCheck } from 'lucide-react';

interface PendingApprovalProps {
    clinicName?: string;
    onLogout: () => void;
}

const PendingApproval: React.FC<PendingApprovalProps> = ({ clinicName, onLogout }) => {
    return (
        <div className="min-h-screen bg-brand-cream/50 dark:bg-brand-dark flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-white dark:bg-[#1A1F2B] rounded-3xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-8 duration-700">
                <div className="bg-brand-blue/10 dark:bg-brand-blue/20 p-8 flex flex-col items-center justify-center border-b border-brand-blue/10">
                    <div className="w-20 h-20 bg-brand-blue/20 rounded-full flex items-center justify-center mb-4 animate-pulse">
                        <Clock className="w-10 h-10 text-brand-blue" />
                    </div>
                    <h2 className="text-2xl font-bold text-brand-dark dark:text-white text-center">Account Pending Approval</h2>
                    {clinicName && (
                        <p className="text-brand-blue font-medium mt-2 bg-brand-blue/10 px-4 py-1 rounded-full text-sm">
                            {clinicName}
                        </p>
                    )}
                </div>

                <div className="p-8 space-y-6">
                    <div className="space-y-4">
                        <div className="flex items-start gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-[#121721] border border-slate-100 dark:border-slate-800">
                            <div className="mt-1">
                                <CheckCircle className="w-5 h-5 text-green-500" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-brand-dark dark:text-white text-sm">Email Verified</h3>
                                <p className="text-slate-500 dark:text-slate-400 text-xs mt-1">
                                    Your email address has been successfully verified.
                                </p>
                            </div>
                        </div>

                        <div className="flex items-start gap-4 p-4 rounded-2xl bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30">
                            <div className="mt-1">
                                <ShieldCheck className="w-5 h-5 text-amber-500" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-brand-dark dark:text-white text-sm">Awaiting Administrator Review</h3>
                                <p className="text-slate-500 dark:text-slate-400 text-xs mt-1">
                                    Your clinic registration is currently being reviewed by our compliance team. You will be notified via email once approved.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="pt-4">
                        <button
                            onClick={onLogout}
                            className="w-full py-4 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 hover:border-brand-blue dark:hover:border-brand-blue text-slate-600 dark:text-slate-300 font-bold rounded-2xl transition-all flex items-center justify-center gap-2 group"
                        >
                            <LogOut className="w-5 h-5 group-hover:text-brand-blue transition-colors" />
                            <span className="group-hover:text-brand-dark dark:group-hover:text-white transition-colors">Sign Out</span>
                        </button>
                    </div>

                    <p className="text-center text-xs text-slate-400">
                        Need help? <a href="mailto:support@juaafya.com" className="text-brand-blue hover:underline">Contact Support</a>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default PendingApproval;
