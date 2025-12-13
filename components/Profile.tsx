import React, { useState } from 'react';
import { User, Mail, Phone, MapPin, Award, Calendar, Shield, Key, Camera, Edit2, Save, X, CheckCircle, Clock, MinusCircle } from 'lucide-react';

const Profile: React.FC = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [status, setStatus] = useState<'Online' | 'Busy' | 'Away'>('Online');
  
  const [profile, setProfile] = useState({
    name: 'Dr. Andrew Kimani',
    role: 'General Practitioner',
    id: 'DOC-88234',
    email: 'andrew@juaafya.com',
    phone: '+254 712 345 678',
    secondaryPhone: '',
    address: 'JuaAfya Medical Centre, Ngong Road, Nairobi',
    designation: 'Senior Medical Officer'
  });

  const [tempProfile, setTempProfile] = useState(profile);

  const handleEditToggle = () => {
    if (isEditing) {
        // Cancel logic: revert changes
        setTempProfile(profile);
    }
    setIsEditing(!isEditing);
  };

  const handleSave = () => {
      setProfile(tempProfile);
      setIsEditing(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setTempProfile({ ...tempProfile, [e.target.name]: e.target.value });
  };

  const cycleStatus = () => {
      if (status === 'Online') setStatus('Busy');
      else if (status === 'Busy') setStatus('Away');
      else setStatus('Online');
  };

  const getStatusColor = () => {
      if (status === 'Online') return 'bg-green-500';
      if (status === 'Busy') return 'bg-red-500';
      return 'bg-amber-500';
  };

  return (
    <div className="p-6 md:p-10 bg-gray-50 dark:bg-slate-900 min-h-screen transition-colors duration-200">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-slate-900 dark:text-white">My Profile</h2>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Manage your personal information</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: ID Card */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col items-center text-center relative overflow-hidden transition-colors">
            <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-br from-brand-500 to-teal-700"></div>
            
            <div className="relative mt-12 mb-4 group">
                <div className="w-28 h-28 rounded-full border-4 border-white dark:border-slate-800 shadow-md overflow-hidden bg-slate-200">
                    <img src="https://i.pravatar.cc/150?img=11" alt="Profile" className="w-full h-full object-cover" />
                </div>
                <button className="absolute bottom-1 right-1 p-2 bg-slate-900 text-white rounded-full shadow-lg hover:bg-slate-700 transition-colors cursor-pointer" title="Change Photo">
                    <Camera className="w-3.5 h-3.5" />
                </button>
            </div>
            
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">{profile.name}</h3>
            <p className="text-teal-600 dark:text-teal-400 font-medium text-sm">{profile.role}</p>
            
            <div className="flex items-center gap-2 mt-2 bg-slate-50 dark:bg-slate-700/50 px-3 py-1 rounded-full border border-slate-100 dark:border-slate-600">
                <div className={`w-2 h-2 rounded-full ${getStatusColor()} animate-pulse`}></div>
                <span className="text-xs font-medium text-slate-600 dark:text-slate-300 uppercase tracking-wide">{status}</span>
            </div>

            <div className="mt-6 flex items-center justify-center gap-4 w-full">
                <div className="text-center">
                    <div className="text-lg font-bold text-slate-900 dark:text-white">1.2k</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">Patients</div>
                </div>
                <div className="w-px h-8 bg-slate-100 dark:bg-slate-700"></div>
                <div className="text-center">
                    <div className="text-lg font-bold text-slate-900 dark:text-white">4.9</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">Rating</div>
                </div>
                <div className="w-px h-8 bg-slate-100 dark:bg-slate-700"></div>
                <div className="text-center">
                    <div className="text-lg font-bold text-slate-900 dark:text-white">5y</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">Exp.</div>
                </div>
            </div>

            <button 
                onClick={cycleStatus}
                className="mt-8 w-full py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors flex items-center justify-center gap-2"
            >
                {status === 'Online' ? <MinusCircle className="w-4 h-4"/> : status === 'Busy' ? <Clock className="w-4 h-4"/> : <CheckCircle className="w-4 h-4"/>}
                Change Status
            </button>
          </div>

          {/* Quick Schedule */}
          <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 transition-colors">
              <h4 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-teal-500" />
                  Weekly Schedule
              </h4>
              <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                      <span className="text-slate-500 dark:text-slate-400">Mon - Fri</span>
                      <span className="font-medium text-slate-900 dark:text-white">08:00 AM - 05:00 PM</span>
                  </div>
                  <div className="flex justify-between text-sm">
                      <span className="text-slate-500 dark:text-slate-400">Saturday</span>
                      <span className="font-medium text-slate-900 dark:text-white">09:00 AM - 01:00 PM</span>
                  </div>
                  <div className="flex justify-between text-sm">
                      <span className="text-slate-500 dark:text-slate-400">Sunday</span>
                      <span className="font-medium text-red-500">Off Duty</span>
                  </div>
              </div>
          </div>
        </div>

        {/* Right Column: Forms */}
        <div className="lg:col-span-2 space-y-6">
            
            {/* Personal Details */}
            <div className="bg-white dark:bg-slate-800 p-6 md:p-8 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 transition-colors">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">Personal Information</h3>
                    {!isEditing ? (
                        <button 
                            onClick={handleEditToggle}
                            className="text-sm text-teal-600 dark:text-teal-400 font-medium hover:underline flex items-center gap-1"
                        >
                            <Edit2 className="w-3.5 h-3.5" /> Edit Details
                        </button>
                    ) : (
                        <div className="flex gap-2">
                            <button 
                                onClick={handleEditToggle}
                                className="text-sm text-slate-500 dark:text-slate-400 font-medium hover:underline flex items-center gap-1"
                            >
                                <X className="w-3.5 h-3.5" /> Cancel
                            </button>
                             <button 
                                onClick={handleSave}
                                className="text-sm text-teal-600 dark:text-teal-400 font-bold hover:underline flex items-center gap-1"
                            >
                                <Save className="w-3.5 h-3.5" /> Save
                            </button>
                        </div>
                    )}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Full Name</label>
                        <div className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${isEditing ? 'bg-white dark:bg-slate-900 border-teal-500 ring-1 ring-teal-500' : 'bg-slate-50 dark:bg-slate-700/50 border-slate-100 dark:border-slate-700'}`}>
                            <User className="w-4 h-4 text-slate-400 shrink-0" />
                            {isEditing ? (
                                <input 
                                    name="name" 
                                    value={tempProfile.name} 
                                    onChange={handleChange}
                                    className="bg-transparent border-none outline-none w-full text-slate-900 dark:text-white text-sm font-medium"
                                />
                            ) : (
                                <span className="text-slate-700 dark:text-slate-200 text-sm font-medium truncate">{profile.name}</span>
                            )}
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Email Address</label>
                        <div className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${isEditing ? 'bg-white dark:bg-slate-900 border-teal-500 ring-1 ring-teal-500' : 'bg-slate-50 dark:bg-slate-700/50 border-slate-100 dark:border-slate-700'}`}>
                            <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                            {isEditing ? (
                                <input 
                                    name="email" 
                                    value={tempProfile.email} 
                                    onChange={handleChange}
                                    className="bg-transparent border-none outline-none w-full text-slate-900 dark:text-white text-sm font-medium"
                                />
                            ) : (
                                <span className="text-slate-700 dark:text-slate-200 text-sm font-medium truncate">{profile.email}</span>
                            )}
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Phone Number</label>
                        <div className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${isEditing ? 'bg-white dark:bg-slate-900 border-teal-500 ring-1 ring-teal-500' : 'bg-slate-50 dark:bg-slate-700/50 border-slate-100 dark:border-slate-700'}`}>
                            <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                            {isEditing ? (
                                <input 
                                    name="phone" 
                                    value={tempProfile.phone} 
                                    onChange={handleChange}
                                    className="bg-transparent border-none outline-none w-full text-slate-900 dark:text-white text-sm font-medium"
                                />
                            ) : (
                                <span className="text-slate-700 dark:text-slate-200 text-sm font-medium truncate">{profile.phone}</span>
                            )}
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Alternative Phone</label>
                        <div className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${isEditing ? 'bg-white dark:bg-slate-900 border-teal-500 ring-1 ring-teal-500' : 'bg-slate-50 dark:bg-slate-700/50 border-slate-100 dark:border-slate-700'}`}>
                            <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                            {isEditing ? (
                                <input 
                                    name="secondaryPhone" 
                                    value={tempProfile.secondaryPhone} 
                                    onChange={handleChange}
                                    placeholder="Add secondary number..."
                                    className="bg-transparent border-none outline-none w-full text-slate-900 dark:text-white text-sm font-medium"
                                />
                            ) : (
                                <span className="text-slate-700 dark:text-slate-200 text-sm font-medium truncate">{profile.secondaryPhone || 'Not set'}</span>
                            )}
                        </div>
                    </div>
                    <div className="space-y-2 md:col-span-2">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Designation</label>
                        <div className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${isEditing ? 'bg-white dark:bg-slate-900 border-teal-500 ring-1 ring-teal-500' : 'bg-slate-50 dark:bg-slate-700/50 border-slate-100 dark:border-slate-700'}`}>
                            <Award className="w-4 h-4 text-slate-400 shrink-0" />
                            {isEditing ? (
                                <input 
                                    name="designation" 
                                    value={tempProfile.designation} 
                                    onChange={handleChange}
                                    className="bg-transparent border-none outline-none w-full text-slate-900 dark:text-white text-sm font-medium"
                                />
                            ) : (
                                <span className="text-slate-700 dark:text-slate-200 text-sm font-medium truncate">{profile.designation}</span>
                            )}
                        </div>
                    </div>
                     <div className="space-y-2 md:col-span-2">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Clinic Address</label>
                        <div className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${isEditing ? 'bg-white dark:bg-slate-900 border-teal-500 ring-1 ring-teal-500' : 'bg-slate-50 dark:bg-slate-700/50 border-slate-100 dark:border-slate-700'}`}>
                            <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                            {isEditing ? (
                                <input 
                                    name="address" 
                                    value={tempProfile.address} 
                                    onChange={handleChange}
                                    className="bg-transparent border-none outline-none w-full text-slate-900 dark:text-white text-sm font-medium"
                                />
                            ) : (
                                <span className="text-slate-700 dark:text-slate-200 text-sm font-medium truncate">{profile.address}</span>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Security */}
             <div className="bg-white dark:bg-slate-800 p-6 md:p-8 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 transition-colors">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <Shield className="w-5 h-5 text-teal-500" />
                        Security & Login
                    </h3>
                </div>

                <div className="space-y-4">
                     <div className="flex items-center justify-between p-4 border border-slate-100 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors cursor-pointer group">
                        <div className="flex items-center gap-4">
                            <div className="p-2 bg-orange-50 dark:bg-orange-900/20 rounded-lg text-orange-600 dark:text-orange-400 group-hover:scale-110 transition-transform">
                                <Key className="w-5 h-5" />
                            </div>
                            <div>
                                <div className="font-semibold text-slate-900 dark:text-white text-sm">Change Password</div>
                                <div className="text-xs text-slate-500 dark:text-slate-400">Last changed 30 days ago</div>
                            </div>
                        </div>
                        <button className="text-sm font-medium text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">Update</button>
                    </div>
                </div>
             </div>

        </div>
      </div>
    </div>
  );
};

export default Profile;
