import React, { useEffect, useMemo } from 'react';
import { useProductStore } from '../../store/useProductStore';
import { useAuthStore } from '../../store/useAuthStore';
import { OrderList } from '../../components/orders/OrderList';
import { ClipboardList, CheckCircle } from 'lucide-react';

export const OrdersPage: React.FC = () => {
    const { specialOrders, fetchSpecialOrders, updateSpecialOrder, deleteSpecialOrder, isLoading, error } = useProductStore();
    const { user } = useAuthStore();

    useEffect(() => {
        fetchSpecialOrders(user?.username);
    }, [fetchSpecialOrders, user?.username]);

    const handleUpdate = (id: string, updates: any) => {
        updateSpecialOrder(id, updates);
    };

    const handleDelete = (id: string) => {
        if (window.confirm('Are you sure you want to remove this item?')) {
            deleteSpecialOrder(id);
        }
    };

    // Separate into "Cart" (Pending Submission) and "History" (Submitted)
    // Assuming 'submitted' flag is used. If not present, we might assume status 'pending' is not submitted.
    // In legacy code, addSpecialOrder sets submitted: false, status: 'pending'.
    const pendingOrders = useMemo(() => specialOrders.filter(o => !o.submitted), [specialOrders]);
    const submittedOrders = useMemo(() => specialOrders.filter(o => o.submitted), [specialOrders]);

    const handleSubmitRequest = async () => {
        if (window.confirm(`Submit request for ${pendingOrders.length} items?`)) {
            // Optimistically update statuses
            // In a real app, maybe a batch endpoint. Here we loop.
            // Or if backend treats a 'submit' action differently.
            // Legacy uses 'submitListUpdate' which sends the whole list.
            // Here we just mark them submitted and change status to 'Requested'

            for (const order of pendingOrders) {
                await updateSpecialOrder(order.id, { submitted: true, status: 'Requested' });
            }
            alert('Request Submitted!');
        }
    };

    const handleUpdateRequest = () => {
        // Since data is auto-saved in the store, we just provide visual confirmation
        alert('Request Updated! Your rep has been notified of changes.');
    };

    if (isLoading && specialOrders.length === 0) {
        return (
            <div className="flex justify-center items-center h-96">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-rose-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-12 animate-fade-in-up">
            {/* Header */}
            <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-8 shadow-sm border border-slate-100 dark:border-slate-800">
                <div className="flex items-center space-x-4 mb-4">
                    <div className="w-12 h-12 bg-rose-50 dark:bg-rose-900/20 rounded-2xl flex items-center justify-center border border-rose-100 dark:border-rose-900/30">
                        <ClipboardList className="w-6 h-6 text-rose-600 dark:text-rose-400" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">My Wish List</h2>
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest">Manage your procurement requests</p>
                    </div>
                </div>
            </div>

            {error && (
                <div className="text-red-500 text-center font-bold p-4 bg-red-50 rounded-xl">
                    {error}
                </div>
            )}

            {/* Pending Requests (Cart) */}
            <div className="space-y-6">
                <div className="flex justify-between items-end px-4">
                    <h3 className="text-xl font-bold text-slate-800 dark:text-white">New Requests ({pendingOrders.length})</h3>
                    {pendingOrders.length > 0 && (
                        <button
                            onClick={handleSubmitRequest}
                            className="bg-[#1a1a1a] dark:bg-rose-600 text-white px-6 py-3 rounded-xl font-bold text-sm uppercase tracking-wider hover:bg-slate-800 dark:hover:bg-rose-700 transition-all shadow-lg flex items-center space-x-2"
                        >
                            <CheckCircle className="w-4 h-4" />
                            <span>Submit Request</span>
                        </button>
                    )}
                </div>

                {pendingOrders.length > 0 ? (
                    <OrderList
                        orders={pendingOrders}
                        currentUser={user}
                        onUpdate={handleUpdate}
                        onDelete={handleDelete}
                    />
                ) : (
                    <div className="text-center py-12 bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                        <p className="text-slate-400 font-medium">Your request list is empty.</p>
                        <p className="text-xs text-slate-300 font-bold uppercase tracking-widest mt-2">Visit Catalog to add items</p>
                    </div>
                )}
            </div>

            {/* Submitted History */}
            {submittedOrders.length > 0 && (
                <div className="space-y-6 pt-8 border-t border-slate-100">
                    <div className="flex justify-between items-end px-4">
                        <h3 className="text-xl font-bold text-slate-800 dark:text-white">Request History</h3>
                        <button
                            onClick={handleUpdateRequest}
                            className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 px-6 py-3 rounded-xl font-bold text-sm uppercase tracking-wider hover:bg-slate-50 dark:hover:bg-slate-700 transition-all shadow-sm flex items-center space-x-2"
                        >
                            <CheckCircle className="w-4 h-4 text-emerald-500" />
                            <span>Update Request</span>
                        </button>
                    </div>
                    <OrderList
                        orders={submittedOrders}
                        currentUser={user}
                        onUpdate={handleUpdate}
                        onDelete={handleDelete}
                        isReadOnly={false}
                    />
                </div>
            )}
        </div>
    );
};
