import React from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import { useNavigate, Link, Outlet } from 'react-router-dom';
import { LayoutDashboard, Upload, LogOut, User } from 'lucide-react';

interface VendorLayoutProps {
    children: React.ReactNode;
}

export const VendorLayout: React.FC<VendorLayoutProps> = ({ children }) => {
    const navigate = useNavigate();
    const { user, logout } = useAuthStore();

    return (
        <div className="flex h-screen bg-gray-50 dark:bg-slate-900">
            {/* Sidebar */}
            <aside className="w-64 bg-white dark:bg-slate-800 shadow-lg flex flex-col">
                <div className="p-6 border-b border-gray-100 dark:border-slate-700">
                    <h1 className="text-xl font-bold text-indigo-600 dark:text-indigo-400">Vendor Portal</h1>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Manage Your Portfolio</p>
                </div>

                <nav className="flex-1 p-4 space-y-2">
                    <Link to="/vendor" className="flex items-center space-x-3 px-4 py-3 text-gray-700 dark:text-gray-200 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-lg transition-colors">
                        <LayoutDashboard size={20} />
                        <span className="font-medium">Dashboard</span>
                    </Link>
                    <Link to="/vendor/upload" className="flex items-center space-x-3 px-4 py-3 text-gray-700 dark:text-gray-200 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-lg transition-colors">
                        <Upload size={20} />
                        <span className="font-medium">Upload Portfolio</span>
                    </Link>
                </nav>

                <div className="p-4 border-t border-gray-100 dark:border-slate-700">
                    <div className="flex items-center space-x-3 px-4 py-3 text-gray-700 dark:text-gray-300">
                        <User size={20} />
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{user?.username}</p>
                            <p className="text-xs text-gray-500 truncate">Vendor Access</p>
                        </div>
                    </div>
                    <button
                        onClick={() => { logout(); navigate('/login'); }}
                        className="flex items-center space-x-3 px-4 py-3 w-full text-left text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-lg transition-colors mt-2"
                    >
                        <LogOut size={20} />
                        <span className="font-medium">Sign Out</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto p-8">
                <Outlet />
            </main>
        </div>
    );
};
