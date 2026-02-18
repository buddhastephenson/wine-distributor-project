
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
            setAllUsers(Array.isArray(userResponse.data) ? userResponse.data : []);

            // Filter only vendors
            const users = Array.isArray(userResponse.data) ? userResponse.data : [];
            const vendorUsers = users.filter(u => u.type === 'vendor');
            setVendors(vendorUsers);

            // Build map: which vendor owns which supplier
            const map: Record<string, string> = {};
            users.forEach(u => {
                if (u.vendors && Array.isArray(u.vendors)) {
                    u.vendors.forEach(v => {
                        map[v] = u.id;
                    });
                }
            });
            setSupplierVendorMap(map);

            setError(null);
        } catch (err: any) {
            const msg = err.response?.data?.error || err.message || 'Failed to load data.';
            setError(`Error: ${msg}`);
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleAssign = async (supplierName: string, vendorId: string) => {
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

    const [renameConfirmation, setRenameConfirmation] = useState<{ isOpen: boolean; oldName: string; newName: string } | null>(null);

    const handleRename = async (oldName: string) => {
        if (!newName.trim() || newName === oldName) {
            setEditingSupplier(null);
            return;
        }
        setRenameConfirmation({ isOpen: true, oldName, newName });
    };

    const confirmRename = async () => {
        if (!renameConfirmation) return;
        const { oldName, newName } = renameConfirmation;

        setIsLoading(true);
        setRenameConfirmation(null);

        try {
            const result = await renameSupplier(oldName, newName);
            setSuccessMsg(`Successfully renamed. Updated ${result.productsUpdated} products and ${result.ordersUpdated} orders.`);
            setEditingSupplier(null);
            setNewName('');
            await loadData();
        } catch (err) {
            setError('Failed to rename supplier.');
        } finally {
            setIsLoading(false);
        }
    };

    const [deleteConfirmation, setDeleteConfirmation] = useState<{ isOpen: boolean; supplier: string; count: number; input: string } | null>(null);

    const handleDelete = (name: string, count: number) => {
        setDeleteConfirmation({ isOpen: true, supplier: name, count, input: '' });
    };

    const confirmDelete = async () => {
        if (!deleteConfirmation || deleteConfirmation.input !== 'DELETE') return;

        const name = deleteConfirmation.supplier;
        const displayName = name || '(No Supplier Name)';

        setIsLoading(true);
        setDeleteConfirmation(null); // Close modal

        try {
            const result = await deleteSupplier(name);
            setSuccessMsg(`Successfully deleted "${displayName}". Removed ${result.productsDeleted} products.`);
            await loadData();
        } catch (err) {
            setError('Failed to delete supplier.');
        } finally {
            setIsLoading(false);
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
                                    {suppliers.map((s) => {
                                        const isUnassigned = !supplierVendorMap[s.supplier];
                                        const displayName = s.supplier || '(No Supplier Name)';
                                        const rowClass = isUnassigned
                                            ? "bg-red-50 dark:bg-red-900/10 hover:bg-red-100 dark:hover:bg-red-900/20 transition-colors group"
                                            : "hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors group";

                                        return (
                                            <tr key={s.supplier} className={rowClass}>
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
                                                        <span className={!s.supplier ? "text-red-500 italic" : ""}>{displayName}</span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <select
                                                        value={supplierVendorMap[s.supplier] || ''}
                                                        onChange={(e) => handleAssign(s.supplier, e.target.value)}
                                                        className={`border rounded px-2 py-1 text-sm bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 ${isUnassigned ? 'border-red-300 text-red-600' : 'border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200'}`}
                                                    >
                                                        <option value="">Unassigned</option>
                                                        {vendors.map(v => (
                                                            <option key={v.id} value={v.id}>
                                                                {v.username}
                                                            </option>
                                                        ))}
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
                                                        title="Delete Price List & Products"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
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

            {/* Rename Confirmation Modal */}
            {renameConfirmation && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md p-6 border border-indigo-100 dark:border-indigo-900/30">
                        <div className="flex items-center space-x-3 text-indigo-600 mb-4">
                            <div className="p-3 bg-indigo-100 dark:bg-indigo-900/20 rounded-full">
                                <AlertCircle size={24} />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white">Rename Price List?</h3>
                        </div>

                        <p className="text-slate-600 dark:text-slate-300 mb-6">
                            Are you sure you want to rename <strong>{renameConfirmation.oldName}</strong> to <strong className="text-indigo-600">{renameConfirmation.newName}</strong>?
                            <br /><br />
                            This will update all associated products and orders.
                        </p>

                        <div className="flex space-x-3 justify-end">
                            <button
                                onClick={() => setRenameConfirmation(null)}
                                className="px-4 py-2 text-slate-600 dark:text-slate-300 font-bold hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmRename}
                                className="px-4 py-2 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20"
                            >
                                Confirm Rename
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {deleteConfirmation && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md p-6 border border-rose-100 dark:border-rose-900/30">
                        <div className="flex items-center space-x-3 text-rose-600 mb-4">
                            <div className="p-3 bg-rose-100 dark:bg-rose-900/20 rounded-full">
                                <AlertCircle size={24} />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white">Delete Price List?</h3>
                        </div>

                        <p className="text-slate-600 dark:text-slate-300 mb-4">
                            You are about to delete <strong>{deleteConfirmation.supplier || '(No Supplier Name)'}</strong> and all <strong className="text-rose-600">{deleteConfirmation.count} products</strong> associated with it.
                        </p>

                        <div className="bg-rose-50 dark:bg-rose-900/10 p-4 rounded-xl mb-6">
                            <label className="block text-xs font-bold text-rose-800 dark:text-rose-200 uppercase tracking-wider mb-2">
                                Type "DELETE" to confirm
                            </label>
                            <input
                                type="text"
                                value={deleteConfirmation.input}
                                onChange={(e) => setDeleteConfirmation({ ...deleteConfirmation, input: e.target.value })}
                                className="w-full px-3 py-2 border border-rose-200 dark:border-rose-700 rounded-lg focus:ring-2 focus:ring-rose-500 outline-none bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-bold"
                                placeholder="DELETE"
                                autoFocus
                            />
                        </div>

                        <div className="flex space-x-3 justify-end">
                            <button
                                onClick={() => setDeleteConfirmation(null)}
                                className="px-4 py-2 text-slate-600 dark:text-slate-300 font-bold hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmDelete}
                                disabled={deleteConfirmation.input !== 'DELETE'}
                                className="px-4 py-2 bg-rose-600 text-white font-bold rounded-xl hover:bg-rose-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-rose-600/20"
                            >
                                Delete Permanently
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
