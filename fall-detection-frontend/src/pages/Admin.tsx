import React, { useEffect, useState } from 'react';
import { AdminService } from '../services/adminService';
import { User, Device } from '../types';
import { Users, HardDrive, RefreshCw, Edit, Eye, Activity } from 'lucide-react';
import Card from '../components/ui/Card';

const Admin = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'users' | 'devices'>('users');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const usersRes = await AdminService.getUsers();
      const devicesRes = await AdminService.getDevices();
      
      setUsers(usersRes.data);
      setDevices(devicesRes.data);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al cargar datos');
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0F1419]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#6366F1] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <div className="text-xl text-[#94A3B8]">Cargando datos...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0F1419] particle-bg p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 animate-fade-in">
          <div>
            <h1 className="text-3xl font-bold text-[#F1F5F9] flex items-center gap-3 mb-2">
              <Activity className="w-8 h-8 text-[#6366F1]" />
              Panel de Administración
            </h1>
            <p className="text-[#94A3B8]">Gestiona usuarios y dispositivos del sistema</p>
          </div>
          <button
            onClick={loadData}
            className="flex items-center gap-2 bg-[#252B35] text-[#94A3B8] hover:text-[#F1F5F9] hover:bg-[#2D3440] px-4 py-2 rounded-lg transition-all shadow-lg hover-lift"
          >
            <RefreshCw className="w-4 h-4" />
            Actualizar
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-6 animate-slide-in">
          <button
            onClick={() => setActiveTab('users')}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all hover-lift ${
              activeTab === 'users'
                ? 'bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] text-white shadow-lg glow-primary'
                : 'bg-[#1A1F26] text-[#94A3B8] border border-[#1E293B] hover:border-[#6366F1] hover:text-[#F1F5F9]'
            }`}
          >
            <Users className="w-5 h-5" />
            Usuarios ({users.length})
          </button>
          <button
            onClick={() => setActiveTab('devices')}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all hover-lift ${
              activeTab === 'devices'
                ? 'bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] text-white shadow-lg glow-primary'
                : 'bg-[#1A1F26] text-[#94A3B8] border border-[#1E293B] hover:border-[#6366F1] hover:text-[#F1F5F9]'
            }`}
          >
            <HardDrive className="w-5 h-5" />
            Dispositivos ({devices.length})
          </button>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-[#DC2626]/10 border border-[#DC2626]/30 rounded-lg animate-pulse">
            <p className="text-[#EF4444] flex items-center gap-2">
              <span>❌</span>
              {error}
            </p>
          </div>
        )}

        {/* Usuarios Tab */}
        {activeTab === 'users' && (
          <Card className="overflow-hidden animate-scale-in" hover glow>
            <div className="p-8 bg-[#1A1F26]">
              <h2 className="text-2xl font-bold text-[#F1F5F9] mb-8 flex items-center gap-2">
                <Users className="w-6 h-6 text-[#6366F1]" />
                Gestión de Usuarios
              </h2>
              {users.length === 0 ? (
                <p className="text-[#94A3B8] text-center py-12">No hay usuarios registrados</p>
              ) : (
                <div className="overflow-x-auto bg-[#0F1419] rounded-lg">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-[#252B35] border-b border-[#1E293B]">
                        <th className="px-8 py-5 text-left text-sm font-bold text-[#F1F5F9]">Nombre</th>
                        <th className="px-8 py-5 text-left text-sm font-bold text-[#F1F5F9]">Email</th>
                        <th className="px-8 py-5 text-left text-sm font-bold text-[#F1F5F9]">Rol</th>
                        <th className="px-8 py-5 text-left text-sm font-bold text-[#F1F5F9]">Teléfono</th>
                        <th className="px-8 py-5 text-left text-sm font-bold text-[#F1F5F9]">Estado</th>
                        <th className="px-8 py-5 text-left text-sm font-bold text-[#F1F5F9]">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="bg-[#1A1F26]">
                      {users.map((user) => (
                        <tr key={user.id} className="border-b border-[#1E293B] hover:bg-[#252B35] transition-all">
                          <td className="px-8 py-5 text-sm text-[#F1F5F9] font-medium">{user.fullName || 'N/A'}</td>
                          <td className="px-8 py-5 text-sm text-[#94A3B8]">{user.email}</td>
                          <td className="px-8 py-5 text-sm">
                            <span
                              className={`inline-flex items-center px-4 py-1.5 rounded-full text-xs font-bold ${
                                user.role === 'ADMIN'
                                  ? 'bg-[#DC2626]/20 text-[#EF4444] border border-[#EF4444]/30'
                                  : 'bg-[#06B6D4]/20 text-[#06B6D4] border border-[#06B6D4]/30'
                              }`}
                            >
                              {user.role}
                            </span>
                          </td>
                          <td className="px-8 py-5 text-sm text-[#94A3B8]">
                            {(user as any).phone || 'N/A'}
                          </td>
                          <td className="px-8 py-5 text-sm">
                            <span
                              className={`inline-flex items-center px-4 py-1.5 rounded-full text-xs font-bold border ${
                                user.isActive
                                  ? 'bg-[#10B981]/20 text-[#10B981] border-[#10B981]/30'
                                  : 'bg-[#64748B]/20 text-[#64748B] border-[#64748B]/30'
                              }`}
                            >
                              {user.isActive ? '✓ Activo' : '✗ Inactivo'}
                            </span>
                          </td>
                          <td className="px-8 py-5 text-sm">
                            <button className="flex items-center gap-2 text-[#6366F1] hover:text-[#818CF8] font-semibold transition-colors hover:bg-[#6366F1]/10 px-3 py-2 rounded">
                              <Edit className="w-4 h-4" />
                              Editar
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </Card>
        )}
        {/* Dispositivos Tab */}
        {activeTab === 'devices' && (
          <Card className="overflow-hidden animate-scale-in" hover glow>
            <div className="p-8 bg-[#1A1F26]">
              <h2 className="text-2xl font-bold text-[#F1F5F9] mb-8 flex items-center gap-2">
                <HardDrive className="w-6 h-6 text-[#6366F1]" />
                Gestión de Dispositivos
              </h2>
              {devices.length === 0 ? (
                <p className="text-[#94A3B8] text-center py-12">No hay dispositivos registrados</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {devices.map((device) => (
                    <div
                      key={device.id}
                      className="bg-[#252B35] border border-[#1E293B] rounded-xl p-6 hover:border-[#6366F1] hover:shadow-xl transition-all hover-lift"
                    >
                      <div className="flex items-start justify-between mb-6">
                        <h3 className="text-lg font-bold text-[#F1F5F9] flex items-center gap-2">
                          <HardDrive className="w-5 h-5 text-[#06B6D4]" />
                          {(device as any).alias || device.id}
                        </h3>
                        <span
                          className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold border ${
                            (device as any).isActive
                              ? 'bg-[#10B981]/20 text-[#10B981] border-[#10B981]/30'
                              : 'bg-[#64748B]/20 text-[#64748B] border-[#64748B]/30'
                          }`}
                        >
                          {(device as any).isActive ? '🟢 Activo' : '⚪ Inactivo'}
                        </span>
                      </div>
                      
                      <div className="space-y-3 text-sm mb-6 pb-6 border-b border-[#1E293B]">
                        <p className="text-[#94A3B8]">
                          <span className="font-semibold text-[#F1F5F9]">ID:</span> <code className="bg-[#1A1F26] px-2 py-1 rounded text-xs">{device.id}</code>
                        </p>
                        <p className="text-[#94A3B8]">
                          <span className="font-semibold text-[#F1F5F9]">Paciente:</span>{' '}
                          {(device as any).patientName || <span className="text-[#64748B] italic">Sin asignar</span>}
                        </p>
                        <p className="text-[#64748B]">
                          <span className="font-semibold text-[#94A3B8]">Última conexión:</span>{' '}
                          {(device as any).lastSeen
                            ? new Date((device as any).lastSeen).toLocaleString('es-ES')
                            : 'Nunca'}
                        </p>
                      </div>
                      
                      <div className="flex gap-3">
                        <button className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] text-white px-4 py-3 rounded-lg text-sm font-bold hover:from-[#818CF8] hover:to-[#A78BFA] transition-all shadow-md hover:shadow-lg">
                          <Edit className="w-4 h-4" />
                          Editar
                        </button>
                        <button className="flex-1 flex items-center justify-center gap-2 bg-[#1A1F26] text-[#94A3B8] hover:text-[#F1F5F9] hover:bg-[#2D3440] border border-[#1E293B] px-4 py-3 rounded-lg text-sm font-bold transition-all">
                          <Eye className="w-4 h-4" />
                          Detalles
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Admin;