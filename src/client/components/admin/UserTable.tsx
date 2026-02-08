import React, { useState } from 'react';
import { IUser } from '../../../shared/types'; // Correct relative path
import { Button } from '../shared/Button';
import { Edit2, Lock, Unlock, Trash2, UserCheck } from 'lucide-react';
import { userApi } from '../../services/api';

interface UserTableProps {
    users: IUser[];
    onRefresh: () => void;
    onImpersonate?: (user: IUser) => void;
}

export const UserTable: React.FC<UserTableProps> = ({ users, onRefresh, onImpersonate }) => {
    const [isLoading, setIsLoading] = useState<string | null>(null);

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

    return (
        <div className="flex flex-col">
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
                                        Email
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
                                {users.map((user) => (
                                    <tr key={user.id}>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-gray-900">{user.username}</div>
                                            <div className="text-sm text-gray-500">{user.type}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-500">{user.email}</div>
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
                                            <button
                                                onClick={() => handleToggleAccess(user)}
                                                disabled={isLoading === user.id}
                                                className={`text-indigo-600 hover:text-indigo-900 mr-4 ${isLoading === user.id ? 'opacity-50' : ''}`}
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
                                            <button
                                                onClick={() => onImpersonate && onImpersonate(user)}
                                                className="text-blue-600 hover:text-blue-900 ml-4"
                                                title="Login As User"
                                            >
                                                <UserCheck size={18} />
                                            </button>
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
