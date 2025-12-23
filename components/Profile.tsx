import React, { useState, useEffect, useRef } from 'react';
import { 
    User, Mail, Phone, MapPin, Award, Calendar, Shield, Key, Camera, Edit2, Save, X, 
    CheckCircle, Clock, MinusCircle, Loader2, Bell, Smartphone, History, 
    Settings, LogOut, ChevronRight, AlertTriangle, Fingerprint, Lock, Activity as ActivityIcon,
    ArrowUpRight, Globe, Zap, Moon, Sun
} from 'lucide-react';
import useStore from '../store';
import { db } from '../services/db';
import ChangePasswordModal from './ChangePasswordModal';

const Profile: React.FC = () => {
    const { currentUser, actions } = useStore();
    const [activeTab, setActiveTab] = useState<'general' | 'security' | 'notifications' | 'activity'>('general');
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [status, setStatus] = useState<'Online' | 'Busy' | 'Away'>('Online');
    const [showChangePassword, setShowChangePassword] = useState(false);

    const [profile, setProfile] = useState({
        name: currentUser?.name || '',
        role: currentUser?.role || '',
        id: currentUser?.id || '',
        email: currentUser?.email || '',
        phone: currentUser?.phone || '',
        secondaryPhone: '',
        address: '',
        designation: currentUser?.role || '',
        bio: 'Senior Medical Administrator with over 10 years of experience in healthcare management.',
        joinedDate: 'January 2023',
        avatar: 'https://i.pravatar.cc/150?img=11'
    });

    const [tempProfile, setTempProfile] = useState(profile);
    const [notificationSettings, setNotificationSettings] = useState({
        emailAlerts: true,
        smsAlerts: false,
        pushNotifications: true,
        marketingEmails: false,
        securityAlerts: true
    });

    const [securitySettings, setSecuritySettings] = useState({
        twoFactorAuth: false,
        biometricLogin: true,
        sessionTimeout: '30m'
    });

    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleEditToggle = () => {
        if (isEditing) {
            setTempProfile(profile);
        }
        setIsEditing(!isEditing);
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await db.updateUser(profile.id, {
                name: tempProfile.name,
                email: tempProfile.email,
                phone: tempProfile.phone,
                designation: tempProfile.designation,
                address: tempProfile.address
            });
            setProfile(tempProfile);
            setIsEditing(false);
            // In a real app, update store here
        } catch (e) {
            console.error("Failed to update profile", e);
        } finally {
            setIsSaving(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setTempProfile({ ...tempProfile, [e.target.name]: e.target.value });
    };

    const handlePhotoClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setProfile({ ...profile, avatar: reader.result as string });
            };
            reader.readAsDataURL(file);
        }
    };

    const cycleStatus = () => {
        const statuses: ('Online' | 'Busy' | 'Away')[] = ['Online', 'Busy', 'Away'];
        const nextIndex = (statuses.indexOf(status) + 1) % statuses.length;
        setStatus(statuses[nextIndex]);
    };

    const getStatusColor = () => {
        if (status === 'Online') return 'bg-green-500';
        if (status === 'Busy') return 'bg-red-500';
        return 'bg-amber-500';
    };

    const calculateCompletion = () => {
        let score = 0;
        if (profile.name) score += 20;
        if (profile.email) score += 20;
        if (profile.phone) score += 20;
        if (profile.address) score += 20;
        if (profile.designation) score += 20;
        return score;
    };

    const completion = calculateCompletion();

    return (
        <div className="p-4 md:p-8 bg-slate-50 dark:bg-slate-900 min-h-screen transition-colors duration-300">
            <div className="max-w-7xl mx-auto">
                {/* Header Section */}
                <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div>
                        <h2 className="text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">Account Settings</h2>
                        <p className="text-slate-500 dark:text-slate-400 mt-2 text-lg">Manage your professional profile and security preferences.</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 transition-all shadow-sm">
                            <Zap className="w-5 h-5" />
                        </button>
                        <button className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 transition-all shadow-sm">
                            <Globe className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Left Column: ID Card & Navigation */}
                    <div className="lg:col-span-4 space-y-6">
                        {/* ID Card */}
                        <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-700 flex flex-col items-center text-center relative overflow-hidden transition-all hover:shadow-2xl hover:shadow-slate-200 dark:hover:shadow-none animate-in fade-in slide-in-from-left-4 duration-500">
                            <div className="absolute top-0 left-0 right-0 h-40 bg-gradient-to-br from-indigo-600 via-indigo-500 to-teal-400"></div>
                            
                            <div className="relative mt-20 mb-6 group">
                                <div className="w-32 h-32 rounded-[2rem] border-4 border-white dark:border-slate-800 shadow-2xl overflow-hidden bg-slate-200 transform transition-transform group-hover:scale-105 duration-300">
                                    <img src={profile.avatar} alt="Profile" className="w-full h-full object-cover" />
                                </div>
                                <input 
                                    type="file" 
                                    ref={fileInputRef} 
                                    className="hidden" 
                                    accept="image/*" 
                                    onChange={handleFileChange}
                                />
                                <button 
                                    onClick={handlePhotoClick}
                                    className="absolute -bottom-2 -right-2 p-3 bg-slate-900 dark:bg-indigo-600 text-white rounded-2xl shadow-xl hover:scale-110 active:scale-95 transition-all cursor-pointer ring-4 ring-white dark:ring-slate-800" 
                                    title="Change Photo"
                                >
                                    <Camera className="w-4 h-4" />
                                </button>
                            </div>

                            <div className="px-8 pb-8 w-full">
                                <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{profile.name}</h3>
                                <p className="text-indigo-600 dark:text-indigo-400 font-bold text-sm uppercase tracking-widest mt-1">{profile.role}</p>
                                
                                <div className="flex items-center justify-center gap-2 mt-4">
                                    <button 
                                        onClick={cycleStatus}
                                        className="flex items-center gap-2 bg-slate-50 dark:bg-slate-700/50 px-4 py-1.5 rounded-2xl border border-slate-100 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                                    >
                                        <div className={`w-2.5 h-2.5 rounded-full ${getStatusColor()} animate-pulse shadow-[0_0_8px] shadow-current`}></div>
                                        <span className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wide">{status}</span>
                                    </button>
                                </div>

                                {/* Profile Completion */}
                                <div className="mt-8 space-y-2">
                                    <div className="flex justify-between text-xs font-bold uppercase tracking-tighter">
                                        <span className="text-slate-400">Profile Completion</span>
                                        <span className="text-indigo-600">{completion}%</span>
                                    </div>
                                    <div className="h-2 w-full bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                                        <div 
                                            className="h-full bg-gradient-to-r from-indigo-500 to-teal-400 transition-all duration-1000 ease-out"
                                            style={{ width: `${completion}%` }}
                                        ></div>
                                    </div>
                                </div>

                                <div className="mt-8 grid grid-cols-3 gap-1 border-t border-slate-100 dark:border-slate-700 pt-6">
                                    <div className="text-center">
                                        <div className="text-lg font-black text-slate-900 dark:text-white">1.2k</div>
                                        <div className="text-[10px] uppercase font-bold text-slate-400 tracking-tighter">Patients</div>
                                    </div>
                                    <div className="text-center border-x border-slate-100 dark:border-slate-700 px-1">
                                        <div className="text-lg font-black text-slate-900 dark:text-white">4.9</div>
                                        <div className="text-[10px] uppercase font-bold text-slate-400 tracking-tighter">Rating</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-lg font-black text-slate-900 dark:text-white">10y</div>
                                        <div className="text-[10px] uppercase font-bold text-slate-400 tracking-tighter">Exp.</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Navigation Tabs (Vertical) */}
                        <div className="bg-white dark:bg-slate-800 p-3 rounded-[2rem] shadow-sm border border-slate-100 dark:border-slate-700">
                            <nav className="space-y-1">
                                <button 
                                    onClick={() => setActiveTab('general')}
                                    className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all ${activeTab === 'general' ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 shadow-inner' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50'}`}
                                >
                                    <div className="flex items-center gap-3">
                                        <User className="w-5 h-5" />
                                        <span className="font-bold">General Information</span>
                                    </div>
                                    <ChevronRight className={`w-4 h-4 transition-transform ${activeTab === 'general' ? 'rotate-90' : ''}`} />
                                </button>
                                <button 
                                    onClick={() => setActiveTab('security')}
                                    className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all ${activeTab === 'security' ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 shadow-inner' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50'}`}
                                >
                                    <div className="flex items-center gap-3">
                                        <Shield className="w-5 h-5" />
                                        <span className="font-bold">Security & Privacy</span>
                                    </div>
                                    <ChevronRight className={`w-4 h-4 transition-transform ${activeTab === 'security' ? 'rotate-90' : ''}`} />
                                </button>
                                <button 
                                    onClick={() => setActiveTab('notifications')}
                                    className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all ${activeTab === 'notifications' ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 shadow-inner' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50'}`}
                                >
                                    <div className="flex items-center gap-3">
                                        <Bell className="w-5 h-5" />
                                        <span className="font-bold">Notifications</span>
                                    </div>
                                    <ChevronRight className={`w-4 h-4 transition-transform ${activeTab === 'notifications' ? 'rotate-90' : ''}`} />
                                </button>
                                <button 
                                    onClick={() => setActiveTab('activity')}
                                    className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all ${activeTab === 'activity' ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 shadow-inner' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50'}`}
                                >
                                    <div className="flex items-center gap-3">
                                        <History className="w-5 h-5" />
                                        <span className="font-bold">Activity Logs</span>
                                    </div>
                                    <ChevronRight className={`w-4 h-4 transition-transform ${activeTab === 'activity' ? 'rotate-90' : ''}`} />
                                </button>
                            </nav>
                        </div>

                        {/* Logout Section */}
                        <div className="p-4 border border-red-100 dark:border-red-900/30 rounded-[2rem] bg-red-50/50 dark:bg-red-900/10 flex flex-col items-center">
                            <p className="text-xs font-bold text-red-600 dark:text-red-400 uppercase tracking-widest mb-3">Critical Actions</p>
                            <button className="w-full flex items-center justify-center gap-2 p-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-all shadow-lg shadow-red-200 dark:shadow-none">
                                <LogOut className="w-4 h-4" /> Sign Out
                            </button>
                        </div>
                    </div>

                    {/* Right Column: Content Area */}
                    <div className="lg:col-span-8 animate-in fade-in slide-in-from-right-4 duration-500">
                        {activeTab === 'general' && (
                            <div className="bg-white dark:bg-slate-800 p-8 md:p-10 rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-slate-700 transition-colors h-full">
                                <div className="flex items-center justify-between mb-10">
                                    <div>
                                        <h3 className="text-2xl font-bold text-slate-900 dark:text-white">Personal Information</h3>
                                        <p className="text-slate-500 text-sm mt-1">Basic details for your professional profile.</p>
                                    </div>
                                    {!isEditing ? (
                                        <button 
                                            onClick={handleEditToggle}
                                            className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 flex items-center gap-2 shadow-lg shadow-indigo-100 dark:shadow-none transition-all active:scale-95"
                                        >
                                            <Edit2 className="w-4 h-4" /> Edit Profile
                                        </button>
                                    ) : (
                                        <div className="flex gap-3">
                                            <button 
                                                onClick={handleEditToggle}
                                                className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold hover:bg-slate-50 transition-all"
                                            >
                                                Cancel
                                            </button>
                                            <button 
                                                onClick={handleSave}
                                                disabled={isSaving}
                                                className="px-5 py-2.5 rounded-xl bg-green-600 text-white font-bold hover:bg-green-700 flex items-center gap-2 shadow-lg shadow-green-100 dark:shadow-none transition-all disabled:opacity-50"
                                            >
                                                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save
                                            </button>
                                        </div>
                                    )}
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-2">
                                        <label className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Full Name</label>
                                        <div className={`flex items-center gap-3 p-4 rounded-2xl border transition-all ${isEditing ? 'bg-white dark:bg-slate-900 border-indigo-500 ring-4 ring-indigo-50 dark:ring-indigo-900/20 shadow-inner' : 'bg-slate-50 dark:bg-slate-700/30 border-slate-100 dark:border-slate-700'}`}>
                                            <User className="w-5 h-5 text-indigo-500 shrink-0" />
                                            {isEditing ? (
                                                <input 
                                                    name="name"
                                                    value={tempProfile.name}
                                                    onChange={handleChange}
                                                    className="bg-transparent border-none outline-none w-full text-slate-900 dark:text-white text-base font-semibold"
                                                />
                                            ) : (
                                                <span className="text-slate-700 dark:text-slate-200 text-base font-semibold truncate">{profile.name}</span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Email Address</label>
                                        <div className={`flex items-center gap-3 p-4 rounded-2xl border transition-all ${isEditing ? 'bg-white dark:bg-slate-900 border-indigo-500 ring-4 ring-indigo-50 dark:ring-indigo-900/20 shadow-inner' : 'bg-slate-50 dark:bg-slate-700/30 border-slate-100 dark:border-slate-700'}`}>
                                            <Mail className="w-5 h-5 text-indigo-500 shrink-0" />
                                            {isEditing ? (
                                                <input 
                                                    name="email"
                                                    value={tempProfile.email}
                                                    onChange={handleChange}
                                                    className="bg-transparent border-none outline-none w-full text-slate-900 dark:text-white text-base font-semibold"
                                                />
                                            ) : (
                                                <span className="text-slate-700 dark:text-slate-200 text-base font-semibold truncate">{profile.email}</span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Primary Phone</label>
                                        <div className={`flex items-center gap-3 p-4 rounded-2xl border transition-all ${isEditing ? 'bg-white dark:bg-slate-900 border-indigo-500 ring-4 ring-indigo-50 dark:ring-indigo-900/20 shadow-inner' : 'bg-slate-50 dark:bg-slate-700/30 border-slate-100 dark:border-slate-700'}`}>
                                            <Phone className="w-5 h-5 text-indigo-500 shrink-0" />
                                            {isEditing ? (
                                                <input 
                                                    name="phone"
                                                    value={tempProfile.phone}
                                                    onChange={handleChange}
                                                    className="bg-transparent border-none outline-none w-full text-slate-900 dark:text-white text-base font-semibold"
                                                />
                                            ) : (
                                                <span className="text-slate-700 dark:text-slate-200 text-base font-semibold truncate">{profile.phone || '+254 --- --- ---'}</span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Designation</label>
                                        <div className={`flex items-center gap-3 p-4 rounded-2xl border transition-all ${isEditing ? 'bg-white dark:bg-slate-900 border-indigo-500 ring-4 ring-indigo-50 dark:ring-indigo-900/20 shadow-inner' : 'bg-slate-50 dark:bg-slate-700/30 border-slate-100 dark:border-slate-700'}`}>
                                            <Award className="w-5 h-5 text-indigo-500 shrink-0" />
                                            {isEditing ? (
                                                <input 
                                                    name="designation"
                                                    value={tempProfile.designation}
                                                    onChange={handleChange}
                                                    className="bg-transparent border-none outline-none w-full text-slate-900 dark:text-white text-base font-semibold"
                                                />
                                            ) : (
                                                <span className="text-slate-700 dark:text-slate-200 text-base font-semibold truncate">{profile.designation}</span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="space-y-2 md:col-span-2">
                                        <label className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Professional Bio</label>
                                        <div className={`flex items-start gap-3 p-4 rounded-2xl border transition-all ${isEditing ? 'bg-white dark:bg-slate-900 border-indigo-500 ring-4 ring-indigo-50 dark:ring-indigo-900/20 shadow-inner' : 'bg-slate-50 dark:bg-slate-700/30 border-slate-100 dark:border-slate-700'}`}>
                                            <Edit2 className="w-5 h-5 text-indigo-500 shrink-0 mt-1" />
                                            {isEditing ? (
                                                <textarea 
                                                    name="bio"
                                                    value={tempProfile.bio}
                                                    onChange={handleChange}
                                                    rows={4}
                                                    className="bg-transparent border-none outline-none w-full text-slate-900 dark:text-white text-base font-semibold resize-none"
                                                />
                                            ) : (
                                                <p className="text-slate-700 dark:text-slate-200 text-base font-medium leading-relaxed">{profile.bio}</p>
                                            )}
                                        </div>
                                    </div>
                                    <div className="space-y-2 md:col-span-2">
                                        <label className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Office Address</label>
                                        <div className={`flex items-center gap-3 p-4 rounded-2xl border transition-all ${isEditing ? 'bg-white dark:bg-slate-900 border-indigo-500 ring-4 ring-indigo-50 dark:ring-indigo-900/20 shadow-inner' : 'bg-slate-50 dark:bg-slate-700/30 border-slate-100 dark:border-slate-700'}`}>
                                            <MapPin className="w-5 h-5 text-indigo-500 shrink-0" />
                                            {isEditing ? (
                                                <input 
                                                    name="address"
                                                    value={tempProfile.address}
                                                    onChange={handleChange}
                                                    className="bg-transparent border-none outline-none w-full text-slate-900 dark:text-white text-base font-semibold"
                                                />
                                            ) : (
                                                <span className="text-slate-700 dark:text-slate-200 text-base font-semibold truncate">{profile.address || 'Address not set'}</span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-12 p-6 bg-indigo-50/50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-900/30 rounded-3xl flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-white dark:bg-slate-800 rounded-2xl flex items-center justify-center shadow-sm">
                                            <Zap className="w-6 h-6 text-indigo-600" />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-slate-900 dark:text-white">Admin Level Access</h4>
                                            <p className="text-xs text-slate-500">You have full permission to manage system settings.</p>
                                        </div>
                                    </div>
                                    <div className="px-4 py-1.5 bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest rounded-full">System Admin</div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'security' && (
                            <div className="bg-white dark:bg-slate-800 p-8 md:p-10 rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-slate-700 h-full">
                                <div className="mb-10">
                                    <h3 className="text-2xl font-bold text-slate-900 dark:text-white">Security & Privacy</h3>
                                    <p className="text-slate-500 text-sm mt-1">Protect your account and manage access.</p>
                                </div>

                                <div className="space-y-6">
                                    {/* Change Password Card */}
                                    <div className="group flex items-center justify-between p-6 border border-slate-100 dark:border-slate-700 rounded-[2rem] hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-all cursor-pointer" onClick={() => setShowChangePassword(true)}>
                                        <div className="flex items-center gap-5">
                                            <div className="w-14 h-14 bg-indigo-100 dark:bg-indigo-900/30 rounded-2xl flex items-center justify-center text-indigo-600 group-hover:scale-110 transition-transform shadow-sm">
                                                <Key className="w-7 h-7" />
                                            </div>
                                            <div>
                                                <div className="font-bold text-slate-900 dark:text-white text-lg">Change Password</div>
                                                <div className="text-sm text-slate-500">Update your account credentials.</div>
                                            </div>
                                        </div>
                                        <button className="p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-xl shadow-sm text-slate-400 group-hover:text-indigo-600 group-hover:border-indigo-200 transition-all">
                                            <ChevronRight className="w-5 h-5" />
                                        </button>
                                    </div>

                                    {/* 2FA Section */}
                                    <div className="p-8 border border-slate-100 dark:border-slate-700 rounded-[2rem] bg-slate-50/50 dark:bg-slate-900/10">
                                        <div className="flex items-center justify-between mb-8">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 rounded-2xl flex items-center justify-center text-indigo-600">
                                                    <Smartphone className="w-6 h-6" />
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-slate-900 dark:text-white">Two-Factor Authentication</h4>
                                                    <p className="text-sm text-slate-500">Add an extra layer of security to your account.</p>
                                                </div>
                                            </div>
                                            <button 
                                                onClick={() => setSecuritySettings({...securitySettings, twoFactorAuth: !securitySettings.twoFactorAuth})}
                                                className={`w-14 h-7 rounded-full relative transition-all ${securitySettings.twoFactorAuth ? 'bg-green-500' : 'bg-slate-300 dark:bg-slate-600'}`}
                                            >
                                                <div className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow-md transition-all ${securitySettings.twoFactorAuth ? 'right-1' : 'left-1'}`}></div>
                                            </button>
                                        </div>

                                        {securitySettings.twoFactorAuth ? (
                                            <div className="flex flex-col md:flex-row items-center gap-6 p-6 bg-white dark:bg-slate-800 rounded-2xl border border-green-100 dark:border-green-900/20 shadow-sm animate-in zoom-in-95 duration-300">
                                                <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-2xl">
                                                    <Fingerprint className="w-12 h-12 text-green-500" />
                                                </div>
                                                <div>
                                                    <h5 className="font-bold text-slate-900 dark:text-white">2FA is dynamic and secure</h5>
                                                    <p className="text-sm text-slate-500">Your account is now protected by biometric or app-based authentication.</p>
                                                </div>
                                                <button className="text-indigo-600 font-bold text-sm ml-auto hover:underline">Manage methods</button>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-3 text-sm text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/10 p-4 rounded-xl border border-amber-100 dark:border-amber-900/30 font-semibold">
                                                <AlertTriangle className="w-4 h-4" />
                                                Your account has a lower security score without 2FA enabled.
                                            </div>
                                        )}
                                    </div>

                                    {/* Session History */}
                                    <div className="space-y-4">
                                        <h4 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                            <History className="w-5 h-5 text-indigo-600" />
                                            Active Sessions
                                        </h4>
                                        <div className="border border-slate-100 dark:border-slate-700 rounded-3xl overflow-hidden">
                                            <table className="w-full text-sm text-left">
                                                <thead className="bg-slate-50 dark:bg-slate-700/50 text-xs font-bold uppercase text-slate-400 border-b border-slate-100 dark:border-slate-700">
                                                    <tr>
                                                        <th className="px-6 py-4 tracking-[0.1em]">Device / Browser</th>
                                                        <th className="px-6 py-4 tracking-[0.1em]">Location</th>
                                                        <th className="px-6 py-4 tracking-[0.1em]">Time</th>
                                                        <th className="px-6 py-4 text-right tracking-[0.1em]">Action</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-50 dark:divide-slate-700">
                                                    <tr className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                                                        <td className="px-6 py-5">
                                                            <div className="flex items-center gap-3 text-slate-900 dark:text-white font-bold">
                                                                <Zap className="w-4 h-4 text-indigo-500" />
                                                                Chrome on macOS (Current)
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-5 text-slate-600 dark:text-slate-400 font-medium text-xs">Nairobi, KE • 192.168.1.1</td>
                                                        <td className="px-6 py-5 text-slate-600 dark:text-slate-400 font-medium text-xs">Just Now</td>
                                                        <td className="px-6 py-5 text-right"><span className="text-green-500 font-black text-[10px] uppercase">Active</span></td>
                                                    </tr>
                                                    <tr className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                                                        <td className="px-6 py-5">
                                                            <div className="flex items-center gap-3 text-slate-900 dark:text-white font-bold">
                                                                <Smartphone className="w-4 h-4 text-slate-400" />
                                                                Safari on iPhone 15
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-5 text-slate-600 dark:text-slate-400 font-medium text-xs">Nairobi, KE • 105.163.54.2</td>
                                                        <td className="px-6 py-5 text-slate-600 dark:text-slate-400 font-medium text-xs">2 hours ago</td>
                                                        <td className="px-6 py-5 text-right"><button className="text-red-500 font-black text-[10px] uppercase hover:underline">Revoke</button></td>
                                                    </tr>
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'notifications' && (
                            <div className="bg-white dark:bg-slate-800 p-8 md:p-10 rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-slate-700 h-full">
                                <div className="mb-10">
                                    <h3 className="text-2xl font-bold text-slate-900 dark:text-white">Notification Preferences</h3>
                                    <p className="text-slate-500 text-sm mt-1">Control how and when you receive system alerts.</p>
                                </div>

                                <div className="space-y-4">
                                    {Object.entries({
                                        emailAlerts: { label: 'Email Notifications', desc: 'System updates, password resets and critical clinic alerts.', icon: <Mail className="w-5 h-5" /> },
                                        smsAlerts: { label: 'SMS & WhatsApp Alerts', desc: 'Urgent appointment notifications and billing receipts.', icon: <Smartphone className="w-5 h-5" /> },
                                        pushNotifications: { label: 'In-app Notifications', desc: 'Browser notifications for immediate nurse & staff tasks.', icon: <Zap className="w-5 h-5" /> },
                                        marketingEmails: { label: 'Product Updates', desc: 'Periodic emails about new features and platform improvements.', icon: <ActivityIcon className="w-5 h-5" /> },
                                        securityAlerts: { label: 'Security Alerts', desc: 'Instant alerts for any login from a new device.', icon: <Lock className="w-5 h-5" /> }
                                    }).map(([key, data]) => (
                                        <div key={key} className="flex flex-col sm:flex-row sm:items-center justify-between p-6 bg-slate-50/50 dark:bg-slate-900/20 border border-slate-100 dark:border-slate-800 rounded-3xl gap-4 hover:border-indigo-100 dark:hover:border-indigo-900/30 transition-all">
                                            <div className="flex items-start gap-4">
                                                <div className="p-3 bg-white dark:bg-slate-800 rounded-2xl shadow-sm text-indigo-600">
                                                    {data.icon}
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-slate-900 dark:text-white">{data.label}</h4>
                                                    <p className="text-xs text-slate-500 mt-1 max-w-sm font-medium">{data.desc}</p>
                                                </div>
                                            </div>
                                            <button 
                                                onClick={() => setNotificationSettings({...notificationSettings, [key]: !notificationSettings[key as keyof typeof notificationSettings]})}
                                                className={`w-14 h-7 rounded-full relative transition-all shrink-0 ${notificationSettings[key as keyof typeof notificationSettings] ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-600'}`}
                                            >
                                                <div className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow-md transition-all ${notificationSettings[key as keyof typeof notificationSettings] ? 'right-1' : 'left-1'}`}></div>
                                            </button>
                                        </div>
                                    ))}
                                </div>

                                <div className="mt-10 pt-10 border-t border-slate-100 dark:border-slate-700 flex justify-end">
                                    <button className="px-8 py-3 bg-indigo-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-indigo-700 shadow-xl shadow-indigo-200 dark:shadow-none transition-all active:scale-95">
                                        Save Preferences
                                    </button>
                                </div>
                            </div>
                        )}

                        {activeTab === 'activity' && (
                            <div className="bg-white dark:bg-slate-800 p-8 md:p-10 rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-slate-700 h-full">
                                <div className="flex items-center justify-between mb-10">
                                    <div>
                                        <h3 className="text-2xl font-bold text-slate-900 dark:text-white">Recent Activity</h3>
                                        <p className="text-slate-500 text-sm mt-1">Audit log of your recent system interactions.</p>
                                    </div>
                                    <button className="p-3 bg-slate-50 dark:bg-slate-700/50 text-slate-400 hover:text-indigo-600 rounded-2xl transition-colors">
                                        <ArrowUpRight className="w-5 h-5" />
                                    </button>
                                </div>

                                <div className="space-y-4">
                                    {[
                                        { action: 'Updated patient record', target: 'Alice Johnson', time: '10 mins ago', type: 'update', icon: <User className="w-4 h-4" /> },
                                        { action: 'Changed system security policy', target: 'Global Settings', time: '2 hours ago', type: 'security', icon: <Shield className="w-4 h-4" /> },
                                        { action: 'Approved clinic subscription', target: 'Sunshine Medical', time: 'Yesterday', type: 'billing', icon: <CheckCircle className="w-4 h-4" /> },
                                        { action: 'Logged in from new device', target: 'iPhone 15', time: '2 days ago', type: 'access', icon: <Smartphone className="w-4 h-4" /> },
                                        { action: 'Downloaded revenue report', target: 'Monthly_Dec.pdf', time: '3 days ago', type: 'report', icon: <Save className="w-4 h-4" /> },
                                    ].map((item, i) => (
                                        <div key={i} className="flex items-center justify-between p-5 hover:bg-slate-50 dark:hover:bg-slate-700/30 rounded-3xl transition-all border border-transparent hover:border-slate-100 dark:hover:border-slate-700 group">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl flex items-center justify-center text-slate-500 group-hover:text-indigo-600 group-hover:border-indigo-100 transition-all">
                                                    {item.icon}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-slate-800 dark:text-white group-hover:text-slate-900 dark:group-hover:text-white transition-colors">{item.action}</p>
                                                    <p className="text-xs text-slate-500 font-medium">Target: <span className="text-indigo-600 dark:text-indigo-400">{item.target}</span></p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-xs font-bold text-slate-400">{item.time}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="mt-8 text-center">
                                    <button className="text-sm font-black text-indigo-600 uppercase tracking-widest hover:underline">View All History</button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Change Password Modal Integration */}
            <ChangePasswordModal 
                isOpen={showChangePassword} 
                onClose={() => setShowChangePassword(false)} 
                onSuccess={() => {
                    // Success logic here
                }}
            />
        </div>
    );
};

export default Profile;
