import React from 'react';
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
        { name: 'Total Users', value: userCount, icon: <Users size={24} className="text-blue-500" /> },
        { name: 'Active Products', value: productCount, icon: <Package size={24} className="text-green-500" /> },
        { name: 'Special Orders', value: orderCount, icon: <FileText size={24} className="text-purple-500" /> },
        { name: 'Pending Admin', value: pendingCount, icon: <AlertCircle size={24} className="text-orange-500" /> },
    ];

    return (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {stats.map((item) => (
                <Card key={item.name} className="flex items-center p-4">
                    <div className="flex-shrink-0 p-3 bg-gray-50 rounded-full">
                        {item.icon}
                    </div>
                    <div className="ml-5 w-0 flex-1">
                        <dl>
                            <dt className="text-sm font-medium text-gray-500 truncate">{item.name}</dt>
                            <dd className="text-lg font-semibold text-gray-900">{item.value}</dd>
                        </dl>
                    </div>
                </Card>
            ))}
        </div>
    );
};
