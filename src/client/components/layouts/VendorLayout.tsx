import React from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import { useNavigate, Link, Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';

interface VendorLayoutProps {
    children: React.ReactNode;
}

export const VendorLayout: React.FC<VendorLayoutProps> = ({ children }) => {
    const navigate = useNavigate();
    const { user, logout } = useAuthStore();

    return (
        <div className="flex h-screen bg-gray-100">
            <Sidebar />
            <div className="flex-1 flex flex-col overflow-hidden">
                <header className="bg-white shadow">
                    <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
                        <Link to="/vendor">
                            <h1 className="text-2xl font-bold text-gray-900 hover:text-indigo-600 transition-colors cursor-pointer">Vendor Dashboard</h1>
                        </Link>
                        <div className="flex items-center space-x-4">
                            <div className="flex items-center space-x-3">
                                <span className="text-sm font-medium text-gray-700">
                                    {user?.username || 'Vendor'}
                                </span>
                                <button
                                    onClick={() => {
                                        logout();
                                        navigate('/login');
                                    }}
                                    className="text-sm font-medium text-gray-500 hover:text-gray-800"
                                >
                                    Logout
                                </button>
                            </div>
                        </div>
                    </div>
                </header>
                <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100">
                    <div className="container mx-auto px-6 py-8">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
};
