import User from '../models/User';
import bcrypt from 'bcryptjs';
import { IUser } from '../../shared/types';

class UserService {
    async getAllUsers(): Promise<IUser[]> {
        return await User.find({}, '-password -__v');
    }

    async getUserById(id: string): Promise<IUser | null> {
        return await User.findOne({ id }, '-password -__v');
    }

    async updateUserRole(id: string, type: 'admin' | 'customer' | 'vendor', vendors?: string[], isSuperAdmin: boolean = false): Promise<IUser | null> {
        const updateData: any = { type, isSuperAdmin };
        if (vendors) {
            updateData.vendors = vendors;
        } else if (type === 'customer') {
            updateData.vendors = [];
        }
        return await User.findOneAndUpdate({ id }, updateData, { new: true });
    }

    async toggleAccess(id: string, accessRevoked: boolean): Promise<IUser | null> {
        const user = await User.findOne({ id });
        if (!user) return null;

        if (user.username === 'treys') {
            throw new Error('Access cannot be revoked for primary administrator "treys"');
        }

        user.accessRevoked = accessRevoked;
        return await user.save();
    }

    async updateUsername(id: string, username: string): Promise<IUser | null> {
        const existing = await User.findOne({ username: { $regex: new RegExp(`^${username}$`, 'i') } });
        if (existing) {
            throw new Error('Username already exists');
        }
        return await User.findOneAndUpdate({ id }, { username }, { new: true });
    }

    async updatePassword(id: string, password: string): Promise<IUser | null> {
        const hashedPassword = await bcrypt.hash(password, 10);
        return await User.findOneAndUpdate({ id }, { password: hashedPassword }, { new: true });
    }

    async deleteUser(id: string): Promise<boolean> {
        const user = await User.findOne({ id });
        if (!user) return false;

        if (user.username === 'treys') {
            throw new Error('Primary administrator "treys" cannot be deleted');
        }

        await User.findOneAndDelete({ id });
        return true;
    }

    async assignSupplier(supplierName: string, vendorId?: string): Promise<{ success: boolean; message: string }> {
        // 1. Remove this supplier from ALL vendors to ensure exclusivity
        await User.updateMany(
            { vendors: supplierName },
            { $pull: { vendors: supplierName } }
        );

        // 2. If a vendorId is provided, add it to that vendor
        if (vendorId) {
            await User.findOneAndUpdate(
                { id: vendorId },
                { $addToSet: { vendors: supplierName } }
            );
            return { success: true, message: `Assigned "${supplierName}" to vendor.` };
        }

        return { success: true, message: `Unassigned "${supplierName}".` };
    }
}

export default new UserService();
