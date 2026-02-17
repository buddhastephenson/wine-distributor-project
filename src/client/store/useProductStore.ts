import { create } from 'zustand';
import { IProduct, ISpecialOrder, IFormulas } from '../../shared/types';
import { productApi, specialOrderApi, storageApi } from '../services/api';

interface ProductState {
    products: IProduct[];
    specialOrders: ISpecialOrder[];
    formulas: IFormulas | null;
    isLoading: boolean;
    error: string | null;

    fetchProducts: () => Promise<void>;
    fetchSpecialOrders: (username?: string) => Promise<void>;
    addSpecialOrder: (order: Partial<ISpecialOrder>) => Promise<ISpecialOrder | null>;
    updateSpecialOrder: (id: string, updates: Partial<ISpecialOrder>) => Promise<void>;
    deleteSpecialOrder: (id: string) => Promise<void>;
    bulkDeleteSpecialOrders: (ids: string[]) => Promise<void>;
    batchUpdateStatus: (updates: { id: string, status: string }[]) => Promise<void>;
    fetchFormulas: () => Promise<void>;

    // Optimistic updates could be added here
    updateProduct: (id: string, updates: Partial<IProduct>) => Promise<void>;
    deleteProduct: (id: string) => Promise<void>;
    updateFormulas: (formulas: IFormulas) => Promise<void>;
    scanDuplicates: () => Promise<any[]>;
    executeDeduplication: (groups: { winnerId: string, loserIds: string[] }[]) => Promise<{ merged: number, deleted: number }>;

    // Supplier Management
    fetchSupplierStats: () => Promise<{ supplier: string; count: number }[]>;
    renameSupplier: (oldName: string, newName: string) => Promise<{ productsUpdated: number; ordersUpdated: number }>;
    deleteSupplier: (name: string) => Promise<{ productsDeleted: number; ordersUpdated: number }>;
}

