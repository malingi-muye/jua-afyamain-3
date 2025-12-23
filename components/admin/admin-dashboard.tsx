"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import ClinicsList from "./clinics-list"
import CreateClinicDialog from "./create-clinic-dialog"

interface AdminDashboardProps {
  initialClinics: any[]
}

export default function AdminDashboard({ initialClinics }: AdminDashboardProps) {
  const [clinics, setClinics] = useState(initialClinics)
  const [isLoading, setIsLoading] = useState(false)

  const handleClinicCreated = (newClinic: any) => {
    setClinics((prev) => [newClinic, ...prev])
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">SuperAdmin Management</h1>
              <p className="text-muted-foreground mt-2">Manage all clinics and system settings</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <Tabs defaultValue="clinics" className="w-full">
          <TabsList>
            <TabsTrigger value="clinics">Clinics</TabsTrigger>
            <TabsTrigger value="statistics">Statistics</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          {/* Clinics Tab */}
          <TabsContent value="clinics" className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">Manage Clinics</h2>
                <p className="text-muted-foreground">Create and manage all clinic tenants</p>
              </div>
              <CreateClinicDialog onClinicCreated={handleClinicCreated} />
            </div>

            <ClinicsList clinics={clinics} />
          </TabsContent>

          {/* Statistics Tab */}
          <TabsContent value="statistics" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Total Clinics</CardTitle>
                  <CardDescription>Active clinic tenants</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">{clinics.length}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Active Clinics</CardTitle>
                  <CardDescription>Currently operational</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">{clinics.filter((clinic) => clinic.status === "active").length}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Pro Plans</CardTitle>
                  <CardDescription>Paid subscriptions</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">
                    {clinics.filter((clinic) => clinic.plan === "pro" || clinic.plan === "enterprise").length}
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>System Settings</CardTitle>
                <CardDescription>Configure platform-wide settings</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Platform Name</label>
                    <input
                      type="text"
                      placeholder="JuaAfya"
                      className="w-full mt-2 px-3 py-2 border rounded"
                      disabled
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Support Email</label>
                    <input
                      type="email"
                      placeholder="support@juaafya.com"
                      className="w-full mt-2 px-3 py-2 border rounded"
                      disabled
                    />
                  </div>
                  <Button disabled>Save Settings</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
