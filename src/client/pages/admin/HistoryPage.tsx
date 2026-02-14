import React, { useState, useEffect } from 'react';
import { specialOrderApi } from '../../services/api';
import { ISpecialOrder, ORDER_STATUS } from '../../../shared/types';
import { AdminLayout } from '../../components/layouts/AdminLayout';
import { Button } from '../../components/shared/Button';
import { Input } from '../../components/shared/Input';
import { Card } from '../../components/shared/Card';
import { Download, Search, Filter } from 'lucide-react';
import * as XLSX from 'xlsx';

export const HistoryPage: React.FC = () => {
    const [orders, setOrders] = useState<ISpecialOrder[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);

    const fetchHistory = async () => {
        setIsLoading(true);
        try {
            const params: any = {};
            if (startDate) params.startDate = startDate;
            if (endDate) params.endDate = endDate;
            if (selectedStatuses.length > 0) params.status = selectedStatuses.join(',');

            const response = await specialOrderApi.getHistory(params);
            setOrders(response.data);
        } catch (error) {
            console.error('Failed to fetch history', error);
        } finally {
            setIsLoading(false);
        }
    };

    // Initial load
    useEffect(() => {
        fetchHistory();
    }, []);

    const handleStatusToggle = (status: string) => {
        if (selectedStatuses.includes(status)) {
            setSelectedStatuses(selectedStatuses.filter(s => s !== status));
        } else {
            setSelectedStatuses([...selectedStatuses, status]);
        }
    };

    const handleExport = () => {
        const data = orders.map(order => ({
            'Order ID': order.id,
            'Date': new Date(order.createdAt || order.uploadDate || '').toLocaleDateString(),
            'Customer': order.username,
            'Product': order.productName,
            'Producer': order.producer,
            'Vintage': order.vintage,
            'Size': order.bottleSize,
            'Pack': order.packSize,
            'Cases': order.cases,
            'Bottles': order.bottles,
            'Price (Case)': order.fobCasePrice,
            'Status': order.status,
            'Admin Notes': order.adminNotes
        }));

        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Order History");
        XLSX.writeFile(workbook, `Order_History_${new Date().toISOString().split('T')[0]}.xlsx`);
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-900">Historical Order Report</h1>
                <Button onClick={handleExport} disabled={orders.length === 0} className="flex items-center">
                    <Download size={18} className="mr-2" />
                    Export to Excel
                </Button>
            </div>

            {/* Filters */}
            <Card className="p-4">
                <div className="flex flex-col md:flex-row gap-4 items-end">
                    <Input
                        label="Start Date"
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                    />
                    <Input
                        label="End Date"
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                    />
                    <div className="flex-grow">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Status Filter</label>
                        <div className="flex flex-wrap gap-2">
                            {Object.values(ORDER_STATUS).map(status => (
                                <button
                                    key={status}
                                    onClick={() => handleStatusToggle(status)}
                                    className={`px-3 py-1 rounded-full text-xs font-medium border ${selectedStatuses.includes(status)
                                        ? 'bg-indigo-100 text-indigo-800 border-indigo-200'
                                        : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                                        }`}
                                >
                                    {status}
                                </button>
                            ))}
                        </div>
                    </div>
                    <Button onClick={fetchHistory} isLoading={isLoading}>
                        <Search size={18} className="mr-2" />
                        Run Report
                    </Button>
                </div>
            </Card>

            {/* Results Table */}
            <Card>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {orders.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                                        No orders found for the selected criteria.
                                    </td>
                                </tr>
                            ) : (
                                orders.map((order) => (
                                    <tr key={order.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {new Date(order.createdAt || order.uploadDate || '').toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {order.username}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            <div className="font-medium">{order.productName}</div>
                                            <div className="text-gray-500">{order.producer} ({order.vintage})</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {order.cases > 0 ? `${order.cases} cs` : `${order.bottles} btls`}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                                                    ${order.status === 'Delivered' ? 'bg-green-100 text-green-800' :
                                                    order.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                                                        'bg-gray-100 text-gray-800'}`}>
                                                {order.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
};

