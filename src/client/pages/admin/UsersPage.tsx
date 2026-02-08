import React, { useEffect, useState } from 'react';
import { UserTable } from '../../components/admin/UserTable';
import { IUser } from '../../../shared/types';
import { userApi } from '../../services/api';
import { useAuthStore } from '../../store/useAuthStore';
import { Loader2 } from 'lucide-react';

export const UsersPage: React.FC = () => {
    const [users, setUsers] = useState<IUser[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchUsers = async () => {
        setIsLoading(true);
        try {
            const response = await userApi.getAll();
            setUsers(response.data);
        } catch (error) {
            console.error('Failed to fetch users', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="animate-spin text-gray-500" size={32} />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-semibold text-gray-900">User Management</h1>
                {/* <Button>Add User</Button> */}
            </div>
            <UserTable
                users={users}
                onRefresh={fetchUsers}
                onImpersonate={(user) => {
                    useAuthStore.getState().impersonate(user);
                    window.location.href = '/catalog'; // Force redirect to catalog
                }}
            />
        </div>
    );
};
