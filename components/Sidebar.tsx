"use client"

import React, { useState, forwardRef, useCallback, memo } from "react"
import type { ViewState, TeamMember } from "../types"
import {
  LayoutDashboard,
  Users,
  Calendar,
  Pill,
  Settings,
  Activity,
  MessageSquare,
  ClipboardList,
  Stethoscope,
  TestTube,
  CreditCard,
  Building2,
  CheckCircle,
  DollarSign,
  Menu,
  X,
  Smartphone,
  LogOut,
  LifeBuoy,
} from "lucide-react"

interface SidebarProps {
  currentView: ViewState
  setView: (view: ViewState) => void
  lowStockCount?: number
  currentUser: TeamMember
  switchUser: (member: TeamMember) => void
  team: TeamMember[]
  systemAdmin: TeamMember
  onLogout?: () => void
  mobileMenuOpen?: boolean
  setMobileMenuOpen?: (open: boolean) => void
}

const Sidebar = forwardRef<HTMLDivElement, SidebarProps>(({
  currentView,
  setView,
  lowStockCount = 0,
  currentUser,
  switchUser,
  team,
  systemAdmin,
  onLogout,
  mobileMenuOpen: externalMobileMenuOpen,
  setMobileMenuOpen: externalSetMobileMenuOpen,
}, ref) => {
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [internalMobileMenuOpen, setInternalMobileMenuOpen] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  // Use external state if provided, otherwise use internal state
  const mobileMenuOpen = externalMobileMenuOpen !== undefined ? externalMobileMenuOpen : internalMobileMenuOpen
  const setMobileMenuOpen = externalSetMobileMenuOpen || setInternalMobileMenuOpen

  // Define all possible navigation items
  const allNavItems = [
    // Super Admin Views
    { id: "sa-overview", label: "Overview", icon: LayoutDashboard, roles: ["SuperAdmin"] },
    { id: "sa-clinics", label: "Clinics", icon: Building2, roles: ["SuperAdmin"] },
    { id: "sa-approvals", label: "Approvals", icon: CheckCircle, roles: ["SuperAdmin"] },
    { id: "sa-payments", label: "Financials", icon: DollarSign, roles: ["SuperAdmin"] },
    { id: "sa-support", label: "Helpdesk", icon: LifeBuoy, roles: ["SuperAdmin"] },
    { id: "sa-settings", label: "Global Settings", icon: Settings, roles: ["SuperAdmin"] },

    // Clinic Views (Not for SuperAdmin)
    {
      id: "dashboard",
      label: "Dashboard",
      icon: LayoutDashboard,
      roles: ["Admin", "Doctor", "Nurse", "Receptionist", "Pharmacist", "Lab Tech"],
    },

    // Departmental Views
    { id: "reception", label: "Reception Desk", icon: ClipboardList, roles: ["Admin", "Receptionist"] },
    { id: "triage", label: "Triage / Vitals", icon: Activity, roles: ["Admin", "Nurse", "Doctor"] },
    { id: "consultation", label: "Consultations", icon: Stethoscope, roles: ["Admin", "Doctor"] },
    { id: "lab-work", label: "Laboratory", icon: TestTube, roles: ["Admin", "Lab Tech", "Doctor"] },
    { id: "billing-desk", label: "Billing", icon: CreditCard, roles: ["Admin", "Receptionist", "Accountant"] },
    { id: "pharmacy", label: "Pharmacy", icon: Pill, roles: ["Admin", "Pharmacist", "Doctor"] },

    // General Management
    { id: "patients", label: "Patients", icon: Users, roles: ["Admin", "Doctor", "Nurse", "Receptionist"] },
    { id: "appointments", label: "Appointments", icon: Calendar, roles: ["Admin", "Doctor", "Nurse", "Receptionist"] },
    {
      id: "whatsapp-agent",
      label: "WhatsApp Agent",
      icon: Smartphone,
      roles: ["Admin", "Doctor", "Nurse", "Receptionist", "Pharmacist"],
    },
    { id: "bulk-sms", label: "Broadcast", icon: MessageSquare, roles: ["Admin", "Receptionist"] },
    { id: "reports", label: "Reports", icon: Activity, roles: ["Admin", "Doctor", "Accountant"] },
    { id: "helpdesk", label: "Helpdesk", icon: LifeBuoy, roles: ["Admin"] },
    { id: "settings", label: "Clinic Settings", icon: Settings, roles: ["Admin"] },
  ]

  // Filter items based on current user role
  const navItems = allNavItems.filter((item) => item.roles.includes(currentUser.role))

  const handleMobileNav = useCallback((view: ViewState) => {
    setView(view)
    setMobileMenuOpen(false)
  }, [setView, setMobileMenuOpen])

  const handleLogout = useCallback(async () => {
    if (isLoggingOut) return
    setIsLoggingOut(true)
    setShowUserMenu(false)
    setMobileMenuOpen(false)

    try {
      if (onLogout) {
        await onLogout()
      }
    } catch (error) {
      console.error("Logout error:", error)
    } finally {
      setIsLoggingOut(false)
    }
  }, [isLoggingOut, onLogout, setMobileMenuOpen])

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden md:flex flex-col w-64 bg-sidebar text-white fixed left-4 top-4 bottom-4 rounded-3xl z-20 shadow-2xl no-print transition-all duration-300">
        {/* Logo Area */}
        <div className="p-8 flex items-center space-x-3 mb-2">
          <div className="relative w-10 h-10 flex items-center justify-center">
            {/* JuaAfya Logo SVG */}
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
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white leading-none">
              {currentUser.role === "SuperAdmin" ? "JuaAfya OS" : "JuaAfya"}
            </h1>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 space-y-2 overflow-y-auto scrollbar-hide">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setView(item.id as ViewState)}
              className={`group flex items-center justify-start w-full px-6 py-4 rounded-xl transition-all duration-200 ${currentView === item.id
                ? "bg-sidebar-hover text-white font-semibold shadow-inner"
                : "text-slate-400 hover:text-white hover:bg-white/5"
                }`}
            >
              <item.icon
                className={`w-5 h-5 mr-4 transition-colors ${currentView === item.id ? (currentUser.role === "SuperAdmin" ? "text-indigo-400" : "text-green-400") : "text-slate-400 group-hover:text-white"}`}
              />
              <span className="text-base">{item.label}</span>

              {/* Active Indicator */}
              {currentView === item.id && (
                <div
                  className={`ml-auto w-1.5 h-1.5 rounded-full ${currentUser.role === "SuperAdmin" ? "bg-indigo-400" : "bg-green-400"}`}
                ></div>
              )}

              {/* Low Stock Badge for Pharmacy */}
              {item.id === "pharmacy" && lowStockCount > 0 && currentView !== "pharmacy" && (
                <span className="ml-auto bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm animate-pulse">
                  {lowStockCount}
                </span>
              )}
            </button>
          ))}
        </nav>

        {/* User Profile & Logout */}
        <div className="p-4 mt-auto">
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center w-full p-3 rounded-xl bg-black/20 hover:bg-black/30 transition-colors border border-white/5"
            >
              <img
                src={currentUser.avatar || "/placeholder.svg"}
                alt="Avatar"
                className="w-10 h-10 rounded-full border-2 border-green-500/50"
              />
              <div className="ml-3 text-left overflow-hidden">
                <p className="text-sm font-bold text-white truncate">{currentUser.name}</p>
                <p className="text-xs text-green-400 font-medium truncate">
                  {currentUser.role === "SuperAdmin" ? "System Owner" : currentUser.role}
                </p>
              </div>
              <Settings className="w-4 h-4 text-slate-400 ml-auto" />
            </button>

            {showUserMenu && (
              <div className="absolute bottom-full left-0 w-full mb-2 bg-white text-slate-800 rounded-xl shadow-xl overflow-hidden animate-in slide-in-from-bottom-2 z-50">
                <div className="p-2">
                  <button
                    onClick={handleLogout}
                    disabled={isLoggingOut}
                    className="w-full flex items-center p-3 hover:bg-red-50 text-red-600 transition-colors rounded-lg disabled:opacity-50"
                  >
                    <LogOut className="w-4 h-4 mr-3" />
                    <span className="text-sm font-bold">{isLoggingOut ? "Logging out..." : "Log Out"}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Drawer (Full Menu) */}
      {mobileMenuOpen && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-40 bg-black/50 md:hidden animate-in fade-in duration-300" />

          {/* Menu */}
          <div ref={ref} className="fixed inset-0 z-50 md:hidden flex flex-col bg-sidebar text-white animate-in slide-in-from-bottom-full duration-300">
            <div className="p-6 flex items-center justify-between border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 flex items-center justify-center">
                  {/* Logo SVG */}
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
                <span className="text-xl font-bold">JuaAfya</span>
              </div>
              <button onClick={() => setMobileMenuOpen(false)} className="p-2 bg-white/10 rounded-full">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleMobileNav(item.id as ViewState)}
                  className={`flex items-center w-full px-6 py-4 rounded-xl transition-all ${currentView === item.id ? "bg-sidebar-hover text-white font-bold" : "text-slate-400 hover:text-white"
                    }`}
                >
                  <item.icon className="w-5 h-5 mr-4" />
                  {item.label}
                </button>
              ))}

              <div className="h-px bg-white/10 my-4"></div>

              <button
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="flex items-center w-full px-6 py-4 rounded-xl text-red-400 hover:text-white hover:bg-white/10 transition-all disabled:opacity-50"
              >
                <LogOut className="w-5 h-5 mr-4" />
                {isLoggingOut ? "Logging out..." : "Log Out"}
              </button>
            </div>
          </div>
        </>
      )}

      {/* Mobile Toggle Button - REMOVED: Now using header hamburger menu */}
      {/* <button
        onClick={() => setMobileMenuOpen(true)}
        className="fixed bottom-6 right-6 md:hidden z-40 p-3 md:p-4 bg-sidebar text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 transition-transform"
      >
        <Menu className="w-6 h-6" />
      </button> */}
    </>
  )
})

Sidebar.displayName = 'Sidebar'

// Memoize to prevent re-renders when parent state changes
export default memo(Sidebar)
