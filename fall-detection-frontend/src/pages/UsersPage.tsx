import React, { useEffect, useRef, useState } from 'react';
import { AdminService } from '../services/adminService';
import { AssignedPatient, User } from '../types';
import {
  UserPlus,
  MoreHorizontal,
  ShieldCheck,
  Edit2,
  HeartPulse,
  HardDrive,
  X,
  Activity
} from 'lucide-react';
import { UserModal } from '../components/UserModal';
import { PageHeader } from '../components/PageHeader';
import { SearchFilterBar } from '../components/SearchFilterBar';
import { Pagination } from '../components/Pagination';
import { ActionMenu, ActionMenuItem } from '../components/ActionMenu';

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
      <PageHeader
        title="Usuarios"
        subtitle="Gestiona el acceso y roles de tu equipo."
        actionButton={{
          label: 'Nuevo Usuario',
          icon: UserPlus,
          onClick: () => setIsModalOpen(true)
        }}
      />

      <SearchFilterBar
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Buscar por nombre o email..."
        filterValue={roleFilter}
        onFilterChange={setRoleFilter}
        filterOptions={[
          { value: 'ALL', label: 'Todos los Roles' },
          { value: 'ADMIN', label: 'Administrador' },
          { value: 'MEMBER', label: 'Miembro' }
        ]}
        sortValue={sortBy}
        onSortChange={setSortBy}
        sortOptions={[
          { value: 'name_asc', label: 'Nombre A-Z' },
          { value: 'name_desc', label: 'Nombre Z-A' },
          { value: 'email_asc', label: 'Email A-Z' },
          { value: 'email_desc', label: 'Email Z-A' }
        ]}
      />

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
                  className="glass-panel p-6 cursor-pointer hover:scale-105 hover:shadow-lg hover:shadow-indigo-500/20 transition-all duration-300 group relative"
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

                      <ActionMenu
                        isOpen={openMenuId === user.id}
                        items={[
                          {
                            label: 'Editar Usuario',
                            icon: Edit2,
                            onClick: () => handleEditUser(user)
                          }
                        ] as ActionMenuItem[]}
                        onClose={() => setOpenMenuId(null)}
                        menuRef={menuRef}
                      />
                    </div>
                  </div>

                  <h3 className="text-xl font-bold mb-1" style={{ color: 'var(--color-text-primary)' }}>{user.fullName}</h3>
                  <p className="text-[var(--color-text-secondary)] mb-4">{user.email}</p>

                  <div className="flex items-center gap-3 mb-3">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 ${
                        user.role === 'ADMIN' ? 'bg-red-500/10 text-red-400' : 'bg-blue-500/10 text-blue-400'
                      }`}
                    >
                      <ShieldCheck size={14} /> {user.role}
                    </span>
                  </div>

                  <p className="text-xs text-[#94A3B8]">
                    Pacientes asignados:{' '}
                    <span className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>{typeof patientCount === 'number' ? patientCount : 'Click para cargar'}</span>
                  </p>
                </div>
              );
            })}
          </div>

          {/* Paginación */}
          {totalPages > 1 && (
            <div className="mt-8 pb-8">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
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

          <div className="glass-panel w-full max-w-3xl relative z-10 overflow-hidden reveal p-8 border border-white/10">
            <button
              onClick={closePatientsModal}
              className="absolute top-4 right-4 transition-colors"
              style={{ color: 'var(--color-text-secondary)' }}
              aria-label="Cerrar"
            >
              <X size={24} />
            </button>

            <div className="mb-6">
              <h3 className="text-3xl font-bold mb-2" style={{ color: 'var(--color-text-primary)' }}>Pacientes asignados</h3>
              <p className="text-[var(--color-text-secondary)]">
                Usuario: <span className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>{selectedUserForPatients.fullName}</span>
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
                        <h4 className="text-lg font-bold" style={{ color: 'var(--color-text-primary)' }}>{patient.patientName}</h4>
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
    </div>
  );
};


