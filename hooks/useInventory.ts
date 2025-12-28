import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { db } from "../services/db"
import type { InventoryItem, Supplier } from "../types"
import useStore from "../store"

// Query keys
export const inventoryKeys = {
    all: ["inventory"] as const,
    lowStock: () => [...inventoryKeys.all, "lowStock"] as const,
    detail: (id: string) => [...inventoryKeys.all, id] as const,
}

export const supplierKeys = {
    all: ["suppliers"] as const,
    detail: (id: string) => [...supplierKeys.all, id] as const,
}

// Fetch all inventory items
export function useInventory() {
    const { isDemoMode, inventory: mockInventory } = useStore()

    return useQuery({
        queryKey: inventoryKeys.all,
        queryFn: async () => {
            if (isDemoMode) {
                return mockInventory
            }
            return db.getInventory()
        },
        staleTime: 1000 * 60 * 5, // 5 minutes
    })
}

// Fetch low stock items
export function useLowStockItems() {
    const { data: inventory } = useInventory()

    return inventory?.filter((item) => item.stock <= item.minStockLevel) ?? []
}

// Create inventory item mutation
export function useCreateInventoryItem() {
    const queryClient = useQueryClient()
    const { isDemoMode, actions } = useStore()

    return useMutation({
        mutationFn: async (item: InventoryItem) => {
            if (isDemoMode) {
                return item
            }
            return db.createInventoryItem(item)
        },
        onSuccess: (newItem) => {
            queryClient.invalidateQueries({ queryKey: inventoryKeys.all })
            actions.showToast(`${newItem.name} added to inventory.`)
        },
        onError: () => {
            actions.showToast("Error creating item", "error")
        },
    })
}

// Update inventory item mutation
export function useUpdateInventoryItem() {
    const queryClient = useQueryClient()
    const { isDemoMode, actions } = useStore()

    return useMutation({
        mutationFn: async (item: InventoryItem) => {
            if (!isDemoMode) {
                await db.updateInventoryItem(item)
            }
            return item
        },
        onSuccess: (item) => {
            queryClient.invalidateQueries({ queryKey: inventoryKeys.all })
            actions.showToast(`${item.name} updated.`)
        },
        onError: () => {
            actions.showToast("Error updating item", "error")
        },
    })
}

// Delete inventory item mutation
export function useDeleteInventoryItem() {
    const queryClient = useQueryClient()
    const { isDemoMode, actions } = useStore()

    return useMutation({
        mutationFn: async (id: string) => {
            if (!isDemoMode) {
                await db.deleteInventoryItem(id)
            }
            return id
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: inventoryKeys.all })
            actions.showToast("Item removed.", "info")
        },
        onError: () => {
            actions.showToast("Error deleting item", "error")
        },
    })
}

// Fetch all suppliers
export function useSuppliers() {
    const { isDemoMode, suppliers: mockSuppliers } = useStore()

    return useQuery({
        queryKey: supplierKeys.all,
        queryFn: async () => {
            if (isDemoMode) {
                return mockSuppliers
            }
            return db.getSuppliers()
        },
        staleTime: 1000 * 60 * 5, // 5 minutes
    })
}

// Create supplier mutation
export function useCreateSupplier() {
    const queryClient = useQueryClient()
    const { isDemoMode, actions } = useStore()

    return useMutation({
        mutationFn: async (supplier: Supplier) => {
            if (isDemoMode) {
                return supplier
            }
            return db.createSupplier(supplier)
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: supplierKeys.all })
            actions.showToast("Supplier added successfully.")
        },
        onError: () => {
            actions.showToast("Error adding supplier", "error")
        },
    })
}

// Update supplier mutation
export function useUpdateSupplier() {
    const queryClient = useQueryClient()
    const { isDemoMode, actions } = useStore()

    return useMutation({
        mutationFn: async (supplier: Supplier) => {
            if (!isDemoMode) {
                await db.updateSupplier(supplier)
            }
            return supplier
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: supplierKeys.all })
            actions.showToast("Supplier updated.")
        },
        onError: () => {
            actions.showToast("Error updating supplier", "error")
        },
    })
}

// Delete supplier mutation
export function useDeleteSupplier() {
    const queryClient = useQueryClient()
    const { isDemoMode, actions } = useStore()

    return useMutation({
        mutationFn: async (id: string) => {
            if (!isDemoMode) {
                await db.deleteSupplier(id)
            }
            return id
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: supplierKeys.all })
            actions.showToast("Supplier removed.", "info")
        },
        onError: () => {
            actions.showToast("Error deleting supplier", "error")
        },
    })
}
