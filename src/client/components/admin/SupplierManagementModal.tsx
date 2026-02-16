
import React, { useState, useEffect } from 'react';
import { X, Edit2, Trash2, AlertCircle, Save, Loader } from 'lucide-react';
import { useProductStore } from '../../store/useProductStore';
import { userApi } from '../../services/api';
import { IUser } from '../../../shared/types';

interface SupplierManagementModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const SupplierManagementModal: React.FC<SupplierManagementModalProps> = ({ isOpen, onClose }) => {
    const { fetchSupplierStats, renameSupplier, deleteSupplier } = useProductStore();
    const [suppliers, setSuppliers] = useState<{ supplier: string, count: number }[]>([]);
    const [vendors, setVendors] = useState<IUser[]>([]);
    const [allUsers, setAllUsers] = useState<IUser[]>([]); // Keep all users to check existing
    const [supplierVendorMap, setSupplierVendorMap] = useState<Record<string, string>>({}); // supplierName -> vendorId
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);

    // Edit State
    const [editingSupplier, setEditingSupplier] = useState<string | null>(null);
    const [newName, setNewName] = useState('');

    useEffect(() => {
        if (isOpen) {
            loadData();
        }
    }, [isOpen]);

    const loadData = async () => {
        setIsLoading(true);
        try {
            const [stats, userResponse] = await Promise.all([
                fetchSupplierStats(),
                userApi.getAll()
            ]);

            setSuppliers(stats);
            setAllUsers(userResponse.data);

            // Filter only vendors
            const vendorUsers = userResponse.data.filter(u => u.type === 'vendor');
            setVendors(vendorUsers);

            // Build map: which vendor owns which supplier
            const map: Record<string, string> = {};
            userResponse.data.forEach(u => {
                if (u.vendors && Array.isArray(u.vendors)) {
                    u.vendors.forEach(v => {
                        map[v] = u.id;
                    });
                }
            });
            setSupplierVendorMap(map);

            setError(null);
        } catch (err) {
            setError('Failed to load data.');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleAssign = async (supplierName: string, vendorId: string) => {
        if (vendorId === '_ADD_NEW_') {
            const name = prompt('Enter new Vendor username:');
            if (name) {
                setIsLoading(true);
                try {
                    // 1. Create User
                    const createRes = await userApi.quickCreate(name);
                    // createRes.data contains the IAuthResponse
                    if (!createRes.data.success || !createRes.data.user) throw new Error(createRes.data.error || 'Failed to create user');
                    const newUser = createRes.data.user;

                    // 2. Set as Active
                    await userApi.updateStatus(newUser.id, 'active');

                    // 3. Set as Vendor
                    await userApi.updateRole(newUser.id, 'vendor');

                    setSuccessMsg(`Created new vendor: ${newUser.username}`);

                    // 4. Reload Data to get new user in list and ensure maps are updated
                    await loadData();

                    // 5. Assign this supplier to the new vendor
                    await userApi.assignSupplier(supplierName, newUser.id);

                    // Update verification map manually to reflect immediate change in UI
                    setSupplierVendorMap(prev => ({ ...prev, [supplierName]: newUser.id }));

                } catch (err: any) {
                    console.error(err);
                    const msg = err.response?.data?.error || err.message || 'Failed to create new vendor.';

                    // Special handling for existing user
                    if (msg === 'Username already exists' || msg === 'User or Email already exists') {
                        const existing = allUsers.find(u => u.username.toLowerCase() === name.toLowerCase());
                        if (existing) {
                            if (window.confirm(`User "${existing.username}" already exists (Role: ${existing.type}). Do you want to use this account and make them a Vendor?`)) {
                                // Proceed with existing user
                                try {
                                    // 1. Set as Active
                                    await userApi.updateStatus(existing.id, 'active');

                                    // 2. Set as Vendor
                                    await userApi.updateRole(existing.id, 'vendor');

                                    setSuccessMsg(`Updated role for existing user: ${existing.username}`);
                                    await loadData();

                                    await userApi.assignSupplier(supplierName, existing.id);
                                    setSupplierVendorMap(prev => ({ ...prev, [supplierName]: existing.id }));
                                    setError(null); // clear error
                                    return;
                                } catch (updateErr: any) {
                                    console.error(updateErr);
                                    setError('Failed to update existing user role');
                                    return;
                                }
                            }
                        }
                    }

                    setError(msg);
                } finally {
                    setIsLoading(false);
                }
            }
            return;
        }

        // Optimistic update
        const oldVendorId = supplierVendorMap[supplierName];
        setSupplierVendorMap(prev => ({ ...prev, [supplierName]: vendorId }));

        try {
            await userApi.assignSupplier(supplierName, vendorId || undefined); // Pass undefined if empty string (unassign)
        } catch (err) {
            // Revert
            setSupplierVendorMap(prev => ({ ...prev, [supplierName]: oldVendorId }));
            setError('Failed to assign vendor.');
        }
    };

    const handleRename = async (oldName: string) => {
        if (!newName.trim() || newName === oldName) {
            setEditingSupplier(null);
            return;
        }

        if (window.confirm(`Are you sure you want to rename "${oldName}" to "${newName}"? This will update all associated products and orders.`)) {
            setIsLoading(true);
            try {
                const result = await renameSupplier(oldName, newName);
                setSuccessMsg(`Successfully renamed. Updated ${result.productsUpdated} products and ${result.ordersUpdated} orders.`);
                setEditingSupplier(null);
                setNewName('');
                await loadData(); // Reload everything to update stats and maps
            } catch (err) {
                setError('Failed to rename supplier.');
            } finally {
                setIsLoading(false);
            }
        }
    };

    const handleDelete = async (name: string, count: number) => {
        if (window.confirm(`DANGER: Are you sure you want to delete "${name}"? This will PERMANENTLY DELETE ${count} products. This action cannot be undone.`)) {
            const confirmation = window.prompt(`Type "DELETE" to confirm deleting ${count} products for "${name}":`);
            if (confirmation !== 'DELETE') return;

            setIsLoading(true);
            try {
                const result = await deleteSupplier(name);
                setSuccessMsg(`Successfully deleted "${name}". Removed ${result.productsDeleted} products.`);
                await loadData();
            } catch (err) {
                setError('Failed to delete supplier.');
            } finally {
                setIsLoading(false);
            }
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-5xl max-h-[90vh] flex flex-col">
                <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50 rounded-t-2xl">
                    <div>
                        <h2 className="text-xl font-bold text-slate-800 dark:text-white">Manage Price Lists (Suppliers)</h2>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                            Rename, delete, or assign price lists to vendors.
                        </p>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full">
                        <X size={20} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6">
                    {error && (
                        <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl flex items-center shadow-sm">
                            <AlertCircle size={20} className="mr-3 flex-shrink-0" />
                            {error}
                        </div>
                    )}

                    {successMsg && (
                        <div className="mb-4 p-4 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-xl flex items-center shadow-sm">
                            <AlertCircle size={20} className="mr-3 flex-shrink-0" />
                            {successMsg}
                        </div>
                    )}

                    {isLoading && suppliers.length === 0 ? (
                        <div className="flex justify-center items-center py-20">
                            <Loader className="animate-spin text-indigo-600" size={32} />
                        </div>
                    ) : (
                        <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden shadow-sm">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-slate-50 dark:bg-slate-700/50 text-slate-500 dark:text-slate-400 font-medium border-b border-slate-200 dark:border-slate-700">
                                    <tr>
                                        <th className="px-6 py-4">Price List Name</th>
                                        <th className="px-6 py-4">Assigned Vendor</th>
                                        <th className="px-6 py-4 text-center">Products</th>
                                        <th className="px-6 py-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                                    {suppliers.map((s) => (
                                        <tr key={s.supplier} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors group">
                                            <td className="px-6 py-4 font-medium text-slate-800 dark:text-slate-200">
                                                {editingSupplier === s.supplier ? (
                                                    <div className="flex items-center space-x-2">
                                                        <input
                                                            type="text"
                                                            value={newName}
                                                            onChange={(e) => setNewName(e.target.value)}
                                                            className="border rounded px-2 py-1 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                                                            autoFocus
                                                        />
                                                        <button
                                                            onClick={() => handleRename(s.supplier)}
                                                            className="text-emerald-600 hover:text-emerald-700 p-1 rounded hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
                                                            title="Save"
                                                        >
                                                            <Save size={16} />
                                                        </button>
                                                        <button
                                                            onClick={() => setEditingSupplier(null)}
                                                            className="text-slate-400 hover:text-slate-600 p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700"
                                                            title="Cancel"
                                                        >
                                                            <X size={16} />
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <span>{s.supplier}</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                <select
                                                    value={supplierVendorMap[s.supplier] || ''}
                                                    onChange={(e) => handleAssign(s.supplier, e.target.value)}
                                                    className="border border-slate-200 dark:border-slate-600 rounded px-2 py-1 text-sm bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                                                >
                                                    <option value="">Unassigned</option>
                                                    {vendors.map(v => (
                                                        <option key={v.id} value={v.id}>
                                                            {v.username}
                                                        </option>
                                                    ))}
                                                    <option value="_ADD_NEW_" className="font-bold text-indigo-600">+ Add New Vendor...</option>
                                                </select>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className="inline-flex items-center justify-center px-2 py-1 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded text-xs font-bold">
                                                    {s.count}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right space-x-2">
                                                <button
                                                    onClick={() => {
                                                        setEditingSupplier(s.supplier);
                                                        setNewName(s.supplier);
                                                    }}
                                                    className="text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors p-1.5 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg inline-flex items-center"
                                                    title="Rename"
                                                >
                                                    <Edit2 size={16} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(s.supplier, s.count)}
                                                    className="text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors p-1.5 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg inline-flex items-center"
                                                    title="Delete"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    {suppliers.length === 0 && (
                                        <tr>
                                            <td colSpan={4} className="px-6 py-8 text-center text-slate-500 italic">
                                                {isLoading ? 'Loading...' : 'No price lists found.'}
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                <div className="p-6 border-t border-slate-100 dark:border-slate-700 flex justify-end bg-slate-50/50 dark:bg-slate-800/50 rounded-b-2xl">
                    <button
                        onClick={onClose}
                        className="px-6 py-2.5 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl hover:bg-slate-300 dark:hover:bg-slate-600 font-medium transition-colors"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};
