import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/auth.store';
import { Layout } from './components/Layout/Layout';
import { LoginPage } from './pages/Auth/LoginPage';
import { RegisterPage } from './pages/Auth/RegisterPage';
import { HomePage } from './pages/Home/HomePage';
import { LibraryPage } from './pages/Library/LibraryPage';
import { PlansPage } from './pages/Plans/PlansPage';
import { CertificatesPage } from './pages/Certificates/CertificatesPage';
import { AccountPage } from './pages/Account/AccountPage';
import { AdminDashboard } from './pages/Admin/AdminDashboard';
import { AdminUsers } from './pages/Admin/AdminUsers';
import { AdminCertificates } from './pages/Admin/AdminCertificates';
import { AdminRepositories } from './pages/Admin/AdminRepositories';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((s) => s.user);
  if (!user) return <Navigate to="/login" replace />;
  if (!user.isAdmin) return <Navigate to="/" replace />;
  return <>{children}</>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return !isAuthenticated ? <>{children}</> : <Navigate to="/" replace />;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
        <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />

        {/* Private routes with layout */}
        <Route path="/" element={<Layout><HomePage /></Layout>} />
        <Route path="/library" element={<Layout><LibraryPage /></Layout>} />
        <Route path="/plans" element={<Layout><PlansPage /></Layout>} />
        <Route path="/certificates" element={<PrivateRoute><Layout><CertificatesPage /></Layout></PrivateRoute>} />
        <Route path="/account" element={<PrivateRoute><Layout><AccountPage /></Layout></PrivateRoute>} />

        {/* Admin routes */}
        <Route path="/admin" element={<AdminRoute><Layout><AdminDashboard /></Layout></AdminRoute>} />
        <Route path="/admin/users" element={<AdminRoute><Layout><AdminUsers /></Layout></AdminRoute>} />
        <Route path="/admin/certificates" element={<AdminRoute><Layout><AdminCertificates /></Layout></AdminRoute>} />
        <Route path="/admin/repositories" element={<AdminRoute><Layout><AdminRepositories /></Layout></AdminRoute>} />

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
