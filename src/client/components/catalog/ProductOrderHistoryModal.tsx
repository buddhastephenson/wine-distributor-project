import React, { useEffect, useState } from 'react';
import { X, Loader2, Package } from 'lucide-react';
import { ISpecialOrder, IProduct } from '../../../shared/types';
import { specialOrderApi } from '../../services/api';
import { format } from 'date-fns';

interface ProductOrderHistoryModalProps {
    isOpen: boolean;
    onClose: () => void;
    product: IProduct;
}

export const ProductOrderHistoryModal: React.FC<ProductOrderHistoryModalProps> = ({ isOpen, onClose, product }) => {
    const [orders, setOrders] = useState<ISpecialOrder[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!isOpen) return;

        const fetchOrders = async () => {
            setLoading(true);
            setError(null);
            try {
                // Determine the correct identifier to use.
                // Ideally we use the unique 'id', but some legacy orders might be tied to 'itemCode' if 'productId' wasn't set.
                // We'll rely on the new backend endpoint which uses productId.
                const response = await specialOrderApi.getByProductId(product.id as string);
                setOrders(response.data);
            } catch (err: any) {
                console.error('Failed to fetch product order history:', err);
                setError(err.response?.data?.error || 'Failed to load order history');
            } finally {
                setLoading(false);
            }
        };

        fetchOrders();
    }, [isOpen, product.id]);

    if (!isOpen) return null;

    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'Pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-400';
            case 'Confirmed': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-400';
            case 'Partially Delivered': return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-400';
            case 'Delivered': return 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-400';
            case 'Out of Stock':
            case 'Cancelled': return 'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-400';
            default: return 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300';
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={onClose} />
            <div className="relative w-full max-w-4xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden transform transition-all border border-slate-100 dark:border-slate-800">

                {/* Header */}
                <div className="flex items-center justify-between p-6 sm:p-8 border-b border-slate-100 dark:border-slate-800">
                    <div>
                        <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
                            <Package className="w-6 h-6 text-rose-500" />
                            Order History
                        </h2>
                        <p className="text-sm font-bold text-slate-500 dark:text-slate-400 mt-1 uppercase tracking-wider">
                            {product.producer} - {product.productName} {product.vintage}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 sm:p-8">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-12">
                            <Loader2 className="w-8 h-8 text-rose-500 animate-spin mb-4" />
                            <p className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Loading history...</p>
                        </div>
                    ) : error ? (
                        <div className="bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 p-6 rounded-2xl text-center border border-rose-100 dark:border-rose-900/50">
                            <p className="font-bold">{error}</p>
                        </div>
                    ) : orders.length === 0 ? (
                        <div className="text-center py-16 px-4">
                            <Package className="w-16 h-16 w-16 h-16 mx-auto text-slate-200 dark:text-slate-700 mb-6" />
                            <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2 tracking-tight">No Order History</h3>
                            <p className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                                There are no active or past requests for this item.
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-slate-200 dark:border-slate-800">
                                        <th className="py-4 px-4 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Date</th>
                                        <th className="py-4 px-4 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Customer</th>
                                        <th className="py-4 px-4 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 text-center">Qty</th>
                                        <th className="py-4 px-4 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Status</th>
                                        <th className="py-4 px-4 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 text-right">Requested By</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {orders.map((order) => (
                                        <tr key={order.id} className="border-b border-slate-50 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                                            <td className="py-4 px-4 text-sm font-bold text-slate-600 dark:text-slate-300 whitespace-nowrap">
                                                {order.createdAt ? format(new Date(order.createdAt), 'MMM d, yyyy') : 'N/A'}
                                            </td>
                                            <td className="py-4 px-4">
                                                <span className="text-sm font-bold text-slate-900 dark:text-white">{order.username}</span>
                                            </td>
                                            <td className="py-4 px-4 text-center">
                                                <div className="inline-flex justify-center items-center px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
                                                    <span className="text-xs font-black text-slate-700 dark:text-slate-300">
                                                        {order.cases > 0 ? `${order.cases}c` : ''} {order.bottles > 0 ? `${order.bottles}b` : ''}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="py-4 px-4">
                                                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${getStatusStyle(order.status)}`}>
                                                    {order.status}
                                                </span>
                                            </td>
                                            <td className="py-4 px-4 text-right">
                                                {order.impersonatedBy ? (
                                                    <span className="text-xs font-bold text-slate-400 dark:text-slate-500 italic">
                                                        Admin: {order.impersonatedBy}
                                                    </span>
                                                ) : (
                                                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                                                        {order.username}
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 sm:p-8 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-6 py-3 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-2xl font-bold hover:bg-slate-50 dark:hover:bg-slate-700 transition-all border border-slate-200 dark:border-slate-700 shadow-sm"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};
