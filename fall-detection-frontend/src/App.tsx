import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LoginPage } from './pages/LoginPage';
import { UsersPage } from './pages/UsersPage';
import { DevicePage } from './pages/DevicePage';
import { Dashboard } from './pages/Dashboard'; // Importa tu Dashboard
import { Navbar } from './components/Navbar';

const ProtectedRoute = ({ children, allowedRoles }: { children: React.ReactNode, allowedRoles: string[] }) => {
  const { user, loading } = useAuth(); // Necesitamos que tu Context devuelva 'loading'

  // Si aún está leyendo el localStorage, no redirigimos todavía
  if (loading) return <div className="p-10 text-center">Iniciando sistema...</div>;

  if (!user) return <Navigate to="/login" />;

  if (!allowedRoles.includes(user.role)) {
    return <Navigate to="/" />; // Si no tiene rol, al Dashboard principal [cite: 89]
  }

  return <>{children}</>;
};

// Componente para organizar el Layout
const AppContent = () => {
  const { user } = useAuth();

  return (
    <BrowserRouter>
      {/* Solo mostramos la Navbar si el usuario está autenticado [cite: 8, 83] */}
      {user && <Navbar />} 
      
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        {/* Ruta principal para todos los roles: Dashboard de caídas [cite: 84, 87, 91] */}
        <Route path="/" element={
          <ProtectedRoute allowedRoles={['ADMIN', 'CUIDADOR', 'USUARIO']}>
            <Dashboard />
          </ProtectedRoute>
        } />

        {/* Rutas exclusivas para ADMIN: Lo que hizo Pablo [cite: 32, 68, 69] */}
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