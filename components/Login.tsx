import React, { useState, useEffect } from 'react';
import { TeamMember, ClinicSettings } from '../types';
import { Lock, Mail, ChevronRight, Activity, Eye, EyeOff, Globe, Phone, ShieldCheck, User, Zap, Building2, ArrowRight, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

interface LoginProps {
  onLogin: (user: TeamMember) => void;
  team: TeamMember[];
  systemAdmin: TeamMember;
}

const Login: React.FC<LoginProps> = ({ onLogin, team, systemAdmin }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isPendingApproval, setIsPendingApproval] = useState(false);

  // Login Form State
  const [loginForm, setLoginForm] = useState({
    email: '',
    password: ''
  });

  // Sign Up Form State
  const [signUpForm, setSignUpForm] = useState({
    clinicName: '',
    fullName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // Input validation
      if (!loginForm.email || !loginForm.password) {
        throw new Error('Email and password are required');
      }

      if (loginForm.password.length < 6) {
        throw new Error('Invalid credentials');
      }

      // Supabase Authentication
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: loginForm.email.trim().toLowerCase(),
        password: loginForm.password,
      });

      if (authError) {
        console.error('Auth error:', authError);
        throw new Error('Invalid email or password');
      }

      if (!data.user) {
        throw new Error('Login failed: No user data returned');
      }

      // Construct User Object
      const user: TeamMember = {
        id: data.user.id,
        name: data.user.user_metadata?.full_name || loginForm.email.split('@')[0],
        email: data.user.email || '',
        role: (data.user.user_metadata?.role as any) || 'Doctor',
        status: 'Active',
        lastActive: 'Now',
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(data.user.email || 'User')}`,
      };

      onLogin(user);
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message || 'Invalid email or password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUpSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setError('');

      if (signUpForm.password !== signUpForm.confirmPassword) {
          setError('Passwords do not match');
          return;
      }
      if (signUpForm.password.length < 6) {
          setError('Password must be at least 6 characters');
          return;
      }

      setIsLoading(true);

      try {
          const { data, error: signUpError } = await supabase.auth.signUp({
              email: signUpForm.email,
              password: signUpForm.password,
              options: {
                  data: {
                      full_name: signUpForm.fullName,
                      clinic_name: signUpForm.clinicName,
                      role: 'Admin' // Default role for new signups
                  }
              }
          });

          if (signUpError) throw signUpError;

          setIsPendingApproval(true);
      } catch (err: any) {
          setError(err.message);
      } finally {
          setIsLoading(false);
      }
  };


  return (
    <div className="min-h-screen bg-brand-cream/50 dark:bg-brand-dark flex items-center justify-center p-4 md:p-8 font-sans">
      <div className="w-full max-w-[1400px] bg-white dark:bg-[#1A1F2B] rounded-[2.5rem] shadow-2xl shadow-brand-dark/10 overflow-hidden flex flex-col lg:flex-row min-h-[800px]">
        
        {/* LEFT SIDE - Brand & Visual */}
        <div className="lg:w-1/2 bg-brand-dark relative overflow-hidden flex flex-col justify-center items-center p-12 text-white">
            <div className="absolute top-0 left-0 w-full h-full opacity-30 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-brand-blue rounded-full blur-[160px] opacity-40"></div>
                <div className="absolute bottom-[10%] right-[-10%] w-[400px] h-[400px] bg-brand-teal rounded-full blur-[128px] opacity-30"></div>
            </div>

            <div className="relative z-10 text-center mb-16">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/5 backdrop-blur-md mb-6">
                    <span className="w-2 h-2 rounded-full bg-brand-yellow"></span>
                    <span className="text-[10px] font-bold tracking-widest uppercase text-brand-yellow">Enterprise Edition</span>
                </div>
                <h1 className="text-5xl md:text-6xl font-bold leading-[1.1] mb-6 tracking-tight">
                    Manage your <br/>
                    <span className="text-brand-blue">clinic growth.</span>
                </h1>
                <p className="text-slate-400 text-lg max-w-md mx-auto leading-relaxed">
                    Secure, scalable, and simple. Powered by Supabase.
                </p>
            </div>

            {/* CSS Phone Mockup */}
            <div className="relative z-10 w-[320px] h-[600px] bg-brand-dark rounded-[3rem] border-[8px] border-[#252b3b] shadow-2xl rotate-[-8deg] translate-y-16 hover:rotate-0 transition-transform duration-700 ease-out hidden md:block">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 h-7 w-36 bg-[#252b3b] rounded-b-2xl z-20"></div>
                <div className="w-full h-full bg-brand-dark rounded-[2.5rem] overflow-hidden flex flex-col pt-12 px-5 pb-6">
                    <div className="flex justify-between items-center mb-8">
                        <div className="flex flex-col">
                            <span className="text-xs text-slate-400 font-medium">Total Revenue</span>
                            <span className="text-3xl font-bold text-white tracking-tight">897.00 <span className="text-brand-yellow text-sm">KSh</span></span>
                        </div>
                        <div className="w-10 h-10 bg-[#1e2532] rounded-full flex items-center justify-center border border-white/5">
                            <Activity className="w-5 h-5 text-brand-blue" />
                        </div>
                    </div>
                    <div className="h-40 flex items-end justify-between gap-3 mb-8 px-1">
                        {[40, 65, 45, 80, 55, 90, 70].map((h, i) => (
                            <div key={i} className={`w-full rounded-t-lg opacity-90 ${i === 5 ? 'bg-brand-yellow' : 'bg-brand-blue'}`} style={{ height: `${h}%`, opacity: i === 5 ? 1 : 0.6 }}></div>
                        ))}
                    </div>
                    <div className="grid grid-cols-2 gap-4 mb-6">
                        <div className="bg-[#1e2532] p-4 rounded-3xl border border-white/5">
                            <div className="text-xs text-slate-400 mb-2 font-medium">Patients</div>
                            <div className="h-20 flex items-end">
                                <div className="text-xl font-bold text-white">1,204</div>
                            </div>
                        </div>
                        <div className="bg-[#1e2532] p-4 rounded-3xl border border-white/5 relative overflow-hidden">
                             <div className="absolute top-0 right-0 w-16 h-16 bg-brand-blue blur-[40px] opacity-20"></div>
                            <div className="text-xs text-slate-400 mb-2 font-medium">Growth</div>
                            <div className="h-20 flex items-end">
                                <div className="text-xl font-bold text-white">24%</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        {/* RIGHT SIDE - Form */}
        <div className="lg:w-1/2 bg-white dark:bg-[#1A1F2B] flex flex-col p-8 lg:p-20 relative justify-center overflow-y-auto">
            
            <div className="max-w-md w-full mx-auto">
                {isPendingApproval ? (
                    <div className="flex flex-col items-center text-center animate-in fade-in slide-in-from-right-8 duration-500">
                        <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-6 shadow-lg shadow-green-200 dark:shadow-none">
                            <CheckCircle className="w-10 h-10 text-green-600 dark:text-green-400" />
                        </div>
                        <h2 className="text-3xl font-bold text-brand-dark dark:text-white mb-4">Check Your Email</h2>
                        <div className="p-6 bg-slate-50 dark:bg-[#121721] rounded-3xl border border-slate-100 dark:border-slate-800 mb-8 w-full">
                            <p className="text-slate-600 dark:text-slate-300 mb-4 leading-relaxed text-sm">
                                We've sent a confirmation link to <span className="font-bold text-brand-dark dark:text-white">{signUpForm.email}</span>.
                            </p>
                            <div className="flex items-start gap-3 text-left bg-blue-50 dark:bg-blue-900/20 p-4 rounded-2xl">
                                <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                                <p className="text-xs text-blue-700 dark:text-blue-300">
                                    Please verify your email to access your JuaAfya account.
                                </p>
                            </div>
                        </div>
                        <button 
                            onClick={() => { setIsPendingApproval(false); setIsSignUp(false); setSignUpForm({...signUpForm, password: '', confirmPassword: ''}); }}
                            className="w-full py-4 bg-brand-dark dark:bg-white hover:opacity-90 text-white dark:text-brand-dark font-bold rounded-full shadow-xl transition-all flex items-center justify-center gap-2"
                        >
                            Return to Sign In
                        </button>
                    </div>
                ) : (
                    <>
                        <div className="flex justify-between items-center mb-8">
                            <div className="flex items-center gap-3 hidden lg:flex">
                                <div className="w-10 h-10 flex items-center justify-center">
                                    <svg viewBox="0 0 24 24" fill="none" className="w-full h-full">
                                        <path d="M12 2V4M12 20V22M4.93 4.93L6.34 6.34M17.66 17.66L19.07 19.07M2 12H4M20 12H22M6.34 17.66L4.93 19.07M19.07 4.93L17.66 6.34" stroke="#EFE347" strokeWidth="2.5" strokeLinecap="round" />
                                        <circle cx="12" cy="12" r="6" fill="#3462EE" />
                                        <path d="M12 9V15M9 12H15" stroke="white" strokeWidth="2" strokeLinecap="round" />
                                    </svg>
                                </div>
                                <span className="text-2xl font-bold text-brand-dark dark:text-white tracking-tight">JuaAfya</span>
                            </div>
                            
                            <button 
                                onClick={() => { setIsSignUp(!isSignUp); setError(''); }}
                                className="flex items-center gap-2 text-sm font-medium group"
                            >
                                <User className="w-4 h-4 text-brand-dark dark:text-white group-hover:text-brand-blue transition-colors" />
                                <span className="text-brand-dark dark:text-white group-hover:text-brand-blue transition-colors">
                                    {isSignUp ? 'Sign In' : 'Sign Up'}
                                </span>
                            </button>
                        </div>

                        <div className="mb-8">
                            <h2 className="text-[3rem] font-medium text-brand-dark dark:text-white mb-2 tracking-tight leading-none">
                                {isSignUp ? 'Create Account' : 'Sign In'}
                            </h2>
                            {isSignUp && (
                                <p className="text-slate-500 dark:text-slate-400">Get started with a 14-day free trial.</p>
                            )}
                        </div>

                        {isSignUp ? (
                            <form onSubmit={handleSignUpSubmit} className="space-y-5 animate-in fade-in slide-in-from-right-8 duration-500">
                                <div className="space-y-2">
                                    <div className="relative group">
                                        <Building2 className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 group-focus-within:text-brand-blue transition-colors" />
                                        <input 
                                            type="text" 
                                            placeholder="Clinic Name"
                                            className="w-full pl-14 pr-6 py-5 rounded-3xl bg-white dark:bg-[#121721] border border-slate-200 dark:border-slate-700 focus:border-brand-blue focus:ring-4 focus:ring-brand-blue/10 outline-none transition-all text-brand-dark dark:text-white placeholder:text-slate-400 font-medium"
                                            value={signUpForm.clinicName}
                                            onChange={(e) => setSignUpForm({...signUpForm, clinicName: e.target.value})}
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <div className="relative group">
                                        <User className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 group-focus-within:text-brand-blue transition-colors" />
                                        <input 
                                            type="text" 
                                            placeholder="Full Name"
                                            className="w-full pl-14 pr-6 py-5 rounded-3xl bg-white dark:bg-[#121721] border border-slate-200 dark:border-slate-700 focus:border-brand-blue focus:ring-4 focus:ring-brand-blue/10 outline-none transition-all text-brand-dark dark:text-white placeholder:text-slate-400 font-medium"
                                            value={signUpForm.fullName}
                                            onChange={(e) => setSignUpForm({...signUpForm, fullName: e.target.value})}
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <div className="relative group">
                                        <Mail className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 group-focus-within:text-brand-blue transition-colors" />
                                        <input 
                                            type="email" 
                                            placeholder="Email Address"
                                            className="w-full pl-14 pr-6 py-5 rounded-3xl bg-white dark:bg-[#121721] border border-slate-200 dark:border-slate-700 focus:border-brand-blue focus:ring-4 focus:ring-brand-blue/10 outline-none transition-all text-brand-dark dark:text-white placeholder:text-slate-400 font-medium"
                                            value={signUpForm.email}
                                            onChange={(e) => setSignUpForm({...signUpForm, email: e.target.value})}
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <div className="relative group">
                                        <Lock className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 group-focus-within:text-brand-blue transition-colors" />
                                        <input 
                                            type={showPassword ? "text" : "password"}
                                            placeholder="Password"
                                            className="w-full pl-14 pr-14 py-5 rounded-3xl bg-white dark:bg-[#121721] border border-slate-200 dark:border-slate-700 focus:border-brand-blue focus:ring-4 focus:ring-brand-blue/10 outline-none transition-all text-brand-dark dark:text-white placeholder:text-slate-400 font-medium"
                                            value={signUpForm.password}
                                            onChange={(e) => setSignUpForm({...signUpForm, password: e.target.value})}
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <div className="relative group">
                                        <Lock className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 group-focus-within:text-brand-blue transition-colors" />
                                        <input 
                                            type={showPassword ? "text" : "password"}
                                            placeholder="Confirm Password"
                                            className="w-full pl-14 pr-6 py-5 rounded-3xl bg-white dark:bg-[#121721] border border-slate-200 dark:border-slate-700 focus:border-brand-blue focus:ring-4 focus:ring-brand-blue/10 outline-none transition-all text-brand-dark dark:text-white placeholder:text-slate-400 font-medium"
                                            value={signUpForm.confirmPassword}
                                            onChange={(e) => setSignUpForm({...signUpForm, confirmPassword: e.target.value})}
                                            required
                                        />
                                    </div>
                                </div>

                                {error && (
                                    <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm rounded-2xl font-medium text-center border border-red-100 dark:border-red-900 flex items-center justify-center gap-2">
                                        <AlertCircle className="w-4 h-4"/> {error}
                                    </div>
                                )}

                                <button 
                                    type="submit" 
                                    disabled={isLoading}
                                    className="w-full py-5 bg-brand-blue hover:bg-blue-700 text-white font-bold rounded-full shadow-xl shadow-brand-blue/20 transform hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 text-lg disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none mt-2"
                                >
                                    {isLoading ? (
                                        <Activity className="w-6 h-6 animate-spin" />
                                    ) : (
                                        <>
                                            Create Account <ArrowRight className="w-5 h-5" />
                                        </>
                                    )}
                                </button>
                            </form>
                        ) : (
                            <form onSubmit={handleLoginSubmit} className="space-y-6 animate-in fade-in slide-in-from-left-8 duration-500">
                                <div className="space-y-2">
                                    <div className="relative group">
                                        <input 
                                            type="email" 
                                            placeholder="Email or Username"
                                            className="w-full px-6 py-5 rounded-3xl bg-white dark:bg-[#121721] border border-slate-200 dark:border-slate-700 focus:border-brand-blue focus:ring-4 focus:ring-brand-blue/10 outline-none transition-all text-brand-dark dark:text-white placeholder:text-slate-400 font-medium"
                                            value={loginForm.email}
                                            onChange={(e) => setLoginForm({...loginForm, email: e.target.value})}
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <div className="relative group">
                                        <input 
                                            type={showPassword ? "text" : "password"}
                                            placeholder="Password"
                                            className="w-full px-6 py-5 rounded-3xl bg-white dark:bg-[#121721] border border-slate-200 dark:border-slate-700 focus:border-brand-blue focus:ring-4 focus:ring-brand-blue/10 outline-none transition-all text-brand-dark dark:text-white placeholder:text-slate-400 font-medium"
                                            value={loginForm.password}
                                            onChange={(e) => setLoginForm({...loginForm, password: e.target.value})}
                                            required
                                        />
                                        <button 
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-400 hover:text-brand-blue transition-colors"
                                        >
                                            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                        </button>
                                    </div>
                                </div>

                                <div className="flex justify-start">
                                    <button type="button" className="text-sm font-semibold text-brand-blue hover:text-brand-dark dark:hover:text-white transition-colors">
                                        Forgot password?
                                    </button>
                                </div>

                                {error && (
                                    <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm rounded-2xl font-medium text-center border border-red-100 dark:border-red-900 flex items-center justify-center gap-2 animate-in fade-in">
                                        <AlertCircle className="w-4 h-4"/> {error}
                                    </div>
                                )}

                                <button 
                                    type="submit" 
                                    disabled={isLoading}
                                    className="w-full py-5 bg-brand-blue hover:bg-blue-700 text-white font-bold rounded-full shadow-xl shadow-brand-blue/20 transform hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 text-lg disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none"
                                >
                                    {isLoading ? (
                                        <Activity className="w-6 h-6 animate-spin" />
                                    ) : (
                                        <>
                                            <ChevronRight className="w-5 h-5" /> Sign In
                                        </>
                                    )}
                                </button>
                            </form>
                        )}

                        <div className="mt-16 pt-6 border-t border-slate-100 dark:border-slate-700 flex justify-between items-center text-xs font-medium text-slate-400">
                            <div>© 2023-2025 JuaAfya Inc.</div>
                            <div className="flex gap-6">
                                <button className="hover:text-brand-dark dark:hover:text-white transition-colors">Contact Us</button>
                                <button className="flex items-center gap-1 hover:text-brand-dark dark:hover:text-white transition-colors">
                                    English <ChevronRight className="w-3 h-3 rotate-90" />
                                </button>
                            </div>
                        </div>

                    </>
                )}
            </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
