import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { UsersPage } from './pages/UsersPage';
import { DevicePage } from './pages/DevicePage';
import { EventsPage } from './pages/EventsPage';
import { PatientsPage } from './pages/PatientsPage';
import { UserDashboard } from './pages/UserDashboard';
import { MemberEventsPage } from './pages/MemberEventsPage';
import { Dashboard } from './pages/Dashboard';
import Admin from './pages/Admin';
import { Navbar } from './components/Navbar';
import { ChatbotWidget } from './components/ChatbotWidget';

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
  <div className="flex flex-col min-h-screen bg-bg-primary text-text-primary">
    <LandingNavbar />
    <main className="grow">
      {children}
    </main>
    <LandingFooter />
  </div>
);

const APP_TITLE = 'FallGuard';

const normalizePath = (pathname: string) => {
  const base = pathname.trim().toLowerCase();
  if (!base) return '/';
  if (base === '/') return '/';
  return base.endsWith('/') ? base.slice(0, -1) : base;
};

const getDocumentTitle = (pathname: string, search: string): string => {
  const normalizedPath = normalizePath(pathname);
  const tab = new URLSearchParams(search).get('tab')?.toLowerCase();

  if (normalizedPath === '/admin' && tab) {
    const adminTabTitle: Record<string, string> = {
      home: 'Consola de Control',
      users: 'Usuarios',
      devices: 'Dispositivos',
      podium: 'Podium',
      graficas: 'Graficas'
    };
    return `${adminTabTitle[tab] || 'Administracion'} | ${APP_TITLE}`;
  }

  const routeTitle: Record<string, string> = {
    '/': 'Inicio',
    '/about': 'Nosotros',
    '/contact': 'Contacto',
    '/login': 'Iniciar Sesion',
    '/register': 'Registro',
    '/dashboard': 'Dashboard',
    '/admin': 'Administracion',
    '/admin/users': 'Usuarios',
    '/admin/devices': 'Dispositivos',
    '/admin/events': 'Eventos',
    '/admin/patients': 'Pacientes',
    '/my-protection': 'Mi Proteccion',
    '/member/events': 'Mis Eventos'
  };

  return `${routeTitle[normalizedPath] || 'Plataforma'} | ${APP_TITLE}`;
};

const DocumentTitleManager = () => {
  const location = useLocation();

  useEffect(() => {
    document.title = getDocumentTitle(location.pathname, location.search);
  }, [location.pathname, location.search]);

  return null;
};

const AppContent = () => {
  const { user } = useAuth();

  return (
    <BrowserRouter>
      <DocumentTitleManager />
      {user && <Navbar />} 
      {user && <ChatbotWidget />}
      
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

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

        <Route path="/admin/events" element={
          <ProtectedRoute allowedRoles={['ADMIN']}>
            <EventsPage />
          </ProtectedRoute>
        } />

        <Route path="/admin/patients" element={
          <ProtectedRoute allowedRoles={['ADMIN']}>
            <PatientsPage />
          </ProtectedRoute>
        } />

        {/* Dashboard de usuario */}
        <Route path="/my-protection" element={
          <ProtectedRoute allowedRoles={['MEMBER', 'USUARIO', 'CUIDADOR']}>
            <UserDashboard />
          </ProtectedRoute>
        } />

        <Route path="/member/events" element={
          <ProtectedRoute allowedRoles={['MEMBER', 'USUARIO', 'CUIDADOR']}>
            <MemberEventsPage />
          </ProtectedRoute>
        } />

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
};

function App() {
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || 'YOUR_GOOGLE_CLIENT_ID';

  return (
    <ThemeProvider>
      <GoogleOAuthProvider clientId={googleClientId}>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </GoogleOAuthProvider>
    </ThemeProvider>
  );
}

export default App;
