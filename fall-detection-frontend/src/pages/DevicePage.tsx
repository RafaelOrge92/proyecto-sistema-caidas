import React, { useState, useEffect } from 'react';
import { AdminService } from '../services/adminService';
import { Device, User, FallEvent } from '../types';
import { Laptop, Plus, Settings2, Link as LinkIcon, X, Activity, Calendar } from 'lucide-react';
import { DeviceModal } from '../components/DeviceModal';

export const DevicePage: React.FC = () => {
  const [devices, setDevices] = useState<Device[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [assigningDeviceId, setAssigningDeviceId] = useState<string | null>(null);
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [deviceEvents, setDeviceEvents] = useState<FallEvent[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(false);

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
      const [devRes, userRes] = await Promise.all([
        AdminService.getDevices(), 
        AdminService.getUsers()
      ]);
      setDevices(devRes.data);
      setUsers(userRes.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
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

  return (
    <div className="p-8 max-w-7xl mx-auto reveal">
      <header className="flex justify-between items-end mb-12">
        <div>
          <h1 className="text-5xl font-bold tracking-tight text-white">Dispositivos</h1>
          <p className="text-xl text-[#94A3B8] mt-2">Hardware vinculado a tu red de protección.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="w-12 h-12 rounded-full bg-white text-black flex items-center justify-center hover:scale-110 transition-transform shadow-xl"
        >
          <Plus size={24} />
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {devices.map((device) => (
          /* TODO lo de abajo debe estar dentro de este único DIV con clase glass-panel */
          <div key={device.id} className="glass-panel p-8 group relative overflow-hidden">
            <div className="flex justify-between items-start mb-10">
              <div className="w-14 h-14 bg-[#252B35] rounded-2xl flex items-center justify-center text-[#6366F1]">
                <Laptop size={28} />
              </div>
              <button 
                className="text-gray-500 hover:text-white transition-colors"
                onClick={() => loadDeviceDetails(device)}
              >
                <Settings2 size={20} />
              </button>
            </div>

            <h3 className="text-2xl font-bold mb-2 text-white">{(device as any).alias || 'Sin nombre'}</h3>
            <p className="text-xs font-mono text-[#94A3B8] mb-8 tracking-widest uppercase">ID: {device.id}</p>

            <div className="space-y-4">
              <label className="text-xs font-bold text-[#94A3B8] uppercase tracking-tighter block">Asignación de Usuario</label>
              <div className="relative">
                <select
                  value={device.assignedUserId || ""}
                  className="w-full bg-[#0F1419] border-none text-white rounded-xl py-3 px-4 appearance-none focus:ring-2 focus:ring-[#6366F1] transition-all cursor-pointer disabled:opacity-50"
                  onChange={(e) => handleAssignDevice(device.id, e.target.value)}
                  disabled={assigningDeviceId === device.id}
                >
                  <option value="">
                    {assigningDeviceId === device.id ? 'Asignando...' : 'Disponible'}
                  </option>
                  {users.map(u => <option key={u.id} value={u.id}>{u.fullName}</option>)}
                </select>
                <LinkIcon size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
              </div>
              {device.assignedUserName && (
                <p className="text-xs text-green-400">
                  ✓ Asignado a: {device.assignedUserName}
                </p>
              )}
            </div>

            {/* Indicador de Estado - Asegúrate que esté DENTRO del div superior */}
            <div className="absolute top-0 right-0 p-4">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]"></span>
                <span className="text-[10px] font-bold text-green-500 uppercase tracking-widest">Activo</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <DeviceModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={loadData}
      />

      {/* Modal de Detalles del Dispositivo */}
      {selectedDevice && (
                <div 
                  className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                  onClick={() => setSelectedDevice(null)}
                >
                  <div 
                    className="bg-[#1A1F26] rounded-2xl max-w-4xl w-full p-8 border border-white/10 relative max-h-[90vh] overflow-y-auto"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button 
                      onClick={() => setSelectedDevice(null)}
                      className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
                    >
                      <X size={24} />
                    </button>

                    <div className="mb-8">
                      <h2 className="text-3xl font-bold text-white mb-2">
                        {(selectedDevice as any).alias || 'Dispositivo'}
                      </h2>
                      <p className="text-[#94A3B8] font-mono text-sm">ID: {selectedDevice.id}</p>
                    </div>

                    <div className="mb-8">
                      <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
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
                              className="bg-white/5 rounded-lg p-4 hover:bg-white/10 transition-colors border border-white/5"
                            >
                              <div className="flex justify-between items-start mb-2">
                                <div className="flex items-center gap-3">
                                  <Calendar size={16} className="text-indigo-400" />
                                  <span className="text-white font-semibold text-sm">
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
                              <p className="text-[#94A3B8] text-sm">{event.eventType}</p>
                              {event.reviewedBy && (
                                <p className="text-xs text-[#64748B] mt-2">
                                  Revisado por: {event.reviewedBy}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-12 text-[#64748B]">
                          <Activity size={48} className="mx-auto mb-4 opacity-20" />
                          <p>No hay eventos registrados para este dispositivo</p>
                        </div>
                      )}
                    </div>

                    <button 
                      onClick={() => setSelectedDevice(null)}
                      className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-lg font-semibold transition-all"
                    >
                      Cerrar
                    </button>
                  </div>
                </div>
              )}
    </div>
  );
};