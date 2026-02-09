import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LoginPage } from './pages/auth/LoginPage';
import { SignupPage } from './pages/auth/SignupPage';
import { AdminLayout } from './components/layouts/AdminLayout';
import { CustomerLayout } from './components/layouts/CustomerLayout';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { UsersPage } from './pages/admin/UsersPage';
import { CatalogPage } from './pages/catalog/CatalogPage';
import { OrdersPage } from './pages/orders/OrdersPage';
import { SettingsPage } from './pages/admin/SettingsPage';
import { ImportPage } from './pages/admin/ImportPage';
import { useAuthStore } from './store/useAuthStore';

// Protected Route Wrapper
const ProtectedRoute: React.FC<{ children: React.ReactNode; roles?: string[] }> = ({ children, roles }) => {
    const { isAuthenticated, user } = useAuthStore();

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    if (roles && user && !roles.includes(user.type)) {
        return <Navigate to="/" replace />; // Unauthorized
    }

    return <>{children}</>;
};

const RootRedirect: React.FC = () => {
    const { isAuthenticated, user } = useAuthStore();

    if (!isAuthenticated) return <Navigate to="/login" replace />;

    if (user?.type === 'admin') {
        return <Navigate to="/admin" replace />;
    }

    return <Navigate to="/catalog" replace />;
};

const App: React.FC = () => {
    const checkSession = useAuthStore(state => state.verifySession);

    useEffect(() => {
        checkSession();
    }, [checkSession]);

    return (
        <BrowserRouter>
            <Routes>
                {/* Public Routes */}
                <Route path="/login" element={<LoginPage />} />
                <Route path="/signup" element={<SignupPage />} />
                <Route path="/forgot-password" element={<div>Forgot Password (TODO)</div>} />

                {/* Root Redirect */}
                <Route path="/" element={<RootRedirect />} />

                {/* Admin Routes */}
                <Route
                    path="/admin/*"
                    element={
                        <ProtectedRoute roles={['admin']}>
                            <AdminLayout>
                                <Routes>
                                    <Route path="/" element={<AdminDashboard />} />
                                    <Route path="/users" element={<UsersPage />} />
                                    <Route path="/products" element={<CatalogPage />} />
                                    <Route path="/orders" element={<OrdersPage />} />
                                    <Route path="/import" element={<ImportPage />} />
                                    <Route path="/settings" element={<SettingsPage />} />
                                    <Route path="*" element={<Navigate to="/admin" replace />} />
                                </Routes>
                            </AdminLayout>
                        </ProtectedRoute>
                    }
                />

                {/* Customer Routes */}
                <Route
                    path="/*"
                    element={
                        <ProtectedRoute roles={['customer', 'admin']}>
                            <CustomerLayout>
                                <Routes>
                                    <Route path="/catalog" element={<CatalogPage />} />
                                    <Route path="/orders" element={<OrdersPage />} />
                                    <Route path="*" element={<Navigate to="/catalog" replace />} />
                                </Routes>
                            </CustomerLayout>
                        </ProtectedRoute>
                    }
                />
            </Routes>
        </BrowserRouter>
    );
};

export default App;
