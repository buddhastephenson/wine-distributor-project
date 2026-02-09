import React, { useState } from 'react';
import { IUser } from '../../../shared/types'; // Correct relative path
import { Button } from '../shared/Button';
import { Edit2, Lock, Unlock, Trash2, UserCheck, Search, Key } from 'lucide-react';
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

    // Filter and Sort Users
    const filteredUsers = users
        .filter(user =>
            user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
            user.email.toLowerCase().includes(searchQuery.toLowerCase())
        )
        .sort((a, b) => a.username.localeCompare(b.username));

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

    const handleDelete = async (userId: string) => {
        if (!window.confirm('Are you sure you want to delete this user?')) return;
        setIsLoading(userId);
        try {
            await userApi.delete(userId);
            onRefresh();
        } catch (error) {
            console.error('Failed to delete user', error);
        } finally {
            setIsLoading(null);
        }
    };

    const [showVendorModal, setShowVendorModal] = useState(false);
    const [selectedUserForVendor, setSelectedUserForVendor] = useState<IUser | null>(null);
    const [selectedVendors, setSelectedVendors] = useState<string[]>([]);
    const [availableVendors, setAvailableVendors] = useState<string[]>([]); // Should fetch from product store

    // Fetch vendors on mount or when opening modal
    //Ideally this should come from a store or props to avoid prop drilling or extra fetches
    // For now, let's assume we can pass them in or fetch them.
    // Let's use useProductStore if available in this context?
    // Or just simple hardcoded list for now based on known suppliers?
    // Better: Fetch products to derive unique suppliers.

    const handlePromote = async (user: IUser) => {
        if (!window.confirm(`Are you sure you want to promote ${user.username} to Admin?`)) return;
        setIsLoading(user.id);
        try {
            await userApi.updateRole(user.id, 'admin'); // Default to full admin first? Or ask?
            // Actually request implies upgrading to Rep (Admin) or Vendor (Limited Admin)
            // Let's just make them Admin for now.
            onRefresh();
        } catch (error) {
            console.error('Failed to promote user', error);
        } finally {
            setIsLoading(null);
        }
    };

    const [vendorInput, setVendorInput] = useState('');

    const handleManageVendors = (user: IUser) => {
        setSelectedUserForVendor(user);
        setVendorInput((user.vendors || []).join(', '));
        setShowVendorModal(true);
    };

    const saveVendorAssignment = async () => {
        if (!selectedUserForVendor) return;
        setIsLoading(selectedUserForVendor.id);

        // Parse input on save
        const updatedVendors = vendorInput.split(',').map(s => s.trim()).filter(Boolean);

        try {
            await userApi.updateRole(selectedUserForVendor.id, 'admin', updatedVendors);
            setShowVendorModal(false);
            onRefresh();
        } catch (error) {
            console.error('Failed to update vendors', error);
        } finally {
            setIsLoading(null);
        }
    };

    // Helper to toggle vendor selection
    const toggleVendor = (vendor: string) => {
        // Legacy or unused? The modal uses text input now.
        // Keeping logic just in case but modifying to work with string input if needed? 
        // Actually this was for checkboxes. Let's ignore or update if used.
        // It's not used in current modal render.
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
                <Button onClick={() => setShowQuickAddModal(true)}>
                    + Add Customer
                </Button>
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

            {/* Vendor Assignment Modal */}
            {
                showVendorModal && selectedUserForVendor && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                        <div className="bg-white p-6 rounded-lg w-96 max-h-[80vh] overflow-y-auto">
                            <h3 className="text-lg font-bold mb-4">Assign Vendors to {selectedUserForVendor.username}</h3>
                            <p className="text-sm text-gray-500 mb-4">Select vendors this user is allowed to manage.</p>

                            <div className="space-y-2 mb-6">
                                <div className="text-xs text-slate-500">
                                    Enter exact Supplier names from the catalog, separated by commas.
                                    <br />Example: <em>Rosenthal Wine Merchant, Bon Vivant Imports</em>
                                </div>
                                <textarea
                                    className="w-full border rounded p-2 text-sm"
                                    rows={4}
                                    value={vendorInput}
                                    onChange={(e) => setVendorInput(e.target.value)}
                                />
                            </div>

                            <div className="flex justify-end space-x-2">
                                <Button variant="secondary" onClick={() => setShowVendorModal(false)}>Cancel</Button>
                                <Button onClick={saveVendorAssignment}>Save</Button>
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
                                                {user.type}
                                                {user.isSuperAdmin && ' (Super)'}
                                                {user.vendors && user.vendors.length > 0 && ' (Vendor)'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {user.accessRevoked ? (
                                                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                                                    Revoked
                                                </span>
                                            ) : (
                                                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                                    Active
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            {isSuperAdmin && (
                                                <>
                                                    {user.type === 'customer' && (
                                                        <button
                                                            onClick={() => handlePromote(user)}
                                                            disabled={isLoading === user.id}
                                                            className="text-indigo-600 hover:text-indigo-900 mr-4 font-bold"
                                                        >
                                                            Promote
                                                        </button>
                                                    )}
                                                    {user.type === 'admin' && (
                                                        <button
                                                            onClick={() => handleManageVendors(user)}
                                                            className="text-blue-600 hover:text-blue-900 mr-4 font-bold"
                                                        >
                                                            Vendors
                                                        </button>
                                                    )}

                                                    <button
                                                        onClick={() => handlePasswordResetClick(user)}
                                                        className="text-amber-600 hover:text-amber-900 mr-4"
                                                        title="Reset Password"
                                                    >
                                                        <Key size={18} />
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
                                                        onClick={() => handleDelete(user.id)}
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
