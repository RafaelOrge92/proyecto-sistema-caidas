import React, { useEffect, useState, useRef } from 'react';
import { AdminService } from '../services/adminService';
import { User } from '../types';
import { Search, UserPlus, MoreHorizontal, ShieldCheck, Edit2, Trash2, AlertCircle } from 'lucide-react';
import { UserModal } from '../components/UserModal';

export const UsersPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUserToEdit, setSelectedUserToEdit] = useState<User | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<User | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => { loadUsers(); }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpenMenuId(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadUsers = async () => {
    try {
      const response = await AdminService.getUsers();
      setUsers(response.data);
    } finally { setLoading(false); }
  };

  const handleEditUser = (user: User) => {
    setSelectedUserToEdit(user);
    setIsModalOpen(true);
    setOpenMenuId(null);
  };

  const handleDeleteUser = async () => {
    if (!deleteConfirm) return;
    
    setIsDeleting(true);
    try {
      await AdminService.updateUser(deleteConfirm.id, { isActive: false });
      await loadUsers();
      setDeleteConfirm(null);
    } catch (error) {
      console.error('Error eliminando usuario:', error);
    } finally {
      setIsDeleting(false);
    }
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
          <div key={user.id} className="glass-panel p-6 hover:scale-[1.02] transition-transform cursor-pointer group relative">
            <div className="flex justify-between items-start mb-4">
              <div className="w-12 h-12 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-full flex items-center justify-center font-bold text-xl">
                {user.fullName.charAt(0)}
              </div>
              <div className="relative" ref={openMenuId === user.id ? menuRef : null}>
                <button 
                  onClick={() => setOpenMenuId(openMenuId === user.id ? null : user.id)}
                  className="text-gray-500 hover:text-white transition-colors p-2 hover:bg-white/5 rounded-lg"
                >
                  <MoreHorizontal size={20} />
                </button>
                
                {/* Menú Contextual */}
                {openMenuId === user.id && (
                  <div className="absolute right-0 mt-2 w-48 bg-[var(--color-bg-secondary)] border border-white/10 rounded-lg shadow-lg z-50 py-2">
                    <button
                      onClick={() => handleEditUser(user)}
                      className="w-full text-left px-4 py-2 hover:bg-white/10 text-white flex items-center gap-2 transition-colors"
                    >
                      <Edit2 size={16} /> Editar Usuario
                    </button>
                    <button
                      onClick={() => setDeleteConfirm(user)}
                      className="w-full text-left px-4 py-2 hover:bg-white/10 text-red-400 flex items-center gap-2 transition-colors border-t border-white/10"
                    >
                      <Trash2 size={16} /> Eliminar
                    </button>
                  </div>
                )}
              </div>
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
        onClose={() => {
          setIsModalOpen(false);
          setSelectedUserToEdit(null);
        }}
        onSuccess={loadUsers}
        dataToEdit={selectedUserToEdit}
      />

      {/* Modal de Confirmación de Eliminación */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setDeleteConfirm(null)} />
          
          <div className="glass-panel w-full max-w-md relative z-10 overflow-hidden reveal bg-[var(--color-bg-secondary)]/90 p-8">
            <div className="flex items-center justify-center mb-6 w-12 h-12 rounded-full bg-red-500/10 mx-auto">
              <AlertCircle size={24} className="text-red-400" />
            </div>
            
            <h3 className="text-2xl font-bold text-center mb-2">Eliminar Usuario</h3>
            <p className="text-[var(--color-text-secondary)] text-center mb-2">
              ¿Estás seguro de que deseas eliminar a
            </p>
            <p className="text-center font-semibold text-white mb-6">
              {deleteConfirm.fullName}?
            </p>
            
            <p className="text-sm text-[var(--color-text-secondary)] text-center mb-6 bg-white/5 p-3 rounded-lg">
              Esta acción desactivará la cuenta del usuario. Podrán volver a ser activados posteriormente.
            </p>

            <div className="flex gap-4">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 px-4 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl font-semibold transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleDeleteUser}
                disabled={isDeleting}
                className="flex-1 px-4 py-3 bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white rounded-xl font-semibold transition-colors"
              >
                {isDeleting ? 'Eliminando...' : 'Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};