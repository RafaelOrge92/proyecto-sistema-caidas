import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LoginPage } from './pages/LoginPage';
import { UsersPage } from './pages/UsersPage';
import { DevicePage } from './pages/DevicePage';
import { Dashboard } from './pages/Dashboard';
import Admin from './pages/Admin';
import { Navbar } from './components/Navbar';

// Landing Imports
import LandingNavbar from './components/landing/LandingNavbar';
import LandingFooter from './components/landing/LandingFooter';
import Home from './pages/landing/Home';
import About from './pages/landing/About';
import Contact from './pages/landing/Contact';

const ProtectedRoute = ({ children, allowedRoles }: { children: React.ReactNode, allowedRoles: string[] }) => {
  const { user, loading } = useAuth();

  if (loading) return <div className="p-10 text-center">Iniciando sistema...</div>;

  if (!user) return <Navigate to="/login" />;

  if (!allowedRoles.includes(user.role)) {
    return <Navigate to="/" />;
  }

  return <>{children}</>;
};

const LandingLayout = ({ children }: { children: React.ReactNode }) => (
  <div className="flex flex-col min-h-screen bg-[#0F1419] text-[#F1F5F9]">
    <LandingNavbar />
    <main className="flex-grow">
      {children}
    </main>
    <LandingFooter />
  </div>
);

const AppContent = () => {
  const { user } = useAuth();

  return (
    <BrowserRouter>
      {user && <Navbar />} 
      
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        {/* Landing Pages */}
        <Route path="/" element={<LandingLayout><Home /></LandingLayout>} />
        <Route path="/About" element={<LandingLayout><About /></LandingLayout>} />
        <Route path="/contact" element={<LandingLayout><Contact /></LandingLayout>} />

        {/* Dashboard principal */}
        <Route path="/dashboard" element={
          <ProtectedRoute allowedRoles={['ADMIN', 'MEMBER']}>
            <Dashboard />
          </ProtectedRoute>
        } />

        {/* Panel de administración (nuevo) */}
        <Route path="/admin" element={
          <ProtectedRoute allowedRoles={['ADMIN']}>
            <Admin />
          </ProtectedRoute>
        } />

        {/* Rutas legadas (mantener por compatibilidad) */}
        <Route path="/admin/users" element={
          <ProtectedRoute allowedRoles={['ADMIN']}>
            <UsersPage />
          </ProtectedRoute>
        } />

        <Route path="/admin/devices" element={
          <ProtectedRoute allowedRoles={['ADMIN']}>
            <DevicePage />
          </ProtectedRoute>
        } />

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
};

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;