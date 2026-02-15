import React, { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  HardDrive,
  UserCheck,
  Users as UsersIcon,
  UserPlus,
  X,
  Trash2,
  ShieldCheck
} from 'lucide-react';
import { AdminService } from '../services/adminService';
import { Device, PatientAssignedUser, User } from '../types';
import { PageHeader } from '../components/PageHeader';
import { SearchFilterBar } from '../components/SearchFilterBar';

type PatientSummary = {
  key: string;
  name: string;
  patientId?: string;
  assignedUsers: string[];
  devices: Array<{
    id: string;
    alias?: string;
    isActive?: boolean;
  }>;
};

const buildPatientSummaries = (devices: Device[]): PatientSummary[] => {
  const patientMap = new Map<string, PatientSummary>();

  devices.forEach((device) => {
    const patientName = device.patientName?.trim();
    const patientId = device.patientId?.trim();

    if (!patientName && !patientId) {
      return;
    }

    const key = patientId || `name:${(patientName || '').toLowerCase()}`;
    const displayName = patientName || `Paciente ${patientId}`;

    if (!patientMap.has(key)) {
      patientMap.set(key, {
        key,
        name: displayName,
        patientId: patientId || undefined,
        assignedUsers: [],
        devices: []
      });
    }

    const patient = patientMap.get(key)!;
    patient.devices.push({
      id: device.id,
      alias: device.alias,
      isActive: device.isActive
    });

    if (device.assignedUserName && !patient.assignedUsers.includes(device.assignedUserName)) {
      patient.assignedUsers.push(device.assignedUserName);
    }
  });

  return Array.from(patientMap.values())
    .map((patient) => ({
      ...patient,
      assignedUsers: [...patient.assignedUsers].sort((a, b) => a.localeCompare(b)),
      devices: [...patient.devices].sort((a, b) => a.id.localeCompare(b.id))
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
};

export const PatientsPage: React.FC = () => {
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const [isUsersModalOpen, setIsUsersModalOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<PatientSummary | null>(null);
  const [patientUsersByPatientId, setPatientUsersByPatientId] = useState<Record<string, PatientAssignedUser[]>>({});
  const [modalUsers, setModalUsers] = useState<PatientAssignedUser[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [selectedAccessType, setSelectedAccessType] = useState<'OWNER' | 'MEMBER'>('MEMBER');
  const [assigning, setAssigning] = useState(false);
  const [removingAccountId, setRemovingAccountId] = useState<string | null>(null);

  // Estado para crear nuevo paciente
  const [isCreatePatientModalOpen, setIsCreatePatientModalOpen] = useState(false);
  const [creatingPatient, setCreatingPatient] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    nif: '',
    dateOfBirth: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    province: '',
    postalCode: '',
    country: 'España'
  });

  const loadDevices = async () => {
    try {
      const response = await AdminService.getDevices();
      setDevices(response.data);
    } catch (error) {
      console.error('Error cargando pacientes:', error);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        await loadDevices();
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const patients = useMemo(() => buildPatientSummaries(devices), [devices]);
  const normalizedSearch = searchTerm.trim().toLowerCase();

  const filteredPatients = useMemo(() => {
    if (!normalizedSearch) return patients;

    return patients.filter((patient) => {
      const managedUsers = patient.patientId ? patientUsersByPatientId[patient.patientId] : undefined;
      const assignedUserNames = managedUsers ? managedUsers.map((user) => user.fullName) : patient.assignedUsers;
      const userText = assignedUserNames.join(' ').toLowerCase();
      const deviceText = patient.devices.map((device) => `${device.alias || ''} ${device.id}`).join(' ').toLowerCase();

      return (
        patient.name.toLowerCase().includes(normalizedSearch) ||
        (patient.patientId || '').toLowerCase().includes(normalizedSearch) ||
        userText.includes(normalizedSearch) ||
        deviceText.includes(normalizedSearch)
      );
    });
  }, [patients, normalizedSearch, patientUsersByPatientId]);

  const closeUsersModal = () => {
    setIsUsersModalOpen(false);
    setSelectedPatient(null);
    setModalUsers([]);
    setModalError(null);
    setSelectedAccountId('');
    setSelectedAccessType('MEMBER');
    setAssigning(false);
    setRemovingAccountId(null);
  };

  const loadUsersManagementData = async (patient: PatientSummary) => {
    if (!patient.patientId) {
      setModalError('Este paciente no tiene patient_id, no se puede gestionar desde el panel.');
      return;
    }

    setModalLoading(true);
    setModalError(null);

    try {
      const requests: Promise<any>[] = [AdminService.getAssignedUsersByPatient(patient.patientId)];

      if (allUsers.length === 0) {
        requests.push(AdminService.getUsers());
      }

      const [assignedUsersResponse, allUsersResponse] = await Promise.all(requests);
      const assignedUsers = assignedUsersResponse.data as PatientAssignedUser[];

      setModalUsers(assignedUsers);
      setPatientUsersByPatientId((prev) => ({
        ...prev,
        [patient.patientId!]: assignedUsers
      }));

      if (allUsersResponse) {
        setAllUsers(allUsersResponse.data as User[]);
      }
    } catch (error) {
      console.error('Error cargando gestion de usuarios por paciente:', error);
      setModalError('No se pudieron cargar los usuarios asignados para este paciente.');
    } finally {
      setModalLoading(false);
    }
  };

  const handleOpenUsersModal = async (patient: PatientSummary) => {
    setSelectedPatient(patient);
    setIsUsersModalOpen(true);
    await loadUsersManagementData(patient);
  };

  const refreshCurrentPatientUsers = async () => {
    if (!selectedPatient?.patientId) return;
    await loadUsersManagementData(selectedPatient);
    await loadDevices();
  };

  const handleAssignUserToPatient = async () => {
    if (!selectedPatient?.patientId || !selectedAccountId) return;

    setAssigning(true);
    setModalError(null);

    try {
      await AdminService.assignUserToPatient(selectedPatient.patientId, selectedAccountId, selectedAccessType);
      setSelectedAccountId('');
      setSelectedAccessType('MEMBER');
      await refreshCurrentPatientUsers();
    } catch (error: any) {
      const message = error?.response?.data?.error || 'No se pudo asignar el usuario al paciente.';
      setModalError(message);
    } finally {
      setAssigning(false);
    }
  };

  const handleRemoveUserFromPatient = async (accountId: string) => {
    if (!selectedPatient?.patientId) return;

    setRemovingAccountId(accountId);
    setModalError(null);

    try {
      await AdminService.removeUserFromPatient(selectedPatient.patientId, accountId);
      await refreshCurrentPatientUsers();
    } catch (error: any) {
      const message = error?.response?.data?.error || 'No se pudo desasignar el usuario del paciente.';
      setModalError(message);
    } finally {
      setRemovingAccountId(null);
    }
  };

  const assignedAccountIds = useMemo(
    () => new Set(modalUsers.map((user) => user.accountId)),
    [modalUsers]
  );

  const handleCreatePatient = async () => {
    setCreateError(null);

    // Validación
    if (!formData.firstName.trim()) {
      setCreateError('El nombre es requerido');
      return;
    }
    if (!formData.lastName.trim()) {
      setCreateError('El apellido es requerido');
      return;
    }
    if (!formData.nif.trim()) {
      setCreateError('El NIF es requerido');
      return;
    }
    if (!formData.addressLine1.trim()) {
      setCreateError('La dirección es requerida');
      return;
    }
    if (!formData.city.trim()) {
      setCreateError('La ciudad es requerida');
      return;
    }

    setCreatingPatient(true);

    try {
      await AdminService.createPatient({
        firstName: formData.firstName,
        lastName: formData.lastName,
        nif: formData.nif,
        dateOfBirth: formData.dateOfBirth || undefined,
        addressLine1: formData.addressLine1,
        addressLine2: formData.addressLine2 || undefined,
        city: formData.city,
        province: formData.province || undefined,
        postalCode: formData.postalCode || undefined,
        country: formData.country
      });

      // Limpiar formulario
      setFormData({
        firstName: '',
        lastName: '',
        nif: '',
        dateOfBirth: '',
        addressLine1: '',
        addressLine2: '',
        city: '',
        province: '',
        postalCode: '',
        country: 'España'
      });

      setIsCreatePatientModalOpen(false);
      await loadDevices();
    } catch (error: any) {
      const message = error?.response?.data?.error || 'No se pudo crear el paciente';
      setCreateError(message);
    } finally {
      setCreatingPatient(false);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto reveal">
      <PageHeader
        title="Pacientes"
        subtitle="Vista consolidada de pacientes segun dispositivos y asignaciones activas."
        actionButton={{
          label: 'Nuevo Paciente',
          icon: UserPlus,
          onClick: () => setIsCreatePatientModalOpen(true)
        }}
      />

      <SearchFilterBar
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Buscar por nombre, paciente, usuario o dispositivo..."
      />

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filteredPatients.length === 0 ? (
        <div className="glass-panel p-12 text-center">
          <Activity className="mx-auto mb-4" size={48} style={{ color: 'var(--color-text-secondary)' }} />
          <p style={{ color: 'var(--color-text-secondary)' }}>
            {normalizedSearch ? 'No hay pacientes que coincidan con la busqueda.' : 'No hay pacientes registrados en los dispositivos.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredPatients.map((patient) => {
            const managedUsers = patient.patientId ? patientUsersByPatientId[patient.patientId] : undefined;
            const assignedUserNames = managedUsers ? managedUsers.map((user) => user.fullName) : patient.assignedUsers;

            return (
              <div key={patient.key} className="glass-panel p-6 cursor-pointer hover:scale-105 hover:shadow-lg hover:shadow-indigo-500/20 transition-all duration-300 group">
                <div className="flex items-start justify-between mb-4 gap-3">
                  <div className="w-12 h-12 bg-indigo-500/15 rounded-2xl flex items-center justify-center">
                    <UsersIcon size={22} className="text-indigo-300" />
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs px-3 py-1 rounded-full bg-white/5" style={{ color: 'var(--color-text-secondary)' }}>
                      {patient.devices.length} disp.
                    </span>
                    <button
                      onClick={() => handleOpenUsersModal(patient)}
                      disabled={!patient.patientId}
                      className="text-xs px-3 py-1 rounded-full bg-indigo-500/15 text-indigo-300 hover:bg-indigo-500/25 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Gestionar
                    </button>
                  </div>
                </div>

                <h2 className="text-xl font-bold mb-1" style={{ color: 'var(--color-text-primary)' }}>{patient.name}</h2>
                <p className="text-sm mb-4" style={{ color: 'var(--color-text-secondary)' }}>
                  {patient.patientId ? `ID paciente: ${patient.patientId}` : 'Sin patient_id registrado'}
                </p>

                <div className="space-y-3">
                  <div>
                    <p className="text-xs uppercase tracking-widest text-[#64748B] mb-2">Usuarios asignados</p>
                    {assignedUserNames.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {assignedUserNames.map((assignedUser) => (
                          <span key={assignedUser} className="px-2.5 py-1 rounded-full bg-cyan-500/10 text-cyan-300 text-xs flex items-center gap-1">
                            <UserCheck size={12} />
                            {assignedUser}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Sin usuarios asignados</p>
                    )}
                  </div>

                  <div>
                    <p className="text-xs uppercase tracking-widest text-[#64748B] mb-2">Dispositivos vinculados</p>
                    <div className="space-y-2">
                      {patient.devices.map((device) => (
                        <div key={device.id} className="flex items-center justify-between px-3 py-2 rounded-lg bg-white/5">
                          <div className="flex items-center gap-2 min-w-0">
                            <HardDrive size={14} className="text-indigo-300 shrink-0" />
                            <p className="text-sm truncate" style={{ color: 'var(--color-text-primary)' }}>{device.alias || device.id}</p>
                          </div>
                          <span className={`text-[11px] font-semibold ${device.isActive ? 'text-emerald-300' : ''}`} style={{ color: device.isActive ? undefined : 'var(--color-text-secondary)' }}>
                            {device.isActive ? 'Activo' : 'Offline'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {isUsersModalOpen && selectedPatient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={closeUsersModal} />

          <div className="glass-panel w-full max-w-3xl relative z-10 overflow-hidden reveal p-8 border border-white/10">
            <button
              onClick={closeUsersModal}
              className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
              aria-label="Cerrar"
            >
              <X size={24} />
            </button>

            <div className="mb-6">
              <h3 className="text-3xl font-bold mb-2" style={{ color: 'var(--color-text-primary)' }}>Gestionar usuarios por paciente</h3>
              <p style={{ color: 'var(--color-text-secondary)' }}>
                Paciente: <span className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>{selectedPatient.name}</span>
              </p>
              <p className="text-xs mt-1" style={{ color: 'var(--color-text-secondary)' }}>{selectedPatient.patientId || 'Sin patient_id'}</p>
            </div>

            {modalError && (
              <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                {modalError}
              </div>
            )}

            {modalLoading ? (
              <div className="flex justify-center py-12">
                <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <div className="space-y-6">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                  <h4 className="text-lg font-bold mb-4 flex items-center gap-2" style={{ color: 'var(--color-text-primary)' }}>
                    Asignar usuario
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <select
                      value={selectedAccountId}
                      onChange={(e) => setSelectedAccountId(e.target.value)}
                      className="md:col-span-2 rounded-xl py-3 px-3 outline-none border border-white/10"
                      style={{
                        backgroundColor: 'var(--color-bg-secondary)',
                        color: 'var(--color-text-primary)',
                        borderColor: 'var(--color-border)'
                      }}
                    >
                      <option value="">Selecciona un usuario...</option>
                      {allUsers.map((user) => (
                        <option key={user.id} value={user.id}>
                          {user.fullName} ({user.email}){assignedAccountIds.has(user.id) ? ' - ya asignado' : ''}
                        </option>
                      ))}
                    </select>

                    <select
                      value={selectedAccessType}
                      onChange={(e) => setSelectedAccessType(e.target.value as 'OWNER' | 'MEMBER')}
                      className="rounded-xl py-3 px-3 outline-none border border-white/10"
                      style={{
                        backgroundColor: 'var(--color-bg-secondary)',
                        color: 'var(--color-text-primary)',
                        borderColor: 'var(--color-border)'
                      }}
                    >
                      <option value="MEMBER">MEMBER</option>
                      <option value="OWNER">OWNER</option>
                    </select>
                  </div>

                  <button
                    onClick={handleAssignUserToPatient}
                    disabled={!selectedAccountId || assigning || !selectedPatient.patientId}
                    className="mt-3 px-4 py-2 rounded-lg bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] hover:from-[#818CF8] hover:to-[#A78BFA] disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold transition-colors"
                  >
                    {assigning ? 'Asignando...' : 'Asignar al paciente'}
                  </button>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                  <h4 className="text-lg font-bold mb-4" style={{ color: 'var(--color-text-primary)' }}>Usuarios actualmente asignados</h4>

                  {modalUsers.length === 0 ? (
                    <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>No hay usuarios asignados a este paciente.</p>
                  ) : (
                    <div className="space-y-3 max-h-[40vh] overflow-y-auto pr-1">
                      {modalUsers.map((user) => (
                        <div key={user.accountId} className="flex items-center justify-between gap-4 rounded-xl border border-white/10 bg-black/20 px-4 py-3">
                          <div className="min-w-0">
                            <p className="font-semibold truncate" style={{ color: 'var(--color-text-primary)' }}>{user.fullName}</p>
                            <p className="text-xs truncate" style={{ color: 'var(--color-text-secondary)' }}>{user.email}</p>
                            <div className="flex flex-wrap gap-2 mt-2">
                              <span className="px-2 py-0.5 rounded-full text-[11px] bg-indigo-500/15 text-indigo-300 flex items-center gap-1">
                                <ShieldCheck size={11} />
                                {user.role}
                              </span>
                              {user.accessTypes.map((accessType) => (
                                <span key={`${user.accountId}-${accessType}`} className="px-2 py-0.5 rounded-full text-[11px] bg-cyan-500/15 text-cyan-300">
                                  {accessType}
                                </span>
                              ))}
                              <span className="px-2 py-0.5 rounded-full text-[11px] bg-white/10 text-[#CBD5E1]">
                                {user.devicesAssigned} dispositivos
                              </span>
                            </div>
                          </div>

                          <button
                            onClick={() => handleRemoveUserFromPatient(user.accountId)}
                            disabled={removingAccountId === user.accountId}
                            className="shrink-0 p-2 rounded-lg text-red-300 hover:text-red-100 hover:bg-red-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            title="Quitar usuario"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal para crear nuevo paciente */}
      {isCreatePatientModalOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setIsCreatePatientModalOpen(false)}
        >
          <div 
            className="glass-panel rounded-2xl max-w-md w-full p-8 relative max-h-[90vh] overflow-y-auto reveal"
            onClick={(e) => e.stopPropagation()}
          >
            <button 
              onClick={() => setIsCreatePatientModalOpen(false)}
              className="absolute top-4 right-4 transition-colors rounded-full p-1"
              style={{ color: 'var(--color-text-secondary)', backgroundColor: 'transparent' }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-bg-primary)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <X size={24} />
            </button>

            <div className="mb-8">
              <h3 className="text-3xl font-bold tracking-tight" style={{ color: 'var(--color-text-primary)' }}>
                Crear <span style={{ color: 'var(--color-text-secondary)' }}>Paciente</span>
              </h3>
              <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>Registra un nuevo paciente en el sistema</p>
            </div>

            {createError && (
              <div className="mb-6 p-4 border rounded-lg" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', borderColor: 'rgba(239, 68, 68, 0.5)' }}>
                <p className="text-sm" style={{ color: 'var(--color-text-primary)' }}>{createError}</p>
              </div>
            )}

            <div className="space-y-6">
              <div>
                <label className="block text-xs font-bold uppercase tracking-tighter mb-2" style={{ color: 'var(--color-text-secondary)' }}>Nombre *</label>
                <input
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  disabled={creatingPatient}
                  className="w-full border rounded-2xl py-3 px-4 outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20 transition-all disabled:opacity-50"
                  style={{
                    backgroundColor: 'var(--color-bg-primary)',
                    color: 'var(--color-text-primary)',
                    borderColor: 'var(--color-border)'
                  }}
                  placeholder="Juan"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-tighter mb-2" style={{ color: 'var(--color-text-secondary)' }}>Apellido *</label>
                <input
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  disabled={creatingPatient}
                  className="w-full border rounded-2xl py-3 px-4 outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20 transition-all disabled:opacity-50"
                  style={{
                    backgroundColor: 'var(--color-bg-primary)',
                    color: 'var(--color-text-primary)',
                    borderColor: 'var(--color-border)'
                  }}
                  placeholder="Pérez"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-tighter mb-2" style={{ color: 'var(--color-text-secondary)' }}>NIF *</label>
                <input
                  type="text"
                  value={formData.nif}
                  onChange={(e) => setFormData({ ...formData, nif: e.target.value })}
                  disabled={creatingPatient}
                  className="w-full border rounded-2xl py-3 px-4 outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20 transition-all disabled:opacity-50"
                  style={{
                    backgroundColor: 'var(--color-bg-primary)',
                    color: 'var(--color-text-primary)',
                    borderColor: 'var(--color-border)'
                  }}
                  placeholder="12345678X"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-tighter mb-2" style={{ color: 'var(--color-text-secondary)' }}>Fecha de Nacimiento</label>
                <input
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                  disabled={creatingPatient}
                  className="w-full border rounded-2xl py-3 px-4 outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20 transition-all disabled:opacity-50"
                  style={{
                    backgroundColor: 'var(--color-bg-primary)',
                    color: 'var(--color-text-primary)',
                    borderColor: 'var(--color-border)'
                  }}
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-tighter mb-2" style={{ color: 'var(--color-text-secondary)' }}>Dirección *</label>
                <input
                  type="text"
                  value={formData.addressLine1}
                  onChange={(e) => setFormData({ ...formData, addressLine1: e.target.value })}
                  disabled={creatingPatient}
                  className="w-full border rounded-2xl py-3 px-4 outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20 transition-all disabled:opacity-50"
                  style={{
                    backgroundColor: 'var(--color-bg-primary)',
                    color: 'var(--color-text-primary)',
                    borderColor: 'var(--color-border)'
                  }}
                  placeholder="Calle Principal 123"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-tighter mb-2" style={{ color: 'var(--color-text-secondary)' }}>Dirección 2 (Opcional)</label>
                <input
                  type="text"
                  value={formData.addressLine2}
                  onChange={(e) => setFormData({ ...formData, addressLine2: e.target.value })}
                  disabled={creatingPatient}
                  className="w-full border rounded-2xl py-3 px-4 outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20 transition-all disabled:opacity-50"
                  style={{
                    backgroundColor: 'var(--color-bg-primary)',
                    color: 'var(--color-text-primary)',
                    borderColor: 'var(--color-border)'
                  }}
                  placeholder="Apartamento 4B"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-tighter mb-2" style={{ color: 'var(--color-text-secondary)' }}>Ciudad *</label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  disabled={creatingPatient}
                  className="w-full border rounded-2xl py-3 px-4 outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20 transition-all disabled:opacity-50"
                  style={{
                    backgroundColor: 'var(--color-bg-primary)',
                    color: 'var(--color-text-primary)',
                    borderColor: 'var(--color-border)'
                  }}
                  placeholder="Madrid"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-tighter mb-2" style={{ color: 'var(--color-text-secondary)' }}>Provincia (Opcional)</label>
                <input
                  type="text"
                  value={formData.province}
                  onChange={(e) => setFormData({ ...formData, province: e.target.value })}
                  disabled={creatingPatient}
                  className="w-full border rounded-2xl py-3 px-4 outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20 transition-all disabled:opacity-50"
                  style={{
                    backgroundColor: 'var(--color-bg-primary)',
                    color: 'var(--color-text-primary)',
                    borderColor: 'var(--color-border)'
                  }}
                  placeholder="Madrid"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-tighter mb-2" style={{ color: 'var(--color-text-secondary)' }}>Código Postal (Opcional)</label>
                <input
                  type="text"
                  value={formData.postalCode}
                  onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                  disabled={creatingPatient}
                  className="w-full border rounded-2xl py-3 px-4 outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20 transition-all disabled:opacity-50"
                  style={{
                    backgroundColor: 'var(--color-bg-primary)',
                    color: 'var(--color-text-primary)',
                    borderColor: 'var(--color-border)'
                  }}
                  placeholder="28001"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-tighter mb-2" style={{ color: 'var(--color-text-secondary)' }}>País</label>
                <input
                  type="text"
                  value={formData.country}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                  disabled={creatingPatient}
                  className="w-full border rounded-2xl py-3 px-4 outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20 transition-all disabled:opacity-50"
                  style={{
                    backgroundColor: 'var(--color-bg-primary)',
                    color: 'var(--color-text-primary)',
                    borderColor: 'var(--color-border)'
                  }}
                  placeholder="España"
                />
              </div>
            </div>

            <div className="flex gap-4 pt-6">
              <button
                onClick={() => setIsCreatePatientModalOpen(false)}
                disabled={creatingPatient}
                className="flex-1 px-4 py-2.5 rounded-lg border font-semibold transition-all disabled:opacity-50"
                style={{
                  borderColor: 'var(--color-border)',
                  color: 'var(--color-text-primary)',
                  backgroundColor: 'transparent'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-bg-primary)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                Cancelar
              </button>
              <button
                onClick={handleCreatePatient}
                disabled={creatingPatient}
                className="flex-1 px-4 py-2.5 rounded-lg bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] hover:from-[#818CF8] hover:to-[#A78BFA] font-semibold transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                style={{ color: 'white' }}
              >
                {creatingPatient ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Creando...
                  </>
                ) : (
                  'Crear Paciente'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
