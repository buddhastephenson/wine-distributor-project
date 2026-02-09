import React from 'react';
import { Sidebar } from './Sidebar';
import { useAuthStore } from '../../store/useAuthStore';
import { useNavigate, Link } from 'react-router-dom';

interface AdminLayoutProps {
    children: React.ReactNode;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
    const navigate = useNavigate();

    return (
        <div className="flex h-screen bg-gray-100">
            <Sidebar />
            <div className="flex-1 flex flex-col overflow-hidden">
                <header className="bg-white shadow">
                    <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
                        <Link to="/admin">
                            <h1 className="text-2xl font-bold text-gray-900 hover:text-indigo-600 transition-colors cursor-pointer">Admin Dashboard</h1>
                        </Link>
                        <div className="flex items-center space-x-4">
                            {useAuthStore.getState().originalUser && (
                                <button
                                    onClick={() => {
                                        useAuthStore.getState().stopImpersonating();
                                        navigate('/admin');
                                    }}
                                    className="text-sm font-medium text-red-600 hover:text-red-800 underline"
                                >
                                    Stop Impersonating
                                </button>
                            )}
                            <span className="text-sm font-medium text-gray-700">Admin User</span>
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
