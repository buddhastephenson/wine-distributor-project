import React from 'react';
import { ISpecialOrder, IUser, ORDER_STATUS } from '../../../shared/types';
import { X, Check } from 'lucide-react';
import { OrderChat } from './OrderChat';
import { v4 as uuidv4 } from 'uuid'; // You might need to install this or use a simple generator

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

    const handleSendMessage = (orderId: string, text: string) => {
        if (!currentUser) return;

        const orderIndex = orders.findIndex(o => o.id === orderId);
        if (orderIndex === -1) return;

        const order = orders[orderIndex];
        const newMessage = {
            id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            text,
            sender: currentUser.username,
            timestamp: new Date().toISOString(),
            isAdmin: currentUser.type === 'admin'
        };

        const updatedMessages = [...(order.messages || []), newMessage];
        onUpdate(orderId, { messages: updatedMessages, hasUnseenUpdate: true });
    };

    return (
        <div className="space-y-4">
            {orders.map(item => (
                <div key={item.id} className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-6 hover:shadow-md transition-all duration-200">
                    <div className="flex justify-between items-start mb-4">
                        <div className="flex-1 pr-4">
                            <div className="flex items-center space-x-2 mb-1">
                                <p className="font-bold text-lg text-slate-900 dark:text-white uppercase tracking-tight">{item.producer}</p>
                                {item.hasUnseenUpdate && (
                                    <span className="text-[10px] font-bold text-white bg-rose-500 px-2 py-0.5 rounded-full uppercase tracking-widest animate-pulse">Update</span>
                                )}
                            </div>
                            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mb-1">{item.productName}</p>
                            <div className="flex flex-wrap gap-2 mb-2">
                                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                                    {item.vintage || 'NV'}
                                </span>
                                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                                    {item.bottleSize}
                                </span>
                                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                                    {item.packSize}pk
                                </span>
                            </div>
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

                    <OrderChat
                        orderId={item.id}
                        messages={item.messages || []}
                        currentUser={currentUser}
                        onSendMessage={handleSendMessage}
                        isReadOnly={isReadOnly}
                    />

                    <div className="pt-4 border-t border-slate-50 flex items-center justify-between">
                        {currentUser?.type === 'admin' ? (
                            <div className="relative">
                                <select
                                    value={item.status || ORDER_STATUS.PENDING}
                                    onChange={(e) => onUpdate(item.id, { status: e.target.value })}
                                    className={`appearance-none text-[10px] font-black uppercase tracking-widest px-3 py-1 pr-6 rounded-full border cursor-pointer focus:outline-none focus:ring-2 focus:ring-rose-500/20 ${(item.status || 'Pending').includes('Pending') ? 'bg-slate-50 text-slate-400 border-slate-100' :
                                        (item.status || '').includes('On Purchase Order') ? 'bg-blue-50 text-blue-600 border-blue-100' :
                                            (item.status || '').includes('Arrived') || (item.status || '').includes('Stock') ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                                (item.status || '').includes('Backordered') ? 'bg-amber-50 text-amber-600 border-amber-100' :
                                                    (item.status || '').includes('Delivered') ? 'bg-green-50 text-green-700 border-green-100' :
                                                        (item.status || '').includes('Not Available') ? 'bg-rose-50 text-rose-600 border-rose-100' :
                                                            'bg-gray-50 text-gray-600 border-gray-100'
                                        }`}
                                >
                                    {Object.values(ORDER_STATUS).map((status) => (
                                        <option key={status} value={status}>
                                            {status}
                                        </option>
                                    ))}
                                </select>
                                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-500">
                                    <svg className="h-3 w-3 fill-current" viewBox="0 0 20 20">
                                        <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                                    </svg>
                                </div>
                            </div>
                        ) : (
                            <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full border ${(item.status || 'Pending').includes('Pending') ? 'bg-slate-50 text-slate-400 border-slate-100' :
                                (item.status || '').includes('On Purchase Order') ? 'bg-blue-50 text-blue-600 border-blue-100' :
                                    (item.status || '').includes('Arrived') || (item.status || '').includes('Stock') ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                        (item.status || '').includes('Backordered') ? 'bg-amber-50 text-amber-600 border-amber-100' :
                                            (item.status || '').includes('Delivered') ? 'bg-green-50 text-green-700 border-green-100' :
                                                (item.status || '').includes('Not Available') ? 'bg-rose-50 text-rose-600 border-rose-100' :
                                                    'bg-gray-50 text-gray-600 border-gray-100'
                                }`}>
                                {item.status || 'Pending'}
                            </span>
                        )}

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
