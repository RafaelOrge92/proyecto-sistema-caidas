import React, { useEffect, useState } from 'react';
import { AdminService } from '../services/adminService';
import { User } from '../types';
import { Search, UserPlus, MoreHorizontal, ShieldCheck } from 'lucide-react';
import { UserModal } from '../components/UserModal';

export const UsersPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => { loadUsers(); }, []);

  const loadUsers = async () => {
    try {
      const response = await AdminService.getUsers();
      setUsers(response.data);
    } finally { setLoading(false); }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto reveal">
      {/* Header Estilo Apple */}
      <header className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
        <div>
          <h1 className="text-5xl font-bold tracking-tight mb-2">Usuarios</h1>
          <p className="text-xl text-[var(--color-text-secondary)]">Gestiona el acceso y roles de tu equipo.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white px-6 py-3 rounded-full font-semibold transition-all shadow-lg flex items-center gap-2"
        >
          <UserPlus size={20} /> Nuevo Usuario
        </button>
      </header>

      {/* Barra de Búsqueda Minimalista */}
      <div className="relative mb-8">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
        <input 
          type="text" 
          placeholder="Buscar por nombre o email..." 
          className="w-full bg-[var(--color-bg-secondary)] border-none rounded-2xl py-4 pl-12 pr-6 focus:ring-2 focus:ring-[var(--color-primary)] transition-all outline-none text-lg"
        />
      </div>

      {/* Grid de Usuarios */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {users.map(user => (
          <div key={user.id} className="glass-panel p-6 hover:scale-[1.02] transition-transform cursor-pointer group">
            <div className="flex justify-between items-start mb-4">
              <div className="w-12 h-12 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-full flex items-center justify-center font-bold text-xl">
                {user.fullName.charAt(0)}
              </div>
              <button className="text-gray-500 hover:text-white transition-colors">
                <MoreHorizontal />
              </button>
            </div>
            
            <h3 className="text-xl font-bold mb-1">{user.fullName}</h3>
            <p className="text-[var(--color-text-secondary)] mb-4">{user.email}</p>
            
            <div className="flex items-center gap-3">
              <span className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 ${user.role === 'ADMIN' ? 'bg-red-500/10 text-red-400' : 'bg-blue-500/10 text-blue-400'}`}>
                <ShieldCheck size={14} /> {user.role}
              </span>
              <span className={`px-3 py-1 rounded-full text-xs font-bold ${user.isActive ? 'bg-green-500/10 text-green-400' : 'bg-gray-500/10 text-gray-400'}`}>
                {user.isActive ? '• Activo' : '• Inactivo'}
              </span>
            </div>
          </div>
        ))}
      </div>

      <UserModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={loadUsers}
      />
    </div>
  );
};