import React, { useEffect, useRef, useState } from 'react';
import { AdminService } from '../services/adminService';
import { AssignedPatient, User } from '../types';
import {
  Search,
  UserPlus,
  MoreHorizontal,
  ShieldCheck,
  Edit2,
  Trash2,
  AlertCircle,
  Filter,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  HeartPulse,
  HardDrive,
  X,
  Activity
} from 'lucide-react';
import { UserModal } from '../components/UserModal';

export const UsersPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUserToEdit, setSelectedUserToEdit] = useState<User | null>(null);
  const [selectedUserForPatients, setSelectedUserForPatients] = useState<User | null>(null);
  const [assignedPatientsByUser, setAssignedPatientsByUser] = useState<Record<string, AssignedPatient[]>>({});
  const [patientsModalLoading, setPatientsModalLoading] = useState(false);
  const [patientsModalError, setPatientsModalError] = useState<string | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<User | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Estados para filtros, ordenamiento y paginación
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('name_asc');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  useEffect(() => {
    loadUsers();
  }, []);

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
      const usersResponse = await AdminService.getUsers();
      setUsers(usersResponse.data);
    } finally {
      setLoading(false);
    }
  };

  const handleEditUser = (user: User) => {
    setSelectedUserToEdit(user);
    setIsModalOpen(true);
    setOpenMenuId(null);
  };

  const closePatientsModal = () => {
    setSelectedUserForPatients(null);
    setPatientsModalError(null);
    setPatientsModalLoading(false);
  };

  const handleOpenPatientsModal = async (user: User) => {
    setSelectedUserForPatients(user);
    setOpenMenuId(null);
    setPatientsModalError(null);

    if (assignedPatientsByUser[user.id]) {
      return;
    }

    setPatientsModalLoading(true);
    try {
      const response = await AdminService.getAssignedPatientsByUser(user.id);
      setAssignedPatientsByUser((prev) => ({
        ...prev,
        [user.id]: response.data
      }));
    } catch (error) {
      console.error('Error cargando pacientes asignados:', error);
      setPatientsModalError('No se pudieron cargar los pacientes asignados para este usuario.');
    } finally {
      setPatientsModalLoading(false);
    }
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

  // Lógica de filtrado y ordenamiento
  const filteredAndSortedUsers = users
    .filter((user) => {
      const matchesSearch =
        user.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesRole = roleFilter === 'ALL' || user.role === roleFilter;
      return matchesSearch && matchesRole;
    })
    .sort((a, b) => {
      if (sortBy === 'name_asc') return a.fullName.localeCompare(b.fullName);
      if (sortBy === 'name_desc') return b.fullName.localeCompare(a.fullName);
      if (sortBy === 'email_asc') return a.email.localeCompare(b.email);
      if (sortBy === 'email_desc') return b.email.localeCompare(a.email);
      return 0;
    });

  const totalPages = Math.max(1, Math.ceil(filteredAndSortedUsers.length / itemsPerPage));
  const paginatedUsers = filteredAndSortedUsers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, roleFilter]);

  const selectedUserPatients = selectedUserForPatients
    ? assignedPatientsByUser[selectedUserForPatients.id] ?? []
    : [];

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

      {/* Barra de Controles */}
      <div className="flex flex-col lg:flex-row gap-4 mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
          <input
            type="text"
            placeholder="Buscar por nombre o email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[var(--color-bg-secondary)] border-none rounded-2xl py-4 pl-12 pr-6 focus:ring-2 focus:ring-[var(--color-primary)] transition-all outline-none text-lg text-white"
          />
        </div>

        <div className="flex gap-4">
          <div className="relative min-w-[200px]">
            <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="w-full bg-[var(--color-bg-secondary)] appearance-none rounded-2xl py-4 pl-12 pr-10 outline-none text-white cursor-pointer focus:ring-2 focus:ring-[var(--color-primary)]"
            >
              <option value="ALL">Todos los Roles</option>
              <option value="ADMIN">Administrador</option>
              <option value="USER">Usuario</option>
              <option value="DOCTOR">Doctor</option>
              <option value="FAMILY">Familiar</option>
            </select>
          </div>

          <div className="relative min-w-[200px]">
            <ArrowUpDown className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full bg-[var(--color-bg-secondary)] appearance-none rounded-2xl py-4 pl-12 pr-10 outline-none text-white cursor-pointer focus:ring-2 focus:ring-[var(--color-primary)]"
            >
              <option value="name_asc">Nombre A-Z</option>
              <option value="name_desc">Nombre Z-A</option>
              <option value="email_asc">Email A-Z</option>
              <option value="email_desc">Email Z-A</option>
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <>
          {/* Grid de Usuarios */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {paginatedUsers.map((user) => {
              const patientCount = assignedPatientsByUser[user.id]?.length;

              return (
                <div
                  key={user.id}
                  onClick={() => handleOpenPatientsModal(user)}
                  className="glass-panel p-6 hover:scale-[1.02] transition-transform cursor-pointer group relative"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="w-12 h-12 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-full flex items-center justify-center font-bold text-xl">
                      {user.fullName.charAt(0)}
                    </div>
                    <div className="relative" ref={openMenuId === user.id ? menuRef : null}>
                      <button
                        onClick={(event) => {
                          event.stopPropagation();
                          setOpenMenuId(openMenuId === user.id ? null : user.id);
                        }}
                        className="text-gray-500 hover:text-white transition-colors p-2 hover:bg-white/5 rounded-lg"
                      >
                        <MoreHorizontal size={20} />
                      </button>

                      {/* Menú Contextual */}
                      {openMenuId === user.id && (
                        <div className="absolute right-0 mt-2 w-48 bg-[var(--color-bg-secondary)] border border-white/10 rounded-lg shadow-lg z-50 py-2">
                          <button
                            onClick={(event) => {
                              event.stopPropagation();
                              handleEditUser(user);
                            }}
                            className="w-full text-left px-4 py-2 hover:bg-white/10 text-white flex items-center gap-2 transition-colors"
                          >
                            <Edit2 size={16} /> Editar Usuario
                          </button>
                          <button
                            onClick={(event) => {
                              event.stopPropagation();
                              setDeleteConfirm(user);
                            }}
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

                  <div className="flex items-center gap-3 mb-3">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 ${
                        user.role === 'ADMIN' ? 'bg-red-500/10 text-red-400' : 'bg-blue-500/10 text-blue-400'
                      }`}
                    >
                      <ShieldCheck size={14} /> {user.role}
                    </span>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold ${
                        user.isActive ? 'bg-green-500/10 text-green-400' : 'bg-gray-500/10 text-gray-400'
                      }`}
                    >
                      {user.isActive ? '• Activo' : '• Inactivo'}
                    </span>
                  </div>

                  <p className="text-xs text-[#94A3B8]">
                    Pacientes asignados:{' '}
                    <span className="text-white font-semibold">{typeof patientCount === 'number' ? patientCount : 'Click para cargar'}</span>
                  </p>
                </div>
              );
            })}
          </div>

          {/* Paginación */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-4 mt-8 pb-8">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-full bg-[var(--color-bg-secondary)] text-white disabled:opacity-50 hover:bg-white/10 transition-colors"
              >
                <ChevronLeft size={24} />
              </button>
              <span className="text-[var(--color-text-secondary)]">
                Página {currentPage} de {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-2 rounded-full bg-[var(--color-bg-secondary)] text-white disabled:opacity-50 hover:bg-white/10 transition-colors"
              >
                <ChevronRight size={24} />
              </button>
            </div>
          )}
        </>
      )}

      <UserModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedUserToEdit(null);
        }}
        onSuccess={loadUsers}
        dataToEdit={selectedUserToEdit}
      />

      {/* Modal de Pacientes Asignados */}
      {selectedUserForPatients && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={closePatientsModal} />

          <div className="glass-panel w-full max-w-3xl relative z-10 overflow-hidden reveal bg-[var(--color-bg-secondary)]/90 p-8 border border-white/10">
            <button
              onClick={closePatientsModal}
              className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
              aria-label="Cerrar"
            >
              <X size={24} />
            </button>

            <div className="mb-6">
              <h3 className="text-3xl font-bold text-white mb-2">Pacientes asignados</h3>
              <p className="text-[var(--color-text-secondary)]">
                Usuario: <span className="text-white font-semibold">{selectedUserForPatients.fullName}</span>
              </p>
            </div>

            {patientsModalLoading ? (
              <div className="flex justify-center py-12">
                <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : patientsModalError ? (
              <div className="text-center py-12 bg-red-500/10 rounded-2xl border border-red-500/20">
                <Activity size={42} className="mx-auto text-red-300 mb-3" />
                <p className="text-red-200">{patientsModalError}</p>
              </div>
            ) : selectedUserPatients.length === 0 ? (
              <div className="text-center py-12 bg-white/5 rounded-2xl border border-white/10">
                <HeartPulse size={42} className="mx-auto text-[#64748B] mb-3" />
                <p className="text-[var(--color-text-secondary)]">Este usuario todavía no tiene pacientes asignados.</p>
              </div>
            ) : (
              <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                {selectedUserPatients.map((patient) => (
                  <div key={patient.patientId} className="rounded-2xl border border-white/10 bg-white/5 p-5">
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div>
                        <h4 className="text-lg font-bold text-white">{patient.patientName}</h4>
                        <p className="text-sm text-[var(--color-text-secondary)]">ID paciente: {patient.patientId}</p>
                      </div>
                      <span className="px-3 py-1 rounded-full text-xs bg-indigo-500/15 text-indigo-300">
                        {patient.devices.length} disp.
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-2 mb-3">
                      {patient.accessTypes.map((type) => (
                        <span key={type} className="px-2 py-1 rounded-full text-[11px] bg-cyan-500/15 text-cyan-300 border border-cyan-500/20">
                          {type}
                        </span>
                      ))}
                    </div>

                    <div className="space-y-2">
                      {patient.devices.map((device) => (
                        <div key={device.id} className="flex items-center justify-between px-3 py-2 rounded-lg bg-black/20 border border-white/5">
                          <div className="flex items-center gap-2 min-w-0">
                            <HardDrive size={14} className="text-indigo-300 shrink-0" />
                            <p className="text-sm text-white truncate">{device.alias || device.id}</p>
                          </div>
                          <code className="text-xs text-[#94A3B8]">{device.id}</code>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal de Confirmación de Eliminación */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setDeleteConfirm(null)} />

          <div className="glass-panel w-full max-w-md relative z-10 overflow-hidden reveal bg-[var(--color-bg-secondary)]/90 p-8">
            <div className="flex items-center justify-center mb-6 w-12 h-12 rounded-full bg-red-500/10 mx-auto">
              <AlertCircle size={24} className="text-red-400" />
            </div>

            <h3 className="text-2xl font-bold text-center mb-2">Eliminar Usuario</h3>
            <p className="text-[var(--color-text-secondary)] text-center mb-2">¿Estás seguro de que deseas eliminar a</p>
            <p className="text-center font-semibold text-white mb-6">{deleteConfirm.fullName}?</p>

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
