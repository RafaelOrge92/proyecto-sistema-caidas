import { Navigate, Outlet } from 'react-router-dom';

interface ProtectedRouteProps {
  allowedRoles?: Array<'ADMIN' | 'CUIDADOR' | 'USUARIO'>;
}

const ProtectedRoute = ({ allowedRoles }: ProtectedRouteProps) => {
  const token = localStorage.getItem('token');
  // Aquí podrías decodificar el JWT para sacar el rol real
  const userRole = localStorage.getItem('userRole') as 'ADMIN' | 'CUIDADOR' | 'USUARIO'; 

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(userRole)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;