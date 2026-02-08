import React from 'react';
import { ISpecialOrder, IUser } from '../../../shared/types';
import { X, Check } from 'lucide-react';

interface OrderListProps {
    orders: ISpecialOrder[];
    currentUser: IUser | null;
    onUpdate: (id: string, updates: Partial<ISpecialOrder>) => void;
    onDelete: (id: string) => void;
    isReadOnly?: boolean;
}

export const OrderList: React.FC<OrderListProps> = ({ orders, currentUser, onUpdate, onDelete, isReadOnly = false }) => {
    if (orders.length === 0) {
        return (
            <div className="text-center py-10 text-gray-500">
                <p>No orders found.</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {orders.slice().reverse().map(item => (
                <div key={item.id} className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-6 hover:shadow-md transition-all duration-200">
                    <div className="flex justify-between items-start mb-4">
                        <div className="flex-1 pr-4">
                            <div className="flex items-center space-x-2 mb-1">
                                <p className="font-bold text-lg text-slate-900 dark:text-white uppercase tracking-tight">{item.producer}</p>
                                {item.hasUnseenUpdate && (
                                    <span className="text-[10px] font-bold text-white bg-rose-500 px-2 py-0.5 rounded-full uppercase tracking-widest animate-pulse">Update</span>
                                )}
                            </div>
                            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">{item.productName}</p>
                            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-2">${item.frontlinePrice} / unit</p>
                        </div>
                        {!isReadOnly && (!item.submitted || currentUser?.type === 'admin') && (
                            <button
                                onClick={() => onDelete(item.id)}
                                className="p-2 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                title="Remove Item"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-4">
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Cases</label>
                            <input
                                type="number"
                                min="0"
                                value={item.cases}
                                onChange={(e) => onUpdate(item.id, { cases: parseInt(e.target.value) || 0 })}
                                disabled={isReadOnly || (currentUser?.type === 'customer' && ['On Purchase Order', 'In Stock', 'Delivered'].includes(item.status))}
                                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500/20 transition-all font-mono font-bold text-sm disabled:opacity-50 disabled:bg-slate-100"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Bottles</label>
                            <input
                                type="number"
                                min="0"
                                value={item.bottles}
                                onChange={(e) => onUpdate(item.id, { bottles: parseInt(e.target.value) || 0 })}
                                disabled={isReadOnly || (currentUser?.type === 'customer' && ['On Purchase Order', 'In Stock', 'Delivered'].includes(item.status))}
                                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500/20 transition-all font-mono font-bold text-sm disabled:opacity-50 disabled:bg-slate-100"
                            />
                        </div>
                    </div>

                    <div className="pt-4 border-t border-slate-50 flex items-center justify-between">
                        <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full border ${(item.status || 'Requested').toUpperCase().includes('REQUESTED') ? 'bg-slate-50 text-slate-400 border-slate-100' :
                                (item.status || '').toUpperCase().includes('ORDERED') ? 'bg-blue-50 text-blue-600 border-blue-100' :
                                    (item.status || '').toUpperCase().includes('STOCK') ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                        (item.status || '').toUpperCase().includes('BACKORDERED') ? 'bg-amber-50 text-amber-600 border-amber-100' :
                                            (item.status || '').toUpperCase().includes('DELIVERED') ? 'bg-green-50 text-green-700 border-green-100' :
                                                'bg-rose-50 text-rose-600 border-rose-100'
                            }`}>
                            {item.status || 'Requested'}
                        </span>

                        {(item.adminNotes || (currentUser?.type === 'admin' && item.notes)) && (
                            <div className="text-[10px] text-slate-400 italic max-w-[50%] truncate">
                                {item.adminNotes ? `Admin: ${item.adminNotes}` : `Note: ${item.notes}`}
                            </div>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
};
