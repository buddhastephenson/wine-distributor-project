import React from 'react';
import { Link } from 'react-router-dom';
import { Card } from '../shared/Card';
import { Users, Package, FileText, AlertCircle } from 'lucide-react';

interface StatsProps {
    userCount: number;
    productCount: number;
    orderCount: number;
    pendingCount: number;
}

export const DashboardStats: React.FC<StatsProps> = ({ userCount, productCount, orderCount, pendingCount }) => {
    const stats = [
        { name: 'Total Users', value: userCount, icon: <Users size={24} className="text-blue-500" />, link: '/admin/users', action: 'Manage Users' },
        { name: 'Active Products', value: productCount, icon: <Package size={24} className="text-green-500" />, link: '/catalog', action: 'View Catalog' },
        { name: 'Special Orders', value: orderCount, icon: <FileText size={24} className="text-purple-500" />, link: '/orders', action: 'Review Orders' },
        { name: 'Pending Admin', value: pendingCount, icon: <AlertCircle size={24} className="text-orange-500" />, link: '/orders', action: 'Review Pending' },
    ];

    return (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {stats.map((item) => (
                <Link key={item.name} to={item.link} className="block group">
                    <Card className="flex items-center p-4 transition-all duration-200 hover:shadow-md hover:ring-2 hover:ring-rose-500/20 cursor-pointer relative overflow-hidden">
                        <div className="flex-shrink-0 p-3 bg-gray-50 rounded-full group-hover:bg-white transition-colors">
                            {item.icon}
                        </div>
                        <div className="ml-5 w-0 flex-1">
                            <dl>
                                <dt className="text-sm font-medium text-gray-500 truncate group-hover:text-rose-600 transition-colors">{item.name}</dt>
                                <dd className="text-lg font-semibold text-gray-900 group-hover:text-rose-700 transition-colors">{item.value}</dd>
                                <dd className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1 group-hover:text-rose-500 transition-colors">
                                    {item.action} &rarr;
                                </dd>
                            </dl>
                        </div>
                    </Card>
                </Link>
            ))}
        </div>
    );
};
