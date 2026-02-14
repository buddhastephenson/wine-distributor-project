import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import { LayoutDashboard, Package, Users, FileText, Settings, LogOut, Upload, History } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { useUIStore } from '../../store/useUIStore';

export const Sidebar: React.FC = () => {
    const { logout, user } = useAuthStore();
    const { isSidebarOpen } = useUIStore();

    if (!isSidebarOpen) return null;

    const isSuperAdmin = user?.isSuperAdmin || ['Trey', 'Matt Cory', 'treystephenson'].includes(user?.username || '');
    const isVendor = user?.type === 'vendor';

    const navItems = [
        // Dashboard: Admin (Rep/Super) gets /admin, Vendor gets /vendor
        { name: 'Dashboard', icon: <LayoutDashboard size={20} />, path: isVendor ? '/vendor' : '/admin' },

        // Products: Admin (Rep/Super) gets /admin/products, Vendor gets /vendor/products
        { name: 'Products', icon: <Package size={20} />, path: isVendor ? '/vendor/products' : '/admin/products' },

        // Import: Admin (Super) or Vendor. Reps (Admin type but not super) can also import? 
        // User didn't explicitly forbid Reps from importing, just said "Exceptions of (a) access to Settings ... (b) management of Users".
        // So Reps can import.
        { name: 'Import', icon: <Upload size={20} />, path: isVendor ? '/vendor/upload' : '/admin/import' },

        // Users: Admin (Rep/Super). Reps need this for Impersonation, even if they can't "manage" users.
        ...(!isVendor ? [{ name: 'Users', icon: <Users size={20} />, path: '/admin/users' }] : []),

        // Orders: Admin (Rep/Super) AND Vendor (scoped)
        // Vendors should see orders now.
        { name: 'Orders', icon: <FileText size={20} />, path: isVendor ? '/vendor/orders' : '/admin/orders' },

        // History: Admin (Rep/Super)
        ...(!isVendor ? [{ name: 'Order History', icon: <History size={20} />, path: '/admin/history' }] : []),

        // Settings: Super Admin only
        ...(isSuperAdmin && !isVendor ? [{ name: 'Settings', icon: <Settings size={20} />, path: '/admin/settings' }] : []),
    ];

    return (
        <div className="flex flex-col w-64 bg-gray-900 h-screen text-white transition-all duration-300">
            <div className="flex items-center justify-center h-16 border-b border-gray-800">
                <Link to={user?.type === 'vendor' ? '/vendor' : '/admin'} className="text-xl font-bold hover:text-indigo-400 transition-colors">
                </Link>
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
