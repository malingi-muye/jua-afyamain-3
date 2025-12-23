import type { StateCreator } from "zustand"
import type { InventoryItem, Supplier, InventoryLog } from "../types"
import { db } from "../services/db"
import { MOCK_LOGS } from "../constants"

export interface InventorySlice {
    inventory: InventoryItem[]
    suppliers: Supplier[]
    inventoryLogs: InventoryLog[]
    actions: {
        setInventory: (inventory: InventoryItem[]) => void
        setSuppliers: (suppliers: Supplier[]) => void
        addInventoryItem: (item: InventoryItem) => Promise<void>
        updateInventoryItem: (item: InventoryItem, reason?: string) => Promise<void>
        deleteInventoryItem: (id: string) => Promise<void>
        addSupplier: (supplier: Supplier) => Promise<void>
        updateSupplier: (supplier: Supplier) => Promise<void>
        deleteSupplier: (id: string) => Promise<void>
    }
}

export const createInventorySlice: StateCreator<
    InventorySlice & { isDemoMode: boolean; actions: { showToast: (msg: string, type?: "success" | "error" | "info") => void } },
    [],
    [],
    InventorySlice
> = (set, get) => ({
    inventory: [],
    suppliers: [],
    inventoryLogs: MOCK_LOGS,
    actions: {
        setInventory: (inventory) => set({ inventory }),
        setSuppliers: (suppliers) => set({ suppliers }),
        addInventoryItem: async (item) => {
            try {
                let newItem = item
                if (!get().isDemoMode) {
                    const saved = await db.createInventoryItem(item)
                    if (saved) newItem = saved
                }
                set((state) => ({ inventory: [newItem, ...state.inventory] }))
                get().actions.showToast(`${newItem.name} added to inventory.`)
            } catch (e) {
                get().actions.showToast("Error creating item", "error")
            }
        },
        updateInventoryItem: async (updatedItem, reason = "Updated details") => {
            try {
                if (!get().isDemoMode) await db.updateInventoryItem(updatedItem)
                set((state) => ({
                    inventory: state.inventory.map((i) => (i.id === updatedItem.id ? updatedItem : i)),
                }))
                get().actions.showToast(`${updatedItem.name} updated.`)
            } catch (e) {
                get().actions.showToast("Error updating item", "error")
            }
        },
        deleteInventoryItem: async (id) => {
            try {
                if (!get().isDemoMode) await db.deleteInventoryItem(id)
                set((state) => ({ inventory: state.inventory.filter((i) => i.id !== id) }))
                get().actions.showToast(`Item removed.`, "info")
            } catch (e) {
                get().actions.showToast("Error deleting item", "error")
            }
        },
        addSupplier: async (supplier) => {
            try {
                let newSupplier = supplier
                if (!get().isDemoMode) {
                    const saved = await db.createSupplier(supplier)
                    if (saved) newSupplier = saved
                }
                set((state) => ({ suppliers: [...state.suppliers, newSupplier] }))
                get().actions.showToast("Supplier added successfully.")
            } catch (e) {
                get().actions.showToast("Error adding supplier", "error")
            }
        },
        updateSupplier: async (updated) => {
            try {
                if (!get().isDemoMode) await db.updateSupplier(updated)
                set((state) => ({
                    suppliers: state.suppliers.map((s) => (s.id === updated.id ? updated : s)),
                }))
                get().actions.showToast("Supplier updated.")
            } catch (e) {
                get().actions.showToast("Error updating supplier", "error")
            }
        },
        deleteSupplier: async (id) => {
            try {
                if (!get().isDemoMode) await db.deleteSupplier(id)
                set((state) => ({ suppliers: state.suppliers.filter((s) => s.id !== id) }))
                set((state) => ({
                    inventory: state.inventory.map((item) =>
                        item.supplierId === id ? { ...item, supplierId: undefined } : item,
                    ),
                }))
                get().actions.showToast("Supplier removed.", "info")
            } catch (e) {
                get().actions.showToast("Error deleting supplier", "error")
            }
        },
    },
})
