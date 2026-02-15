import React, { useState, useEffect } from 'react';
import { AdminService } from '../services/adminService';
import { Device, User, Patient, FallEvent } from '../types';
import { Laptop, Plus, Settings2, Link as LinkIcon, X, Activity, Calendar, Users, ChevronDown } from 'lucide-react';
import { DeviceModal } from '../components/DeviceModal';
import { PageHeader } from '../components/PageHeader';
import { Pagination } from '../components/Pagination';

export const DevicePage: React.FC = () => {
  const [devices, setDevices] = useState<Device[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [assigningDeviceId, setAssigningDeviceId] = useState<string | null>(null);
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [deviceEvents, setDeviceEvents] = useState<FallEvent[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(false);
  
  // Estado para la modal de asignar paciente
  const [isPatientModalOpen, setIsPatientModalOpen] = useState(false);
  const [selectedDeviceForPatient, setSelectedDeviceForPatient] = useState<Device | null>(null);
  const [assigningPatientToDeviceId, setAssigningPatientToDeviceId] = useState<string | null>(null);

  // Estados para paginación
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  useEffect(() => { loadData(); }, []);

  const loadDeviceDetails = async (device: Device) => {
    setSelectedDevice(device);
    setLoadingEvents(true);
    try {
      const response = await AdminService.getEventsByDevice(device.id);
      setDeviceEvents(response.data);
    } catch (error) {
      console.error('Error cargando eventos del dispositivo:', error);
      setDeviceEvents([]);
    } finally {
      setLoadingEvents(false);
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [devRes, userRes, patientRes] = await Promise.all([
        AdminService.getDevices(), 
        AdminService.getUsers(),
        AdminService.getPatients()
      ]);
      setDevices(devRes.data);
      setUsers(userRes.data);
      setPatients(patientRes.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setCurrentPage(1);
    }
  };

  const handleAssignDevice = async (deviceId: string, userId: string) => {
    if (!userId) return; // No hacer nada si se selecciona "Disponible"
    
    setAssigningDeviceId(deviceId);
    
    try {
      await AdminService.assignDeviceToUser(deviceId, userId, 'MEMBER');
      
      // Recargar datos para reflejar cambios
      await loadData();
    } catch (error) {
      console.error('Error asignando dispositivo:', error);
      alert('Error al asignar el dispositivo');
    } finally {
      setAssigningDeviceId(null);
    }
  };

  const handleAssignPatient = async (patientId: string | null) => {
    if (!selectedDeviceForPatient) return;

    setAssigningPatientToDeviceId(selectedDeviceForPatient.id);
    
    try {
      await AdminService.updateDevice(selectedDeviceForPatient.id, {
        patientId: patientId || undefined
      });
      
      // Recargar datos para reflejar cambios
      await loadData();
      setIsPatientModalOpen(false);
      setSelectedDeviceForPatient(null);
    } catch (error) {
      console.error('Error asignando paciente:', error);
      alert('Error al asignar el paciente');
    } finally {
      setAssigningPatientToDeviceId(null);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto reveal">
      <PageHeader
        title="Dispositivos"
        subtitle="Hardware vinculado a tu red de protección."
        actionButton={{
          label: 'Nuevo Dispositivo',
          icon: Plus,
          onClick: () => setIsModalOpen(true)
        }}
      />

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-8">
            {devices.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((device) => (
              <div key={device.id} className="device-card glass-panel p-8 hover:scale-[1.02] hover:shadow-2xl transition-all duration-300 group relative overflow-hidden">
                <div className="flex justify-between items-start mb-10">
                  <div className="device-card-icon w-14 h-14 bg-[var(--color-bg-elevated)] rounded-2xl flex items-center justify-center text-[#6366F1]">
                    <Laptop size={28} />
                  </div>
                  <button 
                    className="transition-colors cursor-pointer hover:scale-110"
                    onClick={() => loadDeviceDetails(device)}
                    style={{ color: 'var(--color-text-secondary)' }}
                  >
                    <Settings2 size={20} />
                  </button>
                </div>

                <h3 className="device-card-title text-2xl font-bold mb-2" style={{ color: 'var(--color-text-primary)' }}>{(device as any).alias || 'Sin nombre'}</h3>
                <p className="device-card-text text-xs font-mono mb-8 tracking-widest uppercase" style={{ color: 'var(--color-text-secondary)' }}>ID: {device.id}</p>

                <div className="space-y-4">
                  {/* Sección de Paciente */}
                  <div>
                    <label className="device-card-label text-xs font-bold uppercase tracking-tighter block mb-2" style={{ color: 'var(--color-text-secondary)' }}>Paciente Asignado</label>
                    <button
                      onClick={() => {
                        setSelectedDeviceForPatient(device);
                        setIsPatientModalOpen(true);
                      }}
                      className="device-card-input w-full bg-[var(--color-bg-secondary)] hover:bg-[var(--color-bg-elevated)] border rounded-xl py-3 px-4 transition-all text-left flex justify-between items-center cursor-pointer"
                      style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }}
                    >
                      <span>{device.patientName || 'Sin paciente'}</span>
                      <ChevronDown size={16} style={{ color: 'var(--color-text-secondary)' }} />
                    </button>
                  </div>

                  {/* Sección de Usuario */}
                  <div>
                    <label className="device-card-label text-xs font-bold uppercase tracking-tighter block" style={{ color: 'var(--color-text-secondary)' }}>Asignación de Usuario</label>
                    <div className="relative">
                      <select
                        value={device.assignedUserId || ""}
                        className="device-card select w-full bg-[var(--color-bg-secondary)] border rounded-xl py-3 px-4 appearance-none focus:ring-2 focus:ring-[var(--color-primary)] transition-all cursor-pointer disabled:opacity-50"
                        style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }}
                        onChange={(e) => handleAssignDevice(device.id, e.target.value)}
                        disabled={assigningDeviceId === device.id}
                      >
                        <option value="">
                          {assigningDeviceId === device.id ? 'Asignando...' : 'Disponible'}
                        </option>
                        {users.map(u => <option key={u.id} value={u.id}>{u.fullName}</option>)}
                      </select>
                      <LinkIcon size={16} className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--color-text-secondary)' }} />
                    </div>
                    {device.assignedUserName && (
                      <p className="text-xs text-green-400 mt-2">
                        ✓ Asignado a: {device.assignedUserName}
                      </p>
                    )}
                  </div>
                </div>

                {/* Indicador de Estado */}
                <div className="absolute top-0 right-0 p-4 pointer-events-none">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]"></span>
                    <span className="text-[10px] font-bold text-green-500 uppercase tracking-widest">Activo</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Paginación */}
          {Math.ceil(devices.length / itemsPerPage) > 1 && (
            <div className="pb-8">
              <Pagination
                currentPage={currentPage}
                totalPages={Math.ceil(devices.length / itemsPerPage)}
                onPageChange={setCurrentPage}
              />
            </div>
          )}
        </>
      )}

      <DeviceModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={loadData}
      />

      {/* Modal de Detalles del Dispositivo */}
      {selectedDevice && (
                <div 
                  className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                  onClick={() => setSelectedDevice(null)}
                >
                  <div 
                    className="glass-panel rounded-2xl max-w-4xl w-full p-8 relative max-h-[90vh] overflow-y-auto"
                    style={{ backgroundColor: 'var(--color-bg-secondary)' }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button 
                      onClick={() => setSelectedDevice(null)}
                      className="absolute top-4 right-4 transition-colors"
                      style={{ color: 'var(--color-text-secondary)' }}
                    >
                      <X size={24} />
                    </button>

                    <div className="mb-8">
                      <h2 className="text-3xl font-bold mb-2" style={{ color: 'var(--color-text-primary)' }}>
                        {(selectedDevice as any).alias || 'Dispositivo'}
                      </h2>
                      <p className="font-mono text-sm" style={{ color: 'var(--color-text-secondary)' }}>ID: {selectedDevice.id}</p>
                    </div>

                    <div className="mb-8">
                      <h3 className="text-xl font-bold mb-4 flex items-center gap-2" style={{ color: 'var(--color-text-primary)' }}>
                        <Activity size={20} className="text-indigo-400" />
                        Historial de Eventos
                      </h3>
              
                      {loadingEvents ? (
                        <div className="flex justify-center py-12">
                          <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                        </div>
                      ) : deviceEvents.length > 0 ? (
                        <div className="space-y-3">
                          {deviceEvents.map((event) => (
                            <div 
                              key={event.id} 
                              className="rounded-lg p-4 hover:bg-white/10 transition-colors border"
                              style={{ backgroundColor: 'var(--color-bg-elevated)', borderColor: 'var(--color-border)' }}
                            >
                              <div className="flex justify-between items-start mb-2">
                                <div className="flex items-center gap-3">
                                  <Calendar size={16} className="text-indigo-400" />
                                  <span className="font-semibold text-sm" style={{ color: 'var(--color-text-primary)' }}>
                                    {event.occurredAt ? new Date(event.occurredAt).toLocaleString() : '-'}
                                  </span>
                                </div>
                                <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                                  event.status === 'OPEN' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                                  event.status === 'CONFIRMED_FALL' ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20' :
                                  event.status === 'FALSE_ALARM' ? 'bg-gray-500/10 text-gray-400 border border-gray-500/20' :
                                  'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                }`}>
                                  {event.status}
                                </span>
                              </div>
                              <p style={{ color: 'var(--color-text-secondary)' }} className="text-sm">{event.eventType}</p>
                              {event.reviewedBy && (
                                <p className="text-xs mt-2" style={{ color: 'var(--color-text-secondary)' }}>
                                  Revisado por: {event.reviewedBy}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-12" style={{ color: 'var(--color-text-secondary)' }}>
                          <Activity size={48} className="mx-auto mb-4 opacity-20" />
                          <p>No hay eventos registrados para este dispositivo</p>
                        </div>
                      )}
                    </div>

                    <button 
                      onClick={() => setSelectedDevice(null)}
                      className="w-full bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white py-3 rounded-lg font-semibold transition-all"
                    >
                      Cerrar
                    </button>
                  </div>
                </div>
              )}

      {/* Modal de Asignar Paciente */}
      {isPatientModalOpen && selectedDeviceForPatient && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setIsPatientModalOpen(false)}
        >
          <div 
            className="glass-panel rounded-2xl max-w-md w-full p-8 relative"
            style={{ backgroundColor: 'var(--color-bg-secondary)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <button 
              onClick={() => setIsPatientModalOpen(false)}
              className="absolute top-4 right-4 transition-colors"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              <X size={24} />
            </button>

            <div className="mb-6">
              <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--color-text-primary)' }}>Asignar Paciente</h2>
              <p style={{ color: 'var(--color-text-secondary)' }}>Dispositivo: {selectedDeviceForPatient.alias || selectedDeviceForPatient.id}</p>
            </div>

            <div className="space-y-3 max-h-[60vh] overflow-y-auto">
              {/* Opción de sin paciente */}
              <button
                onClick={() => handleAssignPatient(null)}
                disabled={assigningPatientToDeviceId === selectedDeviceForPatient.id}
                className="w-full p-4 text-left bg-[var(--color-bg-elevated)] hover:bg-[var(--color-bg-primary)] rounded-lg transition-all disabled:opacity-50"
                style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-gray-500"></div>
                  <span>Sin paciente</span>
                </div>
              </button>

              {/* Opciones de pacientes */}
              {patients.length > 0 ? (
                patients.map((patient) => (
                  <button
                    key={patient.patientId}
                    onClick={() => handleAssignPatient(patient.patientId)}
                    disabled={assigningPatientToDeviceId === selectedDeviceForPatient.id}
                    className={`w-full p-4 text-left rounded-lg transition-all disabled:opacity-50 ${
                      selectedDeviceForPatient.patientId === patient.patientId
                        ? 'bg-indigo-600/20 border border-indigo-500/50'
                        : 'bg-[var(--color-bg-elevated)] hover:bg-[var(--color-bg-primary)] border'
                    }`}
                    style={{ borderColor: selectedDeviceForPatient.patientId === patient.patientId ? undefined : 'var(--color-border)', color: 'var(--color-text-primary)' }}
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-3 h-3 rounded-full bg-indigo-400 mt-1"></div>
                      <div>
                        <p className="font-semibold">{patient.patientName}</p>
                        {patient.nif && <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>NIF: {patient.nif}</p>}
                        {patient.city && <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>{patient.city}</p>}
                      </div>
                    </div>
                  </button>
                ))
              ) : (
                <div className="text-center py-8" style={{ color: 'var(--color-text-secondary)' }}>
                  <Users size={32} className="mx-auto mb-2 opacity-20" />
                  <p>No hay pacientes disponibles</p>
                </div>
              )}
            </div>

            {assigningPatientToDeviceId === selectedDeviceForPatient.id && (
              <div className="mt-4 flex justify-center">
                <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};