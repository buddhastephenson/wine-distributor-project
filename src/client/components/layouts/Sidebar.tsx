import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import { LayoutDashboard, Package, Users, FileText, Settings, LogOut, Upload } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { useUIStore } from '../../store/useUIStore';

export const Sidebar: React.FC = () => {
    const { logout, user } = useAuthStore();
    const { isSidebarOpen } = useUIStore();

    if (!isSidebarOpen) return null;

    const isSuperAdmin = user?.isSuperAdmin || ['Trey', 'Matt Cory', 'treystephenson'].includes(user?.username || '');

    const navItems = [
        { name: 'Dashboard', icon: <LayoutDashboard size={20} />, path: '/admin' },
        { name: 'Products', icon: <Package size={20} />, path: '/admin/products' },
        ...(isSuperAdmin ? [{ name: 'Import', icon: <Upload size={20} />, path: '/admin/import' }] : []),
        ...(isSuperAdmin ? [{ name: 'Users', icon: <Users size={20} />, path: '/admin/users' }] : []),
        { name: 'Orders', icon: <FileText size={20} />, path: '/admin/orders' },
        ...(isSuperAdmin ? [{ name: 'Settings', icon: <Settings size={20} />, path: '/admin/settings' }] : []),
    ];

    return (
        <div className="flex flex-col w-64 bg-gray-900 h-screen text-white transition-all duration-300">
            <div className="flex items-center justify-center h-16 border-b border-gray-800">
                <Link to="/admin" className="text-xl font-bold hover:text-indigo-400 transition-colors">AOC Admin</Link>
            </div>
            <nav className="flex-1 overflow-y-auto py-4">
                <ul className="space-y-1">
                    {navItems.map((item) => (
                        <li key={item.name}>
                            <NavLink
                                to={item.path}
                                end={item.path === '/admin'}
                                className={({ isActive }) =>
                                    `flex items-center px-6 py-3 hover:bg-gray-800 transition-colors ${isActive ? 'bg-gray-800 border-l-4 border-indigo-500' : ''
                                    }`
                                }
                            >
                                <span className="mr-3">{item.icon}</span>
                                {item.name}
                            </NavLink>
                        </li>
                    ))}
                </ul>
            </nav>
            <div className="p-4 border-t border-gray-800">
                {/* Logout moved to header */}
            </div>
        </div>
    );
};