export const useProductStore = create<ProductState>((set, get) => ({
    products: [],
    specialOrders: [],
    formulas: null,
    isLoading: false,
    error: null,

    fetchProducts: async () => {
        set({ isLoading: true, error: null });
        try {
            const response = await productApi.getAll();
            set({ products: response.data, isLoading: false });
        } catch (error: any) {
            set({ error: 'Failed to fetch products', isLoading: false });
        }
    },

    fetchSpecialOrders: async (username) => {
        set({ isLoading: true, error: null });
        try {
            const response = await specialOrderApi.getAll(username);
            set({ specialOrders: response.data, isLoading: false });
        } catch (error: any) {
            set({ error: 'Failed to fetch special orders', isLoading: false });
        }
    },

    addSpecialOrder: async (order) => {
        console.log('useProductStore.addSpecialOrder called with:', order);
        try {
            // Check for impersonation
            // Dynamically import or access store to avoid circular deps if possible, 
            // but here we can just import useAuthStore at top or access via window/global if complex.
            // Actually, we can import useAuthStore. using getState() is safe inside actions.
            const { originalUser } = require('./useAuthStore').useAuthStore.getState();

            const payload = {
                ...order,
                impersonatedBy: originalUser ? originalUser.username : undefined
            };

            const response = await specialOrderApi.create(payload);
            console.log('addSpecialOrder success:', response.data);
            if (response.data.success) {
                set((state) => ({
                    specialOrders: [...state.specialOrders, response.data.order]
                }));
                return response.data.order;
            }
            return null;
        } catch (error: any) {
            console.error('Add Special Order Failed:', error.response?.data || error.message);
            set({ error: 'Failed to add to list' });
            return null;
        }
    },

    updateSpecialOrder: async (id, updates) => {
        // Optimistic update
        const prevOrders = get().specialOrders;
        set({
            specialOrders: prevOrders.map(o => o.id === id ? { ...o, ...updates } : o)
        });

        try {
            await specialOrderApi.update(id, updates);
        } catch (error: any) {
            console.error('Update Order Failed:', error.response?.data || error.message);
            set({ specialOrders: prevOrders, error: 'Failed to update order' });
        }
    },

    deleteSpecialOrder: async (id) => {
        const prevOrders = get().specialOrders;
        set({
            specialOrders: prevOrders.filter(o => o.id !== id)
        });

        try {
            await specialOrderApi.delete(id);
        } catch (error) {
            set({ specialOrders: prevOrders, error: 'Failed to delete order' });
        }
    },

    bulkDeleteSpecialOrders: async (ids) => {
        const prevOrders = get().specialOrders;
        set({
            specialOrders: prevOrders.filter(o => !ids.includes(o.id))
        });

        try {
            await specialOrderApi.bulkDelete(ids);
        } catch (error) {
            set({ specialOrders: prevOrders, error: 'Failed to bulk delete orders' });
        }
    },

    batchUpdateStatus: async (updates) => {
        set({ isLoading: true });
        try {
            await specialOrderApi.batchUpdateStatus(updates);
            // Manually update local state
            set((state) => {
                const newOrders = state.specialOrders.map(order => {
                    const update = updates.find(u => u.id === order.id);
                    return update ? { ...order, status: update.status } : order;
                });
                return { specialOrders: newOrders, isLoading: false };
            });
        } catch (error: any) {
            set({ error: error.message || 'Failed to batch update', isLoading: false });
            throw error;
        }
    },

    updateProduct: async (id, updates) => {
        // Optimistic update
        const prevProducts = get().products;
        set({
            products: prevProducts.map(p => p.id === id ? { ...p, ...updates } : p)
        });

        try {
            await productApi.update(id, updates);
            // Could re-fetch or assume success if no error
        } catch (error) {
            // Revert
            set({ products: prevProducts, error: 'Failed to update product' });
        }
    },

    deleteProduct: async (id) => {
        const prevProducts = get().products;
        set({
            products: prevProducts.filter(p => p.id !== id)
        });

        try {
            await productApi.delete(id);
        } catch (error) {
            set({ products: prevProducts, error: 'Failed to delete product' });
        }
    },

    fetchFormulas: async () => {
        try {
            // Legacy endpoint for formulas (stored as blob)
            const response = await fetch(`/api/storage/wine-formulas?t=${Date.now()}`);
            if (!response.ok) throw new Error('Failed to fetch formulas');

            const data = await response.json();
            const formulas = data.value ? JSON.parse(data.value) : data;

            set({ formulas });
        } catch (error: any) {
            console.error('Failed to fetch formulas:', error);
        }
    },

    updateFormulas: async (newFormulas: IFormulas) => {
        set({ formulas: newFormulas }); // Optimistic update
        try {
            const response = await storageApi.updateFormulas(newFormulas);
            if (!response.data.success) throw new Error('Failed to save formulas');
        } catch (error) {
            console.error('Failed to save formulas:', error);
            // Revert or show error? For now just log
        }
    },

    scanDuplicates: async () => {
        try {
            const response = await productApi.scanDuplicates();
            return response.data.duplicates;
        } catch (error) {
            console.error('Scan failed:', error);
            return [];
        }
    },

    executeDeduplication: async (groups) => {
        try {
            const response = await productApi.executeDeduplication(groups);
            return response.data.stats;
        } catch (error) {
            console.error('Deduplication failed:', error);
            throw error;
        }
    },

    // --- Supplier Management ---

    fetchSupplierStats: async () => {
        try {
            const response = await productApi.getSuppliers();
            return Array.isArray(response.data.stats) ? response.data.stats : [];
        } catch (error) {
            console.error('Failed to fetch supplier stats:', error);
            throw error;
        }
    },

    renameSupplier: async (oldName, newName) => {
        try {
            const response = await productApi.renameSupplier(oldName, newName);
            return response.data.result;
        } catch (error) {
            console.error('Failed to rename supplier:', error);
            throw error;
        }
    },

    deleteSupplier: async (name) => {
        try {
            const response = await productApi.deleteSupplier(name);
            return response.data.result;
        } catch (error) {
            console.error('Failed to delete supplier:', error);
            throw error;
        }
    }
}));
