import React from 'react';
import { useNavigate } from 'react-router-dom';
import { History } from 'lucide-react';
import { DashboardStats } from '../../components/admin/DashboardStats';
import { useProductStore } from '../../store/useProductStore';
// import { useOrderStore } from '../../store/useOrderStore'; // TODO
import { useAuthStore } from '../../store/useAuthStore'; // Maybe we need a user store for count?
import { userApi } from '../../services/api';

export const AdminDashboard: React.FC = () => {
    // In a real app, we'd fetch these stats from an API endpoint like /api/admin/stats
    // For now, let's just mock or fetch all lists (inefficient but works for small app)
    // We can use a local state for user count
    const [userCount, setUserCount] = React.useState(0);
    const { products, specialOrders, fetchProducts, fetchSpecialOrders } = useProductStore();
    const navigate = useNavigate();

    React.useEffect(() => {
        // Fetch users to get count
        userApi.getAll().then(res => {
            if (res.data) setUserCount(res.data.length);
        }).catch(console.error);
        fetchProducts();
        fetchSpecialOrders(); // Fetch all special orders
    }, [fetchProducts, fetchSpecialOrders]);

    const activeOrders = specialOrders.filter(o => !['Delivered', 'Out of Stock'].includes(o.status || ''));
    const pendingOrders = specialOrders.filter(o => o.submitted && (o.status === 'Requested' || !o.status));

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
            <DashboardStats
                userCount={userCount}
                productCount={products.length}
                orderCount={activeOrders.length}
                pendingCount={pendingOrders.length}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div
                    onClick={() => navigate('/admin/history')}
                    className="bg-white p-6 rounded-lg shadow cursor-pointer hover:shadow-md transition-shadow flex items-center space-x-4 border border-gray-100"
                >
                    <div className="p-3 bg-indigo-100 rounded-full text-indigo-600">
                        <History size={24} />
                    </div>
                    <div>
                        <h3 className="font-semibold text-gray-900">Historical Report</h3>
                        <p className="text-sm text-gray-500">View and export past orders</p>
                    </div>
                </div>
            </div>

            {/* Recent Activity or Quick Links could go here */}
        </div>
    );
};
