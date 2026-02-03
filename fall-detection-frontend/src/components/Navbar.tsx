import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const Navbar = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout(); // Borra localStorage [cite: 36]
        navigate('/login');
    };

    if (!user) return null; // No mostrar navbar si no está logueado

    return (
        <nav className="bg-blue-900 text-white p-4 flex justify-between items-center shadow-lg">
            <div className="flex gap-6 items-center">
                <span className="font-black text-xl tracking-tighter">FALL-DETECT</span>
                <Link to="/" className="hover:text-blue-300">Dashboard [cite: 91]</Link>
                
                {user.role === 'ADMIN' && (
                    <div className="flex gap-4 border-l pl-4 border-blue-700">
                        <Link to="/admin/users" className="hover:text-blue-300">Usuarios [cite: 32]</Link>
                        <Link to="/admin/devices" className="hover:text-blue-300">Dispositivos [cite: 32]</Link>
                    </div>
                )}
            </div>
            
            <div className="flex items-center gap-4">
                <span className="text-sm bg-blue-800 px-2 py-1 rounded">{user.role}</span>
                <button 
                    onClick={handleLogout}
                    className="bg-red-500 hover:bg-red-600 px-3 py-1 rounded text-sm transition"
                >
                    Salir
                </button>
            </div>
        </nav>
    );
};