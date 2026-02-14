import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import { Input } from '../../components/shared/Input';
import { Button } from '../../components/shared/Button';
import { Card } from '../../components/shared/Card';

export const SignupPage: React.FC = () => {
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        confirmPassword: ''
    });
    const { signup, isLoading, error } = useAuthStore();
    const navigate = useNavigate();

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.id]: e.target.value });
    };

    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (formData.password !== formData.confirmPassword) {
            alert("Passwords don't match");
            return;
        }

        await signup({
            username: formData.username,
            email: formData.email,
            password: formData.password
        });

        const { isAuthenticated, error } = useAuthStore.getState();
        if (isAuthenticated) {
            const { user } = useAuthStore.getState();
            if (user?.type === 'admin') {
                navigate('/admin');
            } else {
                navigate('/catalog');
            }
        } else if (!error) {
            // Success but not authenticated -> Pending
            setSuccessMessage('Account created successfully! Your account is pending administrator approval. You will be notified once approved.');
            setFormData({ username: '', email: '', password: '', confirmPassword: '' });
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8">
                <div>
                    <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                        Request an Account
                    </h2>
                </div>
                <Card className="mt-8">
                    {successMessage ? (
                        <div className="bg-green-50 border-l-4 border-green-400 p-4">
                            <div className="flex">
                                <div className="ml-3">
                                    <h3 className="text-sm font-medium text-green-800">Registration Successful</h3>
                                    <div className="mt-2 text-sm text-green-700">
                                        <p>{successMessage}</p>
                                    </div>
                                    <div className="mt-4">
                                        <Link to="/login" className="text-sm font-medium text-green-600 hover:text-green-500">
                                            Return to Login
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <form className="space-y-6" onSubmit={handleSubmit}>
                            {error && (
                                <div className="bg-red-50 border-l-4 border-red-400 p-4">
                                    <div className="flex">
                                        <div className="ml-3">
                                            <p className="text-sm text-red-700">{error}</p>
                                        </div>
                                    </div>
                                </div>
                            )}
                            <Input
                                label="Username"
                                id="username"
                                type="text"
                                required
                                value={formData.username}
                                onChange={handleChange}
                            />
                            <Input
                                label="Email Address"
                                id="email"
                                type="email"
                                required
                                value={formData.email}
                                onChange={handleChange}
                            />
                            <Input
                                label="Password"
                                id="password"
                                type="password"
                                required
                                value={formData.password}
                                onChange={handleChange}
                            />
                            <Input
                                label="Confirm Password"
                                id="confirmPassword"
                                type="password"
                                required
                                value={formData.confirmPassword}
                                onChange={handleChange}
                            />

                            <div>
                                <Button type="submit" className="w-full" isLoading={isLoading}>
                                    Create Account
                                </Button>
                            </div>
                        </form>
                    )}
                    <div className="mt-6 text-center">
                        <p className="text-sm text-gray-600">
                            Already have an account?{' '}
                            <Link to="/login" className="font-medium text-indigo-600 hover:text-indigo-500">
                                Sign in
                            </Link>
                        </p>
                    </div>
                </Card>
            </div>
        </div>
    );
};
