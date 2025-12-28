"use client"

import { useState } from "react"
import { getSupabaseClient } from "@/lib/supabase/singleton"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Trash2, Edit2, Package, AlertCircle } from "lucide-react"
import type { InventoryItem } from "@/types/database"

interface InventoryListProps {
  items: InventoryItem[]
  onEdit: (item: InventoryItem) => void
  onRefresh: () => void
}

const categoryColors: Record<string, string> = {
  Medicine: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  Supply: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  Lab: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  Equipment: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
}

export function InventoryList({ items, onEdit, onRefresh }: InventoryListProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const handleDelete = async (itemId: string) => {
    try {
      const supabase = getSupabaseClient()
      const { error } = await supabase.from("inventory").delete().eq("id", itemId)
      if (error) throw error
      setDeletingId(null)
      onRefresh()
    } catch (error) {
      console.error("[v0] Error deleting item:", error)
    }
  }

  if (items.length === 0) {
    return (
      <Card className="p-12 text-center">
        <Package className="w-12 h-12 mx-auto mb-4 text-slate-300" />
        <p className="text-slate-600 dark:text-slate-400">No inventory items found</p>
      </Card>
    )
  }

  return (
    <div className="space-y-3">
      {items.map((item) => {
        const isLowStock = item.quantity_in_stock <= item.reorder_level
        return (
          <Card
            key={item.id}
            className={`p-4 hover:shadow-md transition-shadow ${isLowStock ? "border-orange-300" : ""}`}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="font-semibold text-slate-900 dark:text-white">{item.name}</h3>
                  <Badge className={categoryColors[item.category]}>{item.category}</Badge>
                  {isLowStock && (
                    <Badge
                      className="bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200"
                      variant="outline"
                    >
                      <AlertCircle className="w-3 h-3 mr-1" />
                      Low Stock
                    </Badge>
                  )}
                </div>
                <div className="space-y-1 text-sm text-slate-600 dark:text-slate-400">
                  <p>
                    <strong>SKU:</strong> {item.sku}
                  </p>
                  <p>
                    <strong>Stock:</strong> {item.quantity_in_stock} {item.unit} (Reorder: {item.reorder_level})
                  </p>
                  {item.price && (
                    <p>
                      <strong>Price:</strong> KES {item.price.toFixed(2)} (
                      {(item.price * item.quantity_in_stock).toFixed(2)} total value)
                    </p>
                  )}
                  {item.expiry_date && (
                    <p>
                      <strong>Expiry:</strong> {new Date(item.expiry_date).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => onEdit(item)}>
                  <Edit2 className="w-4 h-4" />
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogTitle>Delete Item</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete {item.name}? This action cannot be undone.
                    </AlertDialogDescription>
                    <div className="flex justify-end gap-4">
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => handleDelete(item.id)} className="bg-red-600 hover:bg-red-700">
                        Delete
                      </AlertDialogAction>
                    </div>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </Card>
        )
      })}
    </div>
  )
}
