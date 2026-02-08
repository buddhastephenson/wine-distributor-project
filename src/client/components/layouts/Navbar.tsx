import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { ShoppingCart, LogOut, User } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';

export const Navbar: React.FC = () => {
    const { logout, user, originalUser, stopImpersonating } = useAuthStore();
    const navigate = useNavigate();

    return (
        <nav className="bg-white shadow-sm border-b border-gray-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16">
                    <div className="flex">
                        <div className="flex-shrink-0 flex items-center">
                            <h1 className="text-xl font-bold text-gray-900">AOC</h1>
                        </div>
                        <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                            {/* Hide links if user is admin (unless impersonating, where user.type would be customer) */}
                            {user?.type !== 'admin' && (
                                <>
                                    <NavLink
                                        to="/catalog"
                                        className={({ isActive }) =>
                                            `inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${isActive
                                                ? 'border-indigo-500 text-gray-900'
                                                : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                                            }`
                                        }
                                    >
                                        Catalog
                                    </NavLink>
                                    <NavLink
                                        to="/orders"
                                        className={({ isActive }) =>
                                            `inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${isActive
                                                ? 'border-indigo-500 text-gray-900'
                                                : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                                            }`
                                        }
                                    >
                                        My Wish List
                                    </NavLink>
                                </>
                            )}
                        </div>
                    </div>
                    <div className="flex items-center space-x-4">
                        {originalUser && (
                            <button
                                onClick={() => {
                                    stopImpersonating();
                                    navigate('/admin');
                                }}
                                className="text-sm font-medium text-red-600 hover:text-red-800 border border-red-200 rounded px-2 py-1 bg-red-50"
                            >
                                Stop Impersonating
                            </button>
                        )}
                        <div className="flex items-center space-x-2">
                            <User size={20} className="text-gray-400" />
                            <span className="text-sm text-gray-700 hidden md:block">{user?.username}</span>
                        </div>
                        <button
                            onClick={logout}
                            className="text-gray-500 hover:text-red-600 transition-colors"
                            title="Logout"
                        >
                            <LogOut size={20} />
                        </button>
                    </div>
                </div>
            </div>
        </nav>
    );
};
