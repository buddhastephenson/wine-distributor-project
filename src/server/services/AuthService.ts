import bcrypt from 'bcryptjs';
import nodemailer from 'nodemailer';
import User from '../models/User';
import { IUser, IAuthResponse } from '../../shared/types';

// Configure transporter
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false, // true for 465, false for other ports
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

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

            const hashedPassword = await bcrypt.hash(password, 10);

            const newUser = await User.create({
                id: `user-${Date.now()}`,
                username,
                password: hashedPassword,
                type: 'customer',
                email
            });

            // Mock Email - TODO: Switch to real email if desired
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
                username: { $regex: new RegExp(`^${username}$`, 'i') }
            });

            if (!user) {
                console.log(`Login Failed: User not found "${username}"`);
                return { success: false, error: 'Invalid credentials' };
            }

            const isMatch = await bcrypt.compare(password, user.password || '');
            if (!isMatch) {
                console.log(`Login Failed: Invalid password for "${username}"`);
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
                    isSuperAdmin: !!user.isSuperAdmin,
                    vendors: user.vendors
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

            const baseUrl = process.env.PUBLIC_URL || 'https://trade.aocwinecompany.com';
            const resetLink = `${baseUrl}/reset-password?token=${token}`;

            const mailOptions = {
                from: process.env.SMTP_FROM || '"AOC Wines" <noreply@aocwines.com>',
                to: email,
                subject: 'Password Reset Request',
                text: `You requested a password reset. Please click the following link to reset your password: ${resetLink}\n\nIf you did not request this, please ignore this email.`,
                html: `<p>You requested a password reset.</p><p>Please click the following link to reset your password: <a href="${resetLink}">${resetLink}</a></p><p>If you did not request this, please ignore this email.</p>`
            };

            try {
                if (process.env.SMTP_USER) {
                    await transporter.sendMail(mailOptions);
                    console.log(`Password reset email sent to ${email}`);
                } else {
                    console.log('SMTP not configured. Mocking email send.');
                    console.log(`Link: ${resetLink}`);
                }
            } catch (emailError) {
                console.error('Failed to send email:', emailError);
                // Don't fail the request, just log it. In prod, we might want to alert.
            }

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

            const hashedPassword = await bcrypt.hash(password, 10);
            user.password = hashedPassword;
            user.resetToken = undefined;
            user.resetTokenExpiry = undefined;
            await user.save();

            return { success: true, message: 'Password has been reset successfully.' };
        } catch (error) {
            throw error;
        }
    }

    async quickCreateCustomer(username: string): Promise<IAuthResponse> {
        if (!username) return { success: false, error: 'Username is required' };

        try {
            // Check if username exists
            const existingUser = await User.findOne({
                username: { $regex: new RegExp(`^${username}$`, 'i') }
            });

            if (existingUser) {
                return { success: false, error: 'Username already exists' };
            }

            // Generate dummy email to satisfy unique constraint
            // e.g. "My Restaurant" -> "MyRestaurant-1739071234567@placeholder.local"
            const sanitizedUsername = username.replace(/[^a-zA-Z0-9]/g, '');
            const dummyEmail = `${sanitizedUsername}-${Date.now()}@placeholder.local`;

            // Hash the username as password for quick create
            const hashedPassword = await bcrypt.hash(username, 10);

            const newUser = await User.create({
                id: `user-${Date.now()}`,
                username,
                password: hashedPassword,
                type: 'customer',
                email: dummyEmail
            });

            return {
                success: true,
                user: {
                    id: newUser.id,
                    username: newUser.username,
                    type: 'customer',
                    email: newUser.email
                }
            };
        } catch (error) {
            console.error('Quick Create Error:', error);
            throw error;
        }
    }

    async updatePassword(id: string, password: string) {
        const user = await User.findOne({ id });
        if (!user) {
            return { success: false, error: 'User not found' };
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        user.password = hashedPassword;
        await user.save();

        return { success: true, message: 'Password updated successfully' };
    }
}

export default new AuthService();
