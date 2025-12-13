"use client"

import type React from "react"
import { useEffect } from "react"
import Sidebar from "./components/Sidebar"
import Dashboard from "./components/Dashboard"
import PatientList from "./components/PatientList"
import Appointments from "./components/Appointments"
import Pharmacy from "./components/Pharmacy"
import Reports from "./components/Reports"
import Settings from "./components/Settings"
import Profile from "./components/Profile"
import ChatBot from "./components/ChatBot"
import BulkSMS from "./components/BulkSMS"
import PatientQueue from "./components/PatientQueue"
import SuperAdminDashboard from "./components/SuperAdminDashboard"
import WhatsAppAgent from "./components/WhatsAppAgent"
import Login from "./components/Login"
import ErrorBoundary from "./components/ErrorBoundary"
import type { TeamMember } from "./types"
import { CheckCircle, AlertCircle, X, WifiOff } from "lucide-react"
import { supabase } from "./lib/supabaseClient"
import useStore from "./store"
import { SYSTEM_ADMIN } from "./config"
import { canAccessView } from "./lib/rbac"

const App: React.FC = () => {
  const {
    currentView,
    isAppLoading,
    isDemoMode,
    darkMode,
    patients,
    appointments,
    inventory,
    suppliers,
    inventoryLogs,
    visits,
    settings,
    currentUser,
    toasts,
    actions,
  } = useStore()

  useEffect(() => {
    const initApp = async () => {
      actions.setIsAppLoading(true)

      try {
        const {
          data: { session },
        } = await supabase.auth.getSession()
        if (session) {
          const user: TeamMember = {
            id: session.user.id,
            name: session.user.user_metadata.full_name || session.user.email?.split("@")[0] || "User",
            email: session.user.email || "",
            role: (session.user.user_metadata.role as any) || "Admin",
            status: "Active",
            lastActive: "Now",
          }
          actions.login(user)
        }
      } catch (error) {
        console.warn("Supabase auth error (expected in demo mode):", error)
      } finally {
        actions.setIsAppLoading(false)
      }
    }

    initApp()

    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_IN" && session) {
        const user: TeamMember = {
          id: session.user.id,
          name: session.user.user_metadata.full_name || session.user.email?.split("@")[0] || "User",
          email: session.user.email || "",
          role: (session.user.user_metadata.role as any) || "Admin",
          status: "Active",
          lastActive: "Now",
        }
        actions.login(user)
      } else if (event === "SIGNED_OUT") {
        actions.logout()
      }
    })

    return () => {
      authListener.subscription.unsubscribe()
    }
  }, [actions])

  const lowStockCount = inventory.filter((i) => i.stock <= i.minStockLevel).length

  const handleViewChange = (view: string) => {
    if (currentUser && canAccessView(currentUser.role, view)) {
      actions.setCurrentView(view)
    } else {
      actions.showToast("You don't have permission to access this page.", "error")
    }
  }

  const renderContent = () => {
    if (!currentUser) return null

    const queueProps = {
      visits,
      patients,
      inventory,
      addVisit: actions.addVisit,
      updateVisit: actions.updateVisit,
      onCompleteVisit: actions.completeVisit,
    }

    switch (currentView) {
      case "dashboard":
        return <Dashboard />
      case "reception":
        return <PatientQueue {...queueProps} restrictedStages={["Check-In", "Clearance"]} />
      case "triage":
        return <PatientQueue {...queueProps} restrictedStages={["Vitals"]} />
      case "consultation":
        return <PatientQueue {...queueProps} restrictedStages={["Consultation"]} />
      case "lab-work":
        return <PatientQueue {...queueProps} restrictedStages={["Lab"]} />
      case "billing-desk":
        return <PatientQueue {...queueProps} restrictedStages={["Billing"]} />
      case "sa-overview":
      case "sa-clinics":
      case "sa-approvals":
      case "sa-payments":
      case "sa-settings":
      case "sa-support":
        const tab = currentView.replace("sa-", "") as any
        return (
          <SuperAdminDashboard
            currentUser={currentUser}
            switchUser={actions.switchUser}
            team={settings.team}
            activeTab={tab}
          />
        )
      case "patients":
        return (
          <PatientList
            patients={patients}
            addPatient={actions.addPatient}
            updatePatient={actions.updatePatient}
            deletePatient={actions.deletePatient}
            settings={settings}
          />
        )
      case "appointments":
        return (
          <Appointments
            appointments={appointments}
            patients={patients}
            addAppointment={actions.addAppointment}
            updateAppointment={actions.updateAppointment}
            showToast={actions.showToast}
          />
        )
      case "pharmacy":
        return (
          <Pharmacy
            inventory={inventory}
            suppliers={suppliers}
            logs={inventoryLogs}
            visits={visits}
            onDispense={actions.dispensePrescription}
            addInventoryItem={actions.addInventoryItem}
            updateInventoryItem={actions.updateInventoryItem}
            deleteInventoryItem={actions.deleteInventoryItem}
            addSupplier={actions.addSupplier}
            updateSupplier={actions.updateSupplier}
            deleteSupplier={actions.deleteSupplier}
          />
        )
      case "bulk-sms":
        return <BulkSMS patients={patients} showToast={actions.showToast} settings={settings} />
      case "whatsapp-agent":
        return (
          <WhatsAppAgent
            team={settings.team}
            appointments={appointments}
            inventory={inventory}
            patients={patients}
            settings={settings}
            addPatient={actions.addPatient}
            updatePatient={actions.updatePatient}
            deletePatient={actions.deletePatient}
            addAppointment={actions.addAppointment}
            updateAppointment={actions.updateAppointment}
            updateInventoryItem={actions.updateInventoryItem}
            deleteInventoryItem={actions.deleteInventoryItem}
          />
        )
      case "reports":
        return <Reports />
      case "settings":
        return (
          <Settings
            isDarkMode={darkMode}
            toggleTheme={actions.toggleTheme}
            settings={settings}
            updateSettings={actions.updateSettings}
          />
        )
      case "profile":
        return <Profile />
      default:
        return <PatientQueue {...queueProps} />
    }
  }

  if (isAppLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-cream/50 dark:bg-brand-dark">
        <div className="flex flex-col items-center">
          <div className="w-16 h-16 border-4 border-brand-blue border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-brand-dark dark:text-white font-bold animate-pulse">Initializing JuaAfya Cloud...</p>
        </div>
      </div>
    )
  }

  if (!currentUser) {
    return (
      <>
        <Login onLogin={actions.login} team={settings.team} systemAdmin={SYSTEM_ADMIN} />
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-2 no-print">
          {toasts.map((toast) => (
            <div
              key={toast.id}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border animate-in slide-in-from-bottom-5 fade-in duration-300 ${
                toast.type === "success"
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
      </>
    )
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex transition-colors duration-200 font-sans">
        <Sidebar
          currentView={currentView}
          setView={handleViewChange}
          lowStockCount={lowStockCount}
          currentUser={currentUser}
          switchUser={actions.switchUser}
          team={settings.team}
          systemAdmin={SYSTEM_ADMIN}
          onLogout={actions.logout}
        />

        <main className="flex-1 md:ml-64 lg:ml-72 w-full transition-all duration-300">
          {isDemoMode && (
            <div className="bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200 px-4 py-2 text-xs font-bold flex items-center justify-center gap-2 border-b border-amber-200 dark:border-amber-800 animate-in slide-in-from-top">
              <WifiOff className="w-4 h-4" />
              <span>Demo Mode Active: You are viewing local sample data. Database connection is unavailable.</span>
            </div>
          )}
          <div className="md:hidden bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 p-4 sticky top-0 z-10 flex items-center justify-between no-print">
            <div className="flex items-center gap-2">
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
            <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center text-brand-600 font-bold text-xs">
              {currentUser.name.substring(0, 2)}
            </div>
          </div>

          {renderContent()}
        </main>

        <div className="no-print">
          <ChatBot />
        </div>

        <div className="fixed bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-2 no-print">
          {toasts.map((toast) => (
            <div
              key={toast.id}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border animate-in slide-in-from-bottom-5 fade-in duration-300 ${
                toast.type === "success"
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

export default App
