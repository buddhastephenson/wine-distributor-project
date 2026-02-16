
import React, { useState, useEffect } from 'react';
import { X, Edit2, Trash2, AlertCircle, Save, Loader } from 'lucide-react';
import { useProductStore } from '../../store/useProductStore';

interface SupplierManagementModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const SupplierManagementModal: React.FC<SupplierManagementModalProps> = ({ isOpen, onClose }) => {
    const { fetchSupplierStats, renameSupplier, deleteSupplier } = useProductStore();
    const [suppliers, setSuppliers] = useState<{ supplier: string, count: number }[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);

    // Edit State
    const [editingSupplier, setEditingSupplier] = useState<string | null>(null);
    const [newName, setNewName] = useState('');

    useEffect(() => {
        if (isOpen) {
            loadStats();
        }
    }, [isOpen]);

    const loadStats = async () => {
        setIsLoading(true);
        try {
            const stats = await fetchSupplierStats();
            setSuppliers(stats);
            setError(null);
        } catch (err) {
            setError('Failed to load supplier statistics.');
        } finally {
            setIsLoading(false);
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
                await loadStats();
            } catch (err) {
                setError('Failed to rename supplier.');
            } finally {
                setIsLoading(false);
            }
        }
    };

    const handleDelete = async (name: string, count: number) => {
        if (window.confirm(`DANGER: Are you sure you want to delete "${name}"? This will PERMANENTLY DELETE ${count} products. This action cannot be undone.`)) {
            // Double confirmation
            const confirmation = window.prompt(`Type "DELETE" to confirm deleting ${count} products for "${name}":`);
            if (confirmation !== 'DELETE') return;

            setIsLoading(true);
            try {
                const result = await deleteSupplier(name);
                setSuccessMsg(`Successfully deleted "${name}". Removed ${result.productsDeleted} products.`);
                await loadStats();
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
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
                <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50 rounded-t-2xl">
                    <div>
                        <h2 className="text-xl font-bold text-slate-800 dark:text-white">Manage Price Lists (Suppliers)</h2>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                            Rename or delete price lists to keep your catalog clean.
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
                                            <td colSpan={3} className="px-6 py-8 text-center text-slate-500 italic">
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
