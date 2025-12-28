"use client"

import type React from "react"
import { useEffect, useState, useRef, useMemo } from "react"
import { Outlet, useNavigate, useLocation } from "react-router-dom"
import Sidebar from "./Sidebar"
import ChatBot from "./ChatBot"
import ErrorBoundary from "./ErrorBoundary"
import { CheckCircle, AlertCircle, X, WifiOff, Menu } from "lucide-react"
import { useEnterpriseAuth } from "../hooks/useEnterpriseAuth"
import useStore from "../store"
import { SYSTEM_ADMIN } from "../config"
import { canAccessView } from "../lib/rbac"
import type { TeamMember, ViewState, Role } from "../types"
import { NEW_ROLE_MAP } from "../types/enterprise"

const AppLayout: React.FC = () => {
    const navigate = useNavigate()
    const location = useLocation()
    const { user, isLoading: authLoading, signOut: enterpriseSignOut } = useEnterpriseAuth()
    const {
        isDemoMode,
        inventory,
        settings,
        currentUser,
        toasts,
        actions,
    } = useStore()

    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
    const mobileMenuRef = useRef<HTMLDivElement>(null)

    // Memoize the team member derived from enterprise auth
    const authTeamMember = useMemo<TeamMember | undefined>(() => {
        if (!user) return undefined;
        return {
            id: user.id,
            name: user.fullName,
            email: user.email,
            role: (NEW_ROLE_MAP[user.role] as Role) || "Doctor",
            status: user.status === "active" ? "Active" :
                user.status === "invited" ? "Invited" : "Deactivated",
            lastActive: user.lastActiveAt || "Now",
            avatar: user.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.email || "User")}`,
            clinicId: user.clinicId || undefined,
        };
    }, [user]);

    // Sync enterprise auth user to store for backward compatibility
    useEffect(() => {
        if (user && !authLoading && (!currentUser || currentUser.id !== user.id)) {
            if (authTeamMember) {
                console.log("[AppLayout] Syncing user to store:", authTeamMember)
                actions.login(authTeamMember)
            }
        } else if (!user && !authLoading && currentUser) {
            console.log("[AppLayout] Session not found/expired - Clearing local store user")
            actions.clearAuth()
        }
    }, [user, authLoading, actions, currentUser, authTeamMember])

    // Redirect to login if not authenticated
    useEffect(() => {
        if (!authLoading && !user && location.pathname !== "/login") {
            navigate("/login")
        }
    }, [user, authLoading, navigate, location.pathname])

    // Close mobile menu when route changes
    useEffect(() => {
        setMobileMenuOpen(false)
    }, [location.pathname])

    // Close mobile menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target as Node)) {
                setMobileMenuOpen(false)
            }
        }

        if (mobileMenuOpen) {
            document.addEventListener('mousedown', handleClickOutside)
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside)
        }
    }, [mobileMenuOpen])

    // Handle logout
    const handleLogout = async () => {
        await enterpriseSignOut()
        actions.logout()
        navigate("/login", { replace: true })
    }

    // Check view access based on current route
    const currentView = location.pathname.replace("/", "") || "dashboard"

    const handleViewChange = (view: string) => {
        const effectiveUser = currentUser || authTeamMember;
        if (effectiveUser && canAccessView(effectiveUser.role, view)) {
            navigate(`/${view}`)
        } else {
            actions.showToast("You don't have permission to access this page.", "error")
        }
    }

    const lowStockCount = inventory.filter((i) => i.stock <= i.minStockLevel).length

    if (authLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
                <div className="flex flex-col items-center">
                    <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4"></div>
                    <p className="text-slate-600 dark:text-slate-400 font-bold animate-pulse">Establishing Secure Session...</p>
                </div>
            </div>
        )
    }

    if (!user && location.pathname !== "/login") {
        return null // Will redirect via useEffect
    }

    const effectiveUser = currentUser || authTeamMember;
    if (!effectiveUser) return null;

    return (
        <ErrorBoundary>
            <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex transition-colors duration-200 font-sans">
                <Sidebar
                    ref={mobileMenuRef}
                    currentView={currentView as ViewState}
                    setView={handleViewChange}
                    lowStockCount={lowStockCount}
                    currentUser={effectiveUser}
                    switchUser={actions.switchUser}
                    team={settings.team}
                    systemAdmin={SYSTEM_ADMIN}
                    onLogout={handleLogout}
                    mobileMenuOpen={mobileMenuOpen}
                    setMobileMenuOpen={setMobileMenuOpen}
                />

                <main className="flex-1 md:ml-72 lg:ml-80 w-full transition-all duration-300 min-h-screen flex flex-col">
                    {isDemoMode && (
                        <div className="bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200 px-4 py-2 text-xs font-bold flex items-center justify-center gap-2 border-b border-amber-200 dark:border-amber-800 animate-in slide-in-from-top">
                            <WifiOff className="w-4 h-4" />
                            <span>Demo Mode Active: You are viewing local sample data. Database connection is unavailable.</span>
                        </div>
                    )}
                    <div className="md:hidden bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 p-4 sticky top-0 z-50 flex items-center justify-between no-print">
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors active:scale-95"
                                aria-label="Toggle navigation menu"
                            >
                                <Menu className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                            </button>
                            <div className="w-8 h-8 flex items-center justify-center">
                                <svg viewBox="0 0 24 24" fill="none" className="w-full h-full">
                                    <path
                                        d="M12 2V4M12 20V22M4.93 4.93L6.34 6.34M17.66 17.66L19.07 19.07M2 12H4M20 12H22M6.34 17.66L4.93 19.07M19.07 4.93L17.66 6.34"
                                        stroke="#EFE347"
                                        strokeWidth="2.5"
                                        strokeLinecap="round"
                                    />
                                    <circle cx="12" cy="12" r="6" fill="#3462EE" />
                                    <path d="M12 9V15M9 12H15" stroke="white" strokeWidth="2" strokeLinecap="round" />
                                </svg>
                            </div>
                            <h1 className="font-bold text-lg text-slate-800 dark:text-white">JuaAfya</h1>
                        </div>
                        {effectiveUser && (
                            <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-xs">
                                {effectiveUser.name.substring(0, 2).toUpperCase()}
                            </div>
                        )}
                    </div>

                    <Outlet />
                </main>

                <div className="no-print">
                    <ChatBot />
                </div>

                {/* Toast notifications */}
                <div className="fixed bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-2 no-print">
                    {toasts.map((toast) => (
                        <div
                            key={toast.id}
                            className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border animate-in slide-in-from-bottom-5 fade-in duration-300 ${toast.type === "success"
                                ? "bg-white dark:bg-slate-800 border-green-200 dark:border-green-900 text-green-700 dark:text-green-400"
                                : toast.type === "error"
                                    ? "bg-white dark:bg-slate-800 border-red-200 dark:border-red-900 text-red-700 dark:text-red-400"
                                    : "bg-white dark:bg-slate-800 border-blue-200 dark:border-blue-900 text-blue-700 dark:text-blue-400"
                                }`}
                        >
                            {toast.type === "success" ? (
                                <CheckCircle className="w-5 h-5" />
                            ) : toast.type === "error" ? (
                                <X className="w-5 h-5" />
                            ) : (
                                <AlertCircle className="w-5 h-5" />
                            )}
                            <span className="text-sm font-medium">{toast.message}</span>
                        </div>
                    ))}
                </div>
            </div>
        </ErrorBoundary>
    )
}

export default AppLayout
