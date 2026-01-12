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
import { SYSTEM_ADMIN } from "../lib/config"
import { canAccessView } from "../lib/rbac"
import type { TeamMember, ViewState, Role } from "../types/index"
import { NEW_ROLE_MAP } from "../types/enterprise"
import logger from '../lib/logger'

const AppLayout: React.FC = () => {
    const navigate = useNavigate()
    const location = useLocation()
    const { user, teamMember, isLoading: authLoading, signOut: enterpriseSignOut, error: authError } = useEnterpriseAuth()
    const {
        inventory,
        settings,
        currentUser,
        toasts,
        actions,
    } = useStore()

    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
    const mobileMenuRef = useRef<HTMLDivElement>(null)

    // Track if we've ever successfully loaded a user - prevents spurious sign-out during init
    const hasLoadedUserRef = useRef(false)
    const lastSyncedUserId = useRef<string | null>(null)

    // Sync enterprise auth user to store and handle redirection
    useEffect(() => {
        if (authLoading) return

        if (user) {
            hasLoadedUserRef.current = true
            // Sync to store if user changed or hasn't been synced yet
            if (lastSyncedUserId.current !== user.id || !currentUser) {
                if (teamMember) {
                    logger.debug("[AppLayout] Syncing user to store:", teamMember.id)
                    lastSyncedUserId.current = user.id
                    actions.login(teamMember)
                }
            }
        } else {
            // No user found
            if (currentUser && hasLoadedUserRef.current) {
                logger.log("[AppLayout] Session not found/expired - Clearing local store user")
                actions.clearAuth()
            }

            // Redirect to login if not on it
            if (location.pathname !== "/login") {
                logger.log("[AppLayout] No authenticated user, redirecting to login")
                navigate("/login", { replace: true })
            }
        }
    }, [user, authLoading, currentUser, teamMember, actions, location.pathname, navigate])

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
        const effectiveUser = currentUser || teamMember;
        if (effectiveUser && canAccessView(effectiveUser.role, view)) {
            navigate(`/${view}`)
        } else {
            actions.showToast("You don't have permission to access this page.", "error")
        }
    }

    const lowStockCount = inventory.filter((i) => i.stock <= i.minStockLevel).length

    if (authLoading || authError) {
        if (authError) {
            return (
                <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 p-4">
                    <div className="flex flex-col items-center max-w-md">
                        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 w-full">
                            <h2 className="text-lg font-bold text-red-700 dark:text-red-400 mb-3">Authentication Configuration Error</h2>
                            <p className="text-sm text-red-600 dark:text-red-300 mb-4">{authError}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                Please configure your Supabase credentials in environment variables and restart the server.
                            </p>
                            <a
                                href="https://www.builder.io/c/docs/projects"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="mt-4 inline-block text-sm text-indigo-600 dark:text-indigo-400 hover:underline"
                            >
                                View Setup Documentation →
                            </a>
                        </div>
                    </div>
                </div>
            )
        }

        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 p-4">
                <div className="flex flex-col items-center max-w-md">
                    {!user ? (
                        <>
                            <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4"></div>
                            <p className="text-slate-600 dark:text-slate-400 font-bold animate-pulse text-center">Establishing Secure Session...</p>
                        </>
                    ) : null}
                </div>
            </div>
        )
    }

    if (!user && location.pathname !== "/login") {
        return null // Will redirect via useEffect
    }

    const effectiveUser = currentUser || teamMember;
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
                    <div className="md:hidden bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 p-3 sm:p-4 sticky top-0 z-50 flex items-center justify-between no-print">
                        <div className="flex items-center gap-2 sm:gap-3">
                            <button
                                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                                className="p-2 -ml-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors active:scale-95"
                                aria-label="Toggle navigation menu"
                            >
                                <Menu className="w-6 h-6 text-slate-600 dark:text-slate-400" />
                            </button>
                            <div className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center">
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
                            <h1 className="font-bold text-lg sm:text-xl text-slate-800 dark:text-white tracking-tight">JuaAfya</h1>
                        </div>
                        {effectiveUser && (
                            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center text-white font-bold text-xs sm:text-sm shadow-md">
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
