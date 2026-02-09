import React, { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useProductStore } from '../../store/useProductStore';
import { useAuthStore } from '../../store/useAuthStore';
import { OrderList } from '../../components/orders/OrderList';
import { ClipboardList, CheckCircle, Download, Users, ChevronRight } from 'lucide-react';
import { exportOrdersToExcel } from '../../utils/export';

export const OrdersPage: React.FC = () => {
    const { specialOrders, fetchSpecialOrders, updateSpecialOrder, deleteSpecialOrder, isLoading, error } = useProductStore();
    const { user } = useAuthStore();
    const [selectedCustomer, setSelectedCustomer] = useState<string | null>(null);

    useEffect(() => {
        if (user?.type === 'admin') {
            fetchSpecialOrders(); // Fetch all for admin
        } else {
            fetchSpecialOrders(user?.username);
        }
    }, [fetchSpecialOrders, user?.username, user?.type]);

    const handleUpdate = (id: string, updates: any) => {
        updateSpecialOrder(id, updates);
    };

    const handleDelete = (id: string) => {
        deleteSpecialOrder(id);
    };

    // Separate into "Cart" (Pending Submission) and "History" (Submitted)
    const pendingOrders = useMemo(() => {
        return specialOrders.filter(o => !o.submitted).sort((a, b) => {
            const dateA = new Date(a.createdAt || a.uploadDate || 0).getTime();
            const dateB = new Date(b.createdAt || b.uploadDate || 0).getTime();
            return dateB - dateA;
        });
    }, [specialOrders]);

    const submittedOrders = useMemo(() => {
        return specialOrders.filter(o => o.submitted).sort((a, b) => {
            const dateA = new Date(a.createdAt || a.uploadDate || 0).getTime();
            const dateB = new Date(b.createdAt || b.uploadDate || 0).getTime();
            return dateB - dateA;
        });
    }, [specialOrders]);

    // Admin: Get Unique Customers
    const customers = useMemo(() => {
        if (user?.type !== 'admin') return [];
        const allOrders = [...pendingOrders, ...submittedOrders];
        const unique = Array.from(new Set(allOrders.map(o => o.username || 'Unknown')));
        return unique.sort();
    }, [pendingOrders, submittedOrders, user?.type]);

    // Default select first customer if none selected
    useEffect(() => {
        if (user?.type === 'admin' && customers.length > 0 && !selectedCustomer) {
            setSelectedCustomer(customers[0]);
        }
    }, [customers, selectedCustomer, user?.type]);


    // Filtered Lists based on Role/Selection
    const displayedPending = useMemo(() => {
        if (user?.type !== 'admin') return pendingOrders;
        if (!selectedCustomer) return [];
        return pendingOrders.filter(o => (o.username || 'Unknown') === selectedCustomer);
    }, [pendingOrders, selectedCustomer, user?.type]);

    const displayedSubmitted = useMemo(() => {
        if (user?.type !== 'admin') return submittedOrders;
        if (!selectedCustomer) return [];
        return submittedOrders.filter(o => (o.username || 'Unknown') === selectedCustomer);
    }, [submittedOrders, selectedCustomer, user?.type]);


    const location = useLocation();
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    useEffect(() => {
        if (location.state?.successMessage) {
            setSuccessMessage(location.state.successMessage);
            window.history.replaceState({}, document.title);
        }
    }, [location]);

    const handleSubmitRequest = async () => {
        for (const order of displayedPending) {
            await updateSpecialOrder(order.id, { submitted: true, status: 'Requested' });
        }
        setSuccessMessage('Request Submitted!');
        window.scrollTo(0, 0);
    };

    const handleUpdateRequest = () => {
        setSuccessMessage('Request Updated! Your rep has been notified of changes.');
        window.scrollTo(0, 0);
    };

    const handleExport = () => {
        // Export ALL orders (or maybe just the filtered ones? Requirement: "Review Orders box should just be an Excel export of all orders")
        // Assuming "all orders" means everything visible to admin.
        const ordersToExport = user?.type === 'admin' ? [...pendingOrders, ...submittedOrders] : [...displayedPending, ...displayedSubmitted];
        exportOrdersToExcel(ordersToExport, `AOC_Orders_${new Date().toISOString().split('T')[0]}.xlsx`);
    };

    if (isLoading && specialOrders.length === 0) {
        return (
            <div className="flex justify-center items-center h-96">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-rose-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fade-in-up h-[calc(100vh-100px)] flex flex-col">
            {/* Header */}
            <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-6 shadow-sm border border-slate-100 dark:border-slate-800 flex justify-between items-center shrink-0">
                <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-rose-50 dark:bg-rose-900/20 rounded-2xl flex items-center justify-center border border-rose-100 dark:border-rose-900/30">
                        <ClipboardList className="w-6 h-6 text-rose-600 dark:text-rose-400" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
                            {user?.type === 'admin' ? 'Order Management' : 'My Wish List'}
                        </h2>
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest">
                            {user?.type === 'admin' ? 'Review & Process Requests' : 'Manage your procurement requests'}
                        </p>
                    </div>
                </div>

                {user?.type === 'admin' && (
                    <button
                        onClick={handleExport}
                        className="flex items-center space-x-2 bg-emerald-600 text-white px-4 py-2 rounded-xl font-bold text-sm hover:bg-emerald-700 transition-colors shadow-sm"
                    >
                        <Download className="w-4 h-4" />
                        <span>Export Excel</span>
                    </button>
                )}
            </div>

            {successMessage && (
                <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-900/30 rounded-xl p-4 flex items-center justify-between animate-fade-in-up shrink-0">
                    <div className="flex items-center space-x-3">
                        <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                        <span className="font-bold text-emerald-800 dark:text-emerald-200">{successMessage}</span>
                    </div>
                    <button onClick={() => setSuccessMessage(null)} className="text-emerald-600 hover:text-emerald-800 dark:text-emerald-400 dark:hover:text-emerald-200 font-bold text-sm">Dismiss</button>
                </div>
            )}

            {error && (
                <div className="text-red-500 text-center font-bold p-4 bg-red-50 rounded-xl shrink-0">
                    {error}
                </div>
            )}

            {/* Main Content Area */}
            <div className="flex-1 flex gap-6 min-h-0">
                {/* Left Sidebar (Customers) - Only for Admin */}
                {user?.type === 'admin' && (
                    <div className="w-1/4 bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800 overflow-hidden flex flex-col shadow-sm">
                        <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
                            <h3 className="font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2">
                                <Users className="w-4 h-4" />
                                Customers ({customers.length})
                            </h3>
                        </div>
                        <div className="flex-1 overflow-y-auto p-2 space-y-1">
                            {customers.map(customer => {
                                const hasPending = pendingOrders.some(o => (o.username || 'Unknown') === customer);
                                return (
                                    <button
                                        key={customer}
                                        onClick={() => setSelectedCustomer(customer)}
                                        className={`w-full text-left px-4 py-3 rounded-xl transition-all flex items-center justify-between group ${selectedCustomer === customer
                                                ? 'bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-300 font-bold'
                                                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                                            }`}
                                    >
                                        <div className="flex items-center gap-2">
                                            <span>{customer}</span>
                                            {hasPending && <span className="w-2 h-2 rounded-full bg-rose-500"></span>}
                                        </div>
                                        {selectedCustomer === customer && <ChevronRight className="w-4 h-4" />}
                                    </button>
                                );
                            })}
                            {customers.length === 0 && (
                                <div className="p-4 text-center text-slate-400 text-sm">No customers found.</div>
                            )}
                        </div>
                    </div>
                )}

                {/* Right Content (Orders) */}
                <div className={`flex-1 overflow-y-auto ${user?.type === 'admin' ? '' : 'w-full'}`}>
                    <div className="space-y-8 pb-10">
                        {/* Pending Requests */}
                        <div className="space-y-4">
                            <div className="flex justify-between items-end px-2">
                                <h3 className="text-xl font-bold text-slate-800 dark:text-white">
                                    {user?.type === 'admin' ? `Requests Needed: ${selectedCustomer || ''}` : `New Requests (${displayedPending.length})`}
                                </h3>
                                {displayedPending.length > 0 && user?.type !== 'admin' && (
                                    <button
                                        onClick={handleSubmitRequest}
                                        className="bg-[#1a1a1a] dark:bg-rose-600 text-white px-6 py-3 rounded-xl font-bold text-sm uppercase tracking-wider hover:bg-slate-800 dark:hover:bg-rose-700 transition-all shadow-lg flex items-center space-x-2"
                                    >
                                        <CheckCircle className="w-4 h-4" />
                                        <span>Submit Request</span>
                                    </button>
                                )}
                            </div>

                            {displayedPending.length > 0 ? (
                                <OrderList
                                    orders={displayedPending}
                                    currentUser={user}
                                    onUpdate={handleUpdate}
                                    onDelete={handleDelete}
                                />
                            ) : (
                                <div className="text-center py-10 bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                                    <p className="text-slate-400 font-medium">No pending requests.</p>
                                </div>
                            )}
                        </div>

                        {/* Submitted History */}
                        {displayedSubmitted.length > 0 && (
                            <div className="space-y-6 pt-8 border-t border-slate-100">
                                <div className="flex justify-between items-end px-2">
                                    <h3 className="text-xl font-bold text-slate-800 dark:text-white">Request History</h3>
                                </div>
                                <OrderList
                                    orders={displayedSubmitted}
                                    currentUser={user}
                                    onUpdate={handleUpdate}
                                    onDelete={handleDelete}
                                    isReadOnly={false}
                                />
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
