import React, { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useProductStore } from '../../store/useProductStore';
import { useAuthStore } from '../../store/useAuthStore';
import { OrderList } from '../../components/orders/OrderList';
import { ClipboardList, CheckCircle, Download, Users, ChevronRight, Upload, Trash2, Send } from 'lucide-react';
import { exportOrdersToExcel } from '../../utils/export';
import { ConfirmationModal } from '../../components/shared/ConfirmationModal';
import { userApi } from '../../services/api';
import { ORDER_STATUS, ISpecialOrder } from '../../../shared/types';

export const OrdersPage: React.FC = () => {
    const { specialOrders, fetchSpecialOrders, updateSpecialOrder, deleteSpecialOrder, bulkDeleteSpecialOrders, isLoading, error } = useProductStore();
    const { user } = useAuthStore();
    const [selectedCustomer, setSelectedCustomer] = useState<string | null>(null);
    const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);
    const [vendorMap, setVendorMap] = useState<Record<string, string>>({}); // valid map

    // Fetch users to map suppliers to vendors (Admin only)
    useEffect(() => {
        const fetchVendorMap = async () => {
            if (user?.type === 'admin') {
                try {
                    const response = await userApi.getAll();
                    // users are in response.data? No, api.ts says api.get<IUser[]>, so response.data is IUser[]
                    const users = response.data;
                    const map: Record<string, string> = {};
                    users.forEach(u => {
                        if (u.vendors && Array.isArray(u.vendors)) {
                            u.vendors.forEach(v => {
                                map[v] = u.username;
                            });
                        }
                    });
                    setVendorMap(map);
                } catch (err) {
                    console.error("Failed to fetch users for vendor map", err);
                }
            }
        };
        fetchVendorMap();
    }, [user?.type]);

    useEffect(() => {
        if (user?.type === 'admin' || user?.type === 'vendor') {
            fetchSpecialOrders(); // Fetch all (backend filters for vendor)
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

    const [searchQuery, setSearchQuery] = useState('');
    const isCustomerView = user?.type !== 'admin' && user?.type !== 'vendor';

    const STATUS_DISPLAY_ORDER = [
        ORDER_STATUS.PENDING,
        ORDER_STATUS.ON_PO,
        ORDER_STATUS.BOOKED_WITH_SUPPLIER,
        ORDER_STATUS.BACKORDERED,
        ORDER_STATUS.NOT_AVAILABLE,
        ORDER_STATUS.IN_STOCK,
    ];

    // All active (non-Delivered) orders, sorted by createdAt desc
    const activeOrders = useMemo(() => {
        return [...specialOrders]
            .filter(o => o.status !== ORDER_STATUS.DELIVERED)
            .sort((a, b) => {
                const dateA = new Date(a.createdAt || a.uploadDate || 0).getTime();
                const dateB = new Date(b.createdAt || b.uploadDate || 0).getTime();
                return dateB - dateA;
            });
    }, [specialOrders]);

    // Admin/Vendor: unique customer list from active orders
    const customers = useMemo(() => {
        if (user?.type !== 'admin' && user?.type !== 'vendor') return [];
        const unique = Array.from(new Set(activeOrders.map(o => o.username || 'Unknown')));
        const filtered = unique.filter(c => c.toLowerCase().includes(searchQuery.toLowerCase()));
        return filtered.sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));
    }, [activeOrders, user?.type, searchQuery]);

    // Orders to display — for customer it's all their active orders, for admin/vendor it's filtered by selected customer
    const displayedOrders = useMemo(() => {
        if (isCustomerView) return activeOrders;
        if (!selectedCustomer) return [];
        return activeOrders.filter(o => (o.username || 'Unknown') === selectedCustomer);
    }, [activeOrders, selectedCustomer, isCustomerView]);

    // Customer-only: unsubmitted orders for the submit button
    const unsubmittedOrders = useMemo(() => {
        return displayedOrders.filter(o => !o.submitted);
    }, [displayedOrders]);

    // Group displayed orders by status
    const groupedOrders = useMemo(() => {
        const groups: Record<string, ISpecialOrder[]> = {};
        for (const order of displayedOrders) {
            const status = order.status || 'Pending';
            if (!groups[status]) groups[status] = [];
            groups[status].push(order);
        }
        return STATUS_DISPLAY_ORDER
            .filter(s => groups[s]?.length > 0)
            .map(s => ({ status: s, orders: groups[s] }));
    }, [displayedOrders]);

    const location = useLocation();
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    useEffect(() => {
        if (location.state?.successMessage) {
            setSuccessMessage(location.state.successMessage);
            window.history.replaceState({}, document.title);
        }
        if (location.state?.highlightOrderId) {
            setTimeout(() => {
                const element = document.getElementById(`order-${location.state.highlightOrderId}`);
                if (element) {
                    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    element.classList.add('ring-2', 'ring-rose-500', 'ring-offset-2');
                    setTimeout(() => element.classList.remove('ring-2', 'ring-rose-500', 'ring-offset-2'), 3000);
                }
            }, 500);
            const state = { ...location.state };
            delete state.highlightOrderId;
            window.history.replaceState(state, document.title);
        }
    }, [location]);

    const handleSubmitRequest = async () => {
        for (const order of unsubmittedOrders) {
            await updateSpecialOrder(order.id, { submitted: true, status: 'Pending', adminUnseen: true });
        }
        setSuccessMessage('Request Submitted!');
        window.scrollTo(0, 0);
    };

    const handleExport = () => {
        // Export ALL orders (or maybe just the filtered ones? Requirement: "Review Orders box should just be an Excel export of all orders")
        // Assuming "all orders" means everything visible to admin.
        const ordersToExport = activeOrders;
        exportOrdersToExcel(ordersToExport, `AOC_Orders_${new Date().toISOString().split('T')[0]}.xlsx`, vendorMap);
    };

    const handleBulkDelete = () => {
        setIsBulkDeleteModalOpen(true);
    };

    const confirmBulkDelete = async () => {
        const idsToDelete = displayedOrders.map(o => o.id);
        await bulkDeleteSpecialOrders(idsToDelete);
        setIsBulkDeleteModalOpen(false);
        setSuccessMessage(`Deleted ${idsToDelete.length} orders.`);
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
                            {user?.type === 'admin'
                                ? (user.isSuperAdmin ? 'Order Management' : 'Rep Order Management')
                                : (user?.type === 'vendor' ? 'Vendor Orders' : 'My Orders')}
                        </h2>
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest">
                            {user?.type === 'admin' ? 'Review & Process Requests' : (user?.type === 'vendor' ? 'View orders for your products' : 'Manage your procurement requests')}
                        </p>
                    </div>
                </div>

                {user?.type === 'admin' && (
                    <div className="flex space-x-2">
                        <label className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-xl font-bold text-sm hover:bg-blue-700 transition-colors shadow-sm cursor-pointer">
                            <Upload className="w-4 h-4" />
                            <span>Import Statuses</span>
                            <input
                                type="file"
                                accept=".xlsx, .xls"
                                className="hidden"
                                onChange={async (e) => {
                                    const file = e.target.files?.[0];
                                    if (!file) return;

                                    try {
                                        const { read, utils } = await import('xlsx');
                                        const data = await file.arrayBuffer();
                                        const workbook = read(data);
                                        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
                                        const jsonData = utils.sheet_to_json(worksheet) as any[];

                                        const updates = jsonData
                                            .filter((row: any) => row['Order ID'] && row['Status'])
                                            .map((row: any) => ({
                                                id: row['Order ID'],
                                                status: row['Status']
                                            }));

                                        if (updates.length === 0) {
                                            alert('No valid rows found. Ensure "Order ID" and "Status" columns exist.');
                                            return;
                                        }

                                        await useProductStore.getState().batchUpdateStatus(updates);
                                        setSuccessMessage(`Successfully updated ${updates.length} orders.`);
                                        // window.location.reload(); // Or just let state update
                                    } catch (error) {
                                        console.error('Import Error:', error);
                                        alert('Failed to import statuses. Check console for details.');
                                    }
                                    // Reset input
                                    e.target.value = '';
                                }}
                            />
                        </label>
                        <button
                            onClick={handleExport}
                            className="flex items-center space-x-2 bg-emerald-600 text-white px-4 py-2 rounded-xl font-bold text-sm hover:bg-emerald-700 transition-colors shadow-sm"
                        >
                            <Download className="w-4 h-4" />
                            <span>Export Excel</span>
                        </button>
                    </div>
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
                {/* Left Sidebar (Customers) - Only for Admin and Vendor */}
                {(user?.type === 'admin' || user?.type === 'vendor') && (
                    <div className="w-1/4 bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800 overflow-hidden flex flex-col shadow-sm">
                        <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 space-y-3">
                            <h3 className="font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2">
                                <Users className="w-4 h-4" />
                                Customers ({customers.length})
                            </h3>
                            <input
                                type="text"
                                placeholder="Search customers..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                            />
                        </div>
                        <div className="flex-1 overflow-y-auto p-2 space-y-1">
                            {customers.map(customer => {
                                const hasUnseen = activeOrders.some(o => (o.username || 'Unknown') === customer && o.adminUnseen);
                                return (
                                    <button
                                        key={customer}
                                        onClick={() => setSelectedCustomer(customer)}
                                        className={`w-full text-left px-4 py-3 rounded-xl transition-all flex items-center justify-between group ${selectedCustomer === customer
                                            ? 'bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-300 font-bold'
                                            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                                            }`}
                                    >
                                        <div className="flex items-center gap-2 truncate">
                                            <span className="truncate">{customer}</span>
                                            {hasUnseen && <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0 animate-pulse"></span>}
                                        </div>
                                        {selectedCustomer === customer && <ChevronRight className="w-4 h-4 shrink-0" />}
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
                <div className={`flex-1 overflow-y-auto ${isCustomerView ? 'w-full' : ''}`}>
                    <div className="space-y-6 pb-10">
                        {/* Customer submit bar */}
                        {isCustomerView && unsubmittedOrders.length > 0 && (
                            <div className="flex justify-between items-center bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl px-6 py-4">
                                <p className="text-sm font-bold text-amber-800 dark:text-amber-200">
                                    You have {unsubmittedOrders.length} new item{unsubmittedOrders.length > 1 ? 's' : ''} not yet submitted to your rep.
                                </p>
                                <button
                                    onClick={handleSubmitRequest}
                                    className="bg-[#1a1a1a] dark:bg-rose-600 text-white px-6 py-3 rounded-xl font-bold text-sm uppercase tracking-wider hover:bg-slate-800 dark:hover:bg-rose-700 transition-all shadow-lg flex items-center space-x-2"
                                >
                                    <Send className="w-4 h-4" />
                                    <span>Submit Request</span>
                                </button>
                            </div>
                        )}

                        {/* Admin/Vendor: customer header with delete-all */}
                        {!isCustomerView && selectedCustomer && (
                            <div className="flex justify-between items-center px-2">
                                <h3 className={`text-xl font-bold ${displayedOrders.some(o => o.adminUnseen)
                                    ? 'text-rose-600 animate-pulse'
                                    : 'text-slate-800 dark:text-white'
                                    }`}>
                                    {selectedCustomer} ({displayedOrders.length})
                                </h3>
                                {user?.type === 'admin' && displayedOrders.length > 0 && (
                                    <button
                                        onClick={handleBulkDelete}
                                        className="bg-red-50 text-red-600 px-4 py-2 rounded-xl font-bold text-sm uppercase tracking-wider hover:bg-red-100 transition-colors shadow-sm flex items-center space-x-2 border border-red-200"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                        <span>Delete All</span>
                                    </button>
                                )}
                            </div>
                        )}

                        {/* Grouped orders by status */}
                        {groupedOrders.length > 0 ? (
                            groupedOrders.map(({ status, orders }) => (
                                <div key={status} className="space-y-3">
                                    <div className="flex items-center gap-3 px-2">
                                        <span className={`text-xs font-black uppercase tracking-widest px-3 py-1 rounded-full border ${
                                            status === ORDER_STATUS.PENDING ? 'bg-slate-50 text-slate-500 border-slate-200' :
                                            status === ORDER_STATUS.ON_PO ? 'bg-blue-50 text-blue-600 border-blue-200' :
                                            status === ORDER_STATUS.BOOKED_WITH_SUPPLIER ? 'bg-indigo-50 text-indigo-600 border-indigo-200' :
                                            status === ORDER_STATUS.BACKORDERED ? 'bg-amber-50 text-amber-600 border-amber-200' :
                                            status === ORDER_STATUS.NOT_AVAILABLE ? 'bg-rose-50 text-rose-600 border-rose-200' :
                                            status === ORDER_STATUS.IN_STOCK ? 'bg-emerald-50 text-emerald-600 border-emerald-200' :
                                            'bg-gray-50 text-gray-600 border-gray-200'
                                        }`}>
                                            {status}
                                        </span>
                                        <span className="text-xs font-bold text-slate-400">{orders.length} item{orders.length > 1 ? 's' : ''}</span>
                                    </div>
                                    <OrderList
                                        orders={orders}
                                        currentUser={user}
                                        onUpdate={handleUpdate}
                                        onDelete={handleDelete}
                                    />
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-10 bg-slate-50 dark:bg-slate-800/50 rounded-3xl border border-dashed border-slate-200 dark:border-slate-700">
                                <p className="text-slate-400 font-medium">
                                    {isCustomerView
                                        ? 'No orders yet. Add items from the catalog to get started.'
                                        : selectedCustomer
                                            ? 'No active orders for this customer.'
                                            : 'Select a customer to view their orders.'}
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            <ConfirmationModal
                isOpen={isBulkDeleteModalOpen}
                onClose={() => setIsBulkDeleteModalOpen(false)}
                onConfirm={confirmBulkDelete}
                title="Delete All Pending Requests?"
                message={`Are you sure you want to delete all ${displayedOrders.length} orders for ${selectedCustomer}? This action cannot be undone.`}
                confirmLabel="Delete All"
                variant="danger"
            />
        </div >
    );
};
