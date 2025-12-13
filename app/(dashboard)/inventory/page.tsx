"use client"

import { useState, useEffect } from "react"
import { getSupabaseClient } from "@/lib/supabase/singleton"
import { useClinic } from "@/components/ClinicProvider"
import { InventoryList } from "@/components/inventory/inventory-list"
import { InventoryDialog } from "@/components/inventory/inventory-dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Spinner } from "@/components/ui/spinner"
import { Plus, Search, AlertTriangle } from "lucide-react"
import type { InventoryItem } from "@/types/database"

export default function InventoryPage() {
  const { clinic } = useClinic()
  const [items, setItems] = useState<InventoryItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null)
  const [filterCategory, setFilterCategory] = useState("all")

  const fetchItems = async () => {
    if (!clinic) return
    try {
      const supabase = getSupabaseClient()
      let query = supabase.from("inventory").select("*").eq("clinic_id", clinic.id).order("name")

      if (searchTerm) {
        query = query.or(`name.ilike.%${searchTerm}%,sku.ilike.%${searchTerm}%`)
      }

      const { data, error } = await query
      if (error) throw error
      setItems(data || [])
    } catch (error) {
      console.error("[v0] Error fetching inventory:", error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchItems()
  }, [clinic, searchTerm])

  const lowStockItems = items.filter((item) => item.quantity_in_stock <= item.reorder_level)
  const categories = ["Medicine", "Supply", "Lab", "Equipment"]

  const filteredItems = filterCategory === "all" ? items : items.filter((item) => item.category === filterCategory)

  const handleEdit = (item: InventoryItem) => {
    setSelectedItem(item)
    setIsDialogOpen(true)
  }

  const handleClose = () => {
    setIsDialogOpen(false)
    setSelectedItem(null)
    fetchItems()
  }

  if (isLoading) {
    return <Spinner />
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Inventory</h1>
          <p className="text-slate-600 dark:text-slate-400">Manage medicines, supplies, and equipment</p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          Add Item
        </Button>
      </div>

      {/* Low Stock Alert */}
      {lowStockItems.length > 0 && (
        <Card className="p-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-orange-600 dark:text-orange-400 mt-0.5" />
            <div>
              <h3 className="font-semibold text-orange-900 dark:text-orange-200">Low Stock Alert</h3>
              <p className="text-sm text-orange-800 dark:text-orange-300 mt-1">
                {lowStockItems.length} item(s) are below reorder level
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Search and Filter */}
      <Card className="p-4 space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
          <Input
            placeholder="Search by name or SKU..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button
            variant={filterCategory === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterCategory("all")}
          >
            All ({items.length})
          </Button>
          {categories.map((cat) => (
            <Button
              key={cat}
              variant={filterCategory === cat ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterCategory(cat)}
            >
              {cat} ({items.filter((i) => i.category === cat).length})
            </Button>
          ))}
        </div>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard label="Total Items" value={items.length} color="blue" />
        <StatCard label="Low Stock" value={lowStockItems.length} color="orange" />
        <StatCard
          label="Total Value"
          value={`KES ${(items.reduce((sum, i) => sum + i.price * i.quantity_in_stock, 0) / 1000).toFixed(1)}K`}
          color="emerald"
        />
        <StatCard label="Categories" value={new Set(items.map((i) => i.category)).size} color="purple" />
      </div>

      {/* Inventory List */}
      <InventoryList items={filteredItems} onEdit={handleEdit} onRefresh={fetchItems} />

      {/* Dialog */}
      <InventoryDialog open={isDialogOpen} onOpenChange={setIsDialogOpen} item={selectedItem} onClose={handleClose} />
    </div>
  )
}

function StatCard({
  label,
  value,
  color,
}: {
  label: string
  value: number | string
  color: "blue" | "orange" | "emerald" | "purple"
}) {
  const colorClasses = {
    blue: "text-blue-600 dark:text-blue-400",
    orange: "text-orange-600 dark:text-orange-400",
    emerald: "text-emerald-600 dark:text-emerald-400",
    purple: "text-purple-600 dark:text-purple-400",
  }
  return (
    <Card className="p-4">
      <p className="text-sm text-slate-600 dark:text-slate-400">{label}</p>
      <p className={`text-2xl font-bold mt-1 ${colorClasses[color]}`}>{value}</p>
    </Card>
  )
}
