import User from '../models/User';
import { IUser, IAuthResponse } from '../../shared/types';

class AuthService {
    async signup(userData: Partial<IUser>): Promise<IAuthResponse> {
        const { username, password, email } = userData;

        if (!username || !password || !email) {
            return { success: false, error: 'Missing required fields' };
        }

        try {
            // Case-insensitive check for existing user
            const existingUser = await User.findOne({
                $or: [
                    { username: { $regex: new RegExp(`^${username}$`, 'i') } },
                    { email: { $regex: new RegExp(`^${email}$`, 'i') } }
                ]
            });

            if (existingUser) {
                console.log(`Signup Failed: Conflict with existing user: ${existingUser.username} (${existingUser.email})`);

                if (existingUser.email.toLowerCase() === email.toLowerCase() && existingUser.accessRevoked) {
                    return { success: false, error: 'This email is associated with a revoked account.' };
                }
                return { success: false, error: 'User or Email already exists' };
            }

            const newUser = await User.create({
                id: `user-${Date.now()}`,
                username,
                password, // TODO: Hash password
                type: 'customer',
                email
            });

            // Mock Email
            console.log(`\n--- WELCOME EMAIL SIMULATION ---`);
            console.log(`To: ${email}`);
            console.log(`Subject: Welcome to AOC Special Orders!`);
            console.log(`Content: Hello ${username}, your account has been created.`);
            console.log(`----------------------------------\n`);

            return {
                success: true,
                user: {
                    id: newUser.id,
                    username: newUser.username,
                    type: newUser.type as 'admin' | 'customer',
                    email: newUser.email
                }
            };
        } catch (error: any) {
            console.error('Signup Error:', error);
            if (error.code === 11000) {
                return { success: false, error: 'User or Email already exists (Duplicate Key)' };
            }
            throw error;
        }
    }

    async login(credentials: { username: string; password: string }): Promise<IAuthResponse> {
        const { username, password } = credentials;

        try {
            const user = await User.findOne({
                username: { $regex: new RegExp(`^${username}$`, 'i') },
                password // TODO: Hash check
            });

            if (!user) {
                console.log(`Login Failed: Invalid credentials for user "${username}"`);
                return { success: false, error: 'Invalid credentials' };
            }

            if (user.accessRevoked) {
                return { success: false, error: 'Access Revoked. Please contact administrator.' };
            }

            return {
                success: true,
                user: {
                    id: user.id,
                    username: user.username,
                    type: user.type as 'admin' | 'customer',
                    email: user.email,
                    isSuperAdmin: !!user.isSuperAdmin
                }
            };
        } catch (error) {
            throw error;
        }
    }


    async forgotPassword(email: string): Promise<{ success: boolean; message?: string; error?: string }> {
        try {
            const user = await User.findOne({ email });

            if (!user) {
                // Security: don't reveal existence
                return { success: true, message: 'If an account exists with this email, a reset link will be sent.' };
            }

            const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
            const expiry = Date.now() + 3600000; // 1 hour

            user.resetToken = token;
            user.resetTokenExpiry = expiry;
            await user.save();

            const resetLink = `http://localhost:3000/?token=${token}`;
            console.log(`\n--- PASSWORD RESET SIMULATION ---`);
            console.log(`To: ${email}`);
            console.log(`Link: ${resetLink}`);
            console.log(`----------------------------------\n`);

            return { success: true, message: 'If an account exists with this email, a reset link will be sent.' };
        } catch (error) {
            throw error;
        }
    }

    async resetPassword(token: string, password: string): Promise<{ success: boolean; message?: string; error?: string }> {
        try {
            const user = await User.findOne({
                resetToken: token,
                resetTokenExpiry: { $gt: Date.now() }
            });

            if (!user) {
                return { success: false, error: 'Invalid or expired reset token' };
            }

            user.password = password;
            user.resetToken = undefined;
            user.resetTokenExpiry = undefined;
            await user.save();

            return { success: true, message: 'Password has been reset successfully.' };
        } catch (error) {
            throw error;
        }
    }
}

export default new AuthService();
