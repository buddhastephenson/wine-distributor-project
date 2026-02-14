import React, { useState } from 'react';
import { IUser } from '../../../shared/types'; // Correct relative path
import { Button } from '../shared/Button';
import { ConfirmationModal } from '../shared/ConfirmationModal';
import { Edit2, Lock, Unlock, Trash2, UserCheck, Search, Key, Check } from 'lucide-react';
import { userApi } from '../../services/api';
import { useAuthStore } from '../../store/useAuthStore';

interface UserTableProps {
    users: IUser[];
    onRefresh: () => void;
    onImpersonate?: (user: IUser) => void;
}

export const UserTable: React.FC<UserTableProps> = ({ users, onRefresh, onImpersonate }) => {
    const { user: currentUser } = useAuthStore();
    const [isLoading, setIsLoading] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    const isSuperAdmin = currentUser?.isSuperAdmin || ['Trey', 'Matt Cory', 'treystephenson'].includes(currentUser?.username || '');

    const [showRevoked, setShowRevoked] = useState(false);

    // Filter and Sort Users
    // Prioritize PENDING users at the top
    const filteredUsers = users
        .filter(user => {
            const matchesSearch = user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
                user.email.toLowerCase().includes(searchQuery.toLowerCase());

            // If showRevoked is false, hide revoked users
            if (!showRevoked && user.accessRevoked) return false;

            return matchesSearch;
        })
        .sort((a, b) => {
            // Pending users first
            if (a.status === 'pending' && b.status !== 'pending') return -1;
            if (a.status !== 'pending' && b.status === 'pending') return 1;
            return a.username.localeCompare(b.username);
        });

    const handleToggleAccess = async (user: IUser) => {
        setIsLoading(user.id);
        try {
            await userApi.toggleAccess(user.id, !user.accessRevoked);
            onRefresh();
        } catch (error) {
            console.error('Failed to toggle access', error);
        } finally {
            setIsLoading(null);
        }
    };

    const handleApproveUser = async (user: IUser) => {
        setIsLoading(user.id);
        try {
            await userApi.updateStatus(user.id, 'active');
            onRefresh();
        } catch (error) {
            console.error('Failed to approve user', error);
            alert('Failed to approve user');
        } finally {
            setIsLoading(null);
        }
    };

    // Role Management Modal State
    const [showRoleModal, setShowRoleModal] = useState(false);
    const [selectedUserForRole, setSelectedUserForRole] = useState<IUser | null>(null);

    // Delete Confirmation Modal State
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [userToDelete, setUserToDelete] = useState<IUser | null>(null);

    const handleDeleteClick = (user: IUser) => {
        console.log('Delete requested for:', user);
        setUserToDelete(user);
        setShowDeleteModal(true);
    };


    const confirmDelete = async () => {
        if (!userToDelete) return;
        setIsLoading(userToDelete.id);

        try {
            await userApi.delete(userToDelete.id);
            setShowDeleteModal(false);
            setUserToDelete(null);
            onRefresh();
        } catch (error) {
            console.error('Failed to delete user', error);
            alert('Failed to delete user');
        } finally {
            setIsLoading(null);
        }
    };
    const [selectedRoleType, setSelectedRoleType] = useState<'customer' | 'admin' | 'vendor'>('customer');
    const [vendorListInput, setVendorListInput] = useState('');

    const handleEditRole = (user: IUser) => {
        setSelectedUserForRole(user);

        // Determine current role state
        if (user.type === 'customer') {
            setSelectedRoleType('customer');
            setVendorListInput('');
        } else if (user.type === 'admin') {
            if (user.vendors && user.vendors.length > 0) {
                setSelectedRoleType('vendor');
                setVendorListInput(user.vendors.join(', '));
            } else {
                setSelectedRoleType('admin');
                setVendorListInput('');
            }
        }

        setShowRoleModal(true);
    };

    const saveRoleConfig = async () => {
        if (!selectedUserForRole) return;
        setIsLoading(selectedUserForRole.id);

        try {
            let type: 'customer' | 'admin' = 'customer';
            let vendors: string[] = [];

            if (selectedRoleType === 'customer') {
                type = 'customer';
                vendors = [];
            } else if (selectedRoleType === 'admin') {
                type = 'admin';
                vendors = [];
            } else if (selectedRoleType === 'vendor') {
                type = 'admin';
                // Auto-assign the username as the vendor/supplier
                vendors = [selectedUserForRole.username];
            }

            await userApi.updateRole(selectedUserForRole.id, type, vendors, selectedUserForRole.isSuperAdmin);
            setShowRoleModal(false);
            onRefresh();
        } catch (error) {
            console.error('Failed to update role', error);
            alert('Failed to update user role');
        } finally {
            setIsLoading(null);
        }
    };

    // Quick Add Modal State
    const [showQuickAddModal, setShowQuickAddModal] = useState(false);
    const [newUsername, setNewUsername] = useState('');

    const handleQuickAdd = async () => {
        if (!newUsername.trim()) return;
        setIsLoading('new-user');
        try {
            await userApi.quickCreate(newUsername);
            setShowQuickAddModal(false);
            setNewUsername('');
            onRefresh();
        } catch (error: any) {
            console.error('Failed to create user', error);
            alert(error.response?.data?.error || 'Failed to create user');
        } finally {
            setIsLoading(null);
        }
    };

    // Password Reset Modal State
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [selectedUserForPassword, setSelectedUserForPassword] = useState<IUser | null>(null);
    const [newPassword, setNewPassword] = useState('');

    const handlePasswordResetClick = (user: IUser) => {
        setSelectedUserForPassword(user);
        setNewPassword('');
        setShowPasswordModal(true);
    };

    const submitPasswordReset = async () => {
        if (!selectedUserForPassword || !newPassword) return;
        setIsLoading(selectedUserForPassword.id);
        try {
            await userApi.updatePassword(selectedUserForPassword.id, newPassword);
            alert(`Password for ${selectedUserForPassword.username} has been updated.`);
            setShowPasswordModal(false);
        } catch (error) {
            console.error('Failed to reset password', error);
            alert('Failed to update password');
        } finally {
            setIsLoading(null);
        }
    };

    return (
        <div className="flex flex-col">
            <div className="flex flex-col sm:flex-row justify-between items-center mb-4 px-6 lg:px-8 gap-4">
                <div className="relative w-full sm:w-64">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search size={18} className="text-gray-400" />
                    </div>
                    <input
                        type="text"
                        placeholder="Search users..."
                        className="pl-10 pr-4 py-2 border rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-rose-500"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <div className="flex items-center space-x-4">
                    <label className="flex items-center space-x-2 text-sm text-gray-600">
                        <input
                            type="checkbox"
                            checked={showRevoked}
                            onChange={(e) => setShowRevoked(e.target.checked)}
                            className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        <span>Show Disabled Users</span>
                    </label>
                    <Button onClick={() => setShowQuickAddModal(true)}>
                        + Add Customer
                    </Button>
                </div>
            </div>

            {/* Quick Add Modal */}
            {showQuickAddModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                    <div className="bg-white p-6 rounded-lg w-96">
                        <h3 className="text-lg font-bold mb-4">Quick Add Customer</h3>
                        <p className="text-sm text-gray-500 mb-4">
                            Create a customer account instantly. Password will be set to the username.
                            A placeholder email will be generated.
                        </p>
                        <input
                            type="text"
                            placeholder="Username / Establishment"
                            className="w-full border rounded p-2 mb-4"
                            value={newUsername}
                            onChange={(e) => setNewUsername(e.target.value)}
                        />
                        <div className="flex justify-end space-x-2">
                            <Button variant="secondary" onClick={() => setShowQuickAddModal(false)}>Cancel</Button>
                            <Button onClick={handleQuickAdd} disabled={isLoading === 'new-user'}>
                                {isLoading === 'new-user' ? 'Creating...' : 'Create'}
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Role Management Modal */}
            {
                showRoleModal && selectedUserForRole && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                        <div className="bg-white p-6 rounded-lg w-96 max-h-[90vh] overflow-y-auto">
                            <h3 className="text-lg font-bold mb-4">Edit Role for {selectedUserForRole.username}</h3>

                            <div className="space-y-4 mb-6">
                                <label className="flex items-start space-x-3 p-3 border rounded-lg cursor-pointer hover:bg-slate-50">
                                    <input
                                        type="radio"
                                        name="role"
                                        checked={selectedRoleType === 'customer'}
                                        onChange={() => setSelectedRoleType('customer')}
                                        className="mt-1"
                                    />
                                    <div>
                                        <div className="font-bold text-slate-800">Customer</div>
                                        <div className="text-xs text-slate-500">Standard user. Can view catalog and Request items.</div>
                                    </div>
                                </label>

                                <label className="flex items-start space-x-3 p-3 border rounded-lg cursor-pointer hover:bg-slate-50">
                                    <input
                                        type="radio"
                                        name="role"
                                        checked={selectedRoleType === 'admin'}
                                        onChange={() => setSelectedRoleType('admin')}
                                        className="mt-1"
                                    />
                                    <div>
                                        <div className="font-bold text-purple-800">Admin (Staff)</div>
                                        <div className="text-xs text-slate-500">Full access to manage products, orders, and customers.</div>

                                        {/* Super Admin Toggle - Only visible to Super Admins */}
                                        {selectedRoleType === 'admin' && isSuperAdmin && (
                                            <label className="flex items-center space-x-2 mt-2 pt-2 border-t border-gray-100">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedUserForRole?.isSuperAdmin || false}
                                                    onChange={(e) => setSelectedUserForRole(prev => prev ? { ...prev, isSuperAdmin: e.target.checked } : null)}
                                                    className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                                                />
                                                <span className="text-xs font-bold text-purple-900">Make Super Admin?</span>
                                            </label>
                                        )}
                                    </div>
                                </label>

                                <label className="flex items-start space-x-3 p-3 border rounded-lg cursor-pointer hover:bg-slate-50">
                                    <input
                                        type="radio"
                                        name="role"
                                        checked={selectedRoleType === 'vendor'}
                                        onChange={() => setSelectedRoleType('vendor')}
                                        className="mt-1"
                                    />
                                    <div>
                                        <div className="font-bold text-indigo-800">Vendor (Restricted)</div>
                                        <div className="text-xs text-slate-500">
                                            Restricted Admin. <strong>{selectedUserForRole.username}</strong> will be the only accessible Supplier.
                                        </div>
                                    </div>
                                </label>
                            </div>

                            <div className="flex justify-end space-x-2">
                                <Button variant="secondary" onClick={() => setShowRoleModal(false)}>Cancel</Button>
                                <Button onClick={saveRoleConfig}>Save Role</Button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Password Reset Modal */}
            {
                showPasswordModal && selectedUserForPassword && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                        <div className="bg-white p-6 rounded-lg w-96">
                            <h3 className="text-lg font-bold mb-4">Reset Password for {selectedUserForPassword.username}</h3>
                            <p className="text-sm text-gray-500 mb-4">Enter a new password for this user.</p>
                            <input
                                type="text"
                                placeholder="New Password"
                                className="w-full border rounded p-2 mb-4"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                            />
                            <div className="flex justify-end space-x-2">
                                <Button variant="secondary" onClick={() => setShowPasswordModal(false)}>Cancel</Button>
                                <Button onClick={submitPasswordReset}>Update Password</Button>
                            </div>
                        </div>
                    </div>
                )
            }

            <ConfirmationModal
                isOpen={showDeleteModal}
                onClose={() => setShowDeleteModal(false)}
                onConfirm={confirmDelete}
                title="Delete User"
                message={`Are you sure you want to delete ${userToDelete?.username}? This action cannot be undone.`}
                confirmLabel="Delete"
                isLoading={isLoading === userToDelete?.id}
                variant="danger"
            />

            <div className="-my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
                <div className="py-2 align-middle inline-block min-w-full sm:px-6 lg:px-8">
                    <div className="shadow overflow-hidden border-b border-gray-200 sm:rounded-lg">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Username
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Type
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Status
                                    </th>
                                    <th scope="col" className="relative px-6 py-3">
                                        <span className="sr-only">Actions</span>
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {filteredUsers.map((user) => (
                                    <tr key={user.id}>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-gray-900">{user.username}</div>
                                            <div className="text-sm text-gray-500">{user.email}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${user.type === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'}`}>
                                                {user.type === 'admin' && user.vendors && user.vendors.length > 0 ? 'Vendor' : user.type}
                                                {user.isSuperAdmin && ' (Super)'}
                                            </span>
                                            {user.type === 'admin' && user.vendors && user.vendors.length > 0 && (
                                                <div className="text-xs text-gray-500 mt-1 max-w-[150px] truncate" title={user.vendors.join(', ')}>
                                                    {user.vendors.join(', ')}
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {user.status === 'pending' && (
                                                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                                                    Pending
                                                </span>
                                            )}
                                            {user.status === 'rejected' && (
                                                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                                                    Rejected
                                                </span>
                                            )}
                                            {(user.status === 'active' || (!user.status && !user.accessRevoked)) && (
                                                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                                    Active
                                                </span>
                                            )}
                                            {user.accessRevoked && (
                                                <span className="ml-1 px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                                                    Locked
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            {/* Approve Button for Pending Users - Available to all Admins/Reps */}
                                            {currentUser?.type === 'admin' && user.status === 'pending' && (
                                                <button
                                                    onClick={() => handleApproveUser(user)}
                                                    disabled={isLoading === user.id}
                                                    className="text-green-600 hover:text-green-900 mr-4 font-bold flex items-center float-left"
                                                    title="Approve User"
                                                >
                                                    <Check size={18} className="mr-1" /> Approve
                                                </button>
                                            )}

                                            {/* Password Reset - Admins can reset Customers; Super Amins can reset anyone */}
                                            {currentUser?.type === 'admin' && (isSuperAdmin || user.type === 'customer') && (
                                                <button
                                                    onClick={() => handlePasswordResetClick(user)}
                                                    className="text-amber-600 hover:text-amber-900 mr-4"
                                                    title="Reset Password"
                                                >
                                                    <Key size={18} />
                                                </button>
                                            )}

                                            {isSuperAdmin && (
                                                <>
                                                    <button
                                                        onClick={() => handleEditRole(user)}
                                                        disabled={isLoading === user.id}
                                                        className="text-indigo-600 hover:text-indigo-900 mr-4"
                                                        title="Edit Role & Permissions"
                                                    >
                                                        <Edit2 size={18} />
                                                    </button>

                                                    <button
                                                        onClick={() => handleToggleAccess(user)}
                                                        disabled={isLoading === user.id}
                                                        className={`text-indigo-600 hover:text-indigo-900 mr-4 ${isLoading === user.id ? 'opacity-50' : ''}`}
                                                        title={user.accessRevoked ? "Restore Access" : "Revoke Access"}
                                                    >
                                                        {user.accessRevoked ? <Unlock size={18} /> : <Lock size={18} />}
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteClick(user)}
                                                        disabled={isLoading === user.id}
                                                        className="text-red-600 hover:text-red-900"
                                                        title="Delete User"
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                </>
                                            )}
                                            {user.type !== 'admin' && (
                                                <button
                                                    onClick={() => onImpersonate && onImpersonate(user)}
                                                    className="text-blue-600 hover:text-blue-900 ml-4"
                                                    title="Login As User"
                                                >
                                                    <UserCheck size={18} />
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};
