import React, { useEffect, useState } from 'react';
import { AdminService } from '../services/adminService';
import { User, Device } from '../types';

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
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-xl text-gray-600">Cargando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">👨‍💼 Panel de Administración</h1>
          <button
            onClick={loadData}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            🔄 Actualizar
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-6">
          <button
            onClick={() => setActiveTab('users')}
            className={`px-6 py-2 rounded-lg font-semibold transition ${
              activeTab === 'users'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            👥 Usuarios ({users.length})
          </button>
          <button
            onClick={() => setActiveTab('devices')}
            className={`px-6 py-2 rounded-lg font-semibold transition ${
              activeTab === 'devices'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            📱 Dispositivos ({devices.length})
          </button>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800">❌ {error}</p>
          </div>
        )}

        {/* Usuarios Tab */}
        {activeTab === 'users' && (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="p-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Gestión de Usuarios</h2>
              {users.length === 0 ? (
                <p className="text-gray-600">No hay usuarios registrados</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-100 border-b">
                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Nombre</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Email</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Rol</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Teléfono</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Estado</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((user) => (
                        <tr key={user.id} className="border-b hover:bg-gray-50 transition">
                          <td className="px-6 py-3 text-sm text-gray-800">{user.fullName || 'N/A'}</td>
                          <td className="px-6 py-3 text-sm text-gray-600">{user.email}</td>
                          <td className="px-6 py-3 text-sm">
                            <span
                              className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                                user.role === 'ADMIN'
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-blue-100 text-blue-800'
                              }`}
                            >
                              {user.role}
                            </span>
                          </td>
                          <td className="px-6 py-3 text-sm text-gray-600">
                            {(user as any).phone || 'N/A'}
                          </td>
                          <td className="px-6 py-3 text-sm">
                            <span
                              className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                                user.isActive
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-gray-100 text-gray-800'
                              }`}
                            >
                              {user.isActive ? '✓ Activo' : '✗ Inactivo'}
                            </span>
                          </td>
                          <td className="px-6 py-3 text-sm">
                            <button className="text-blue-600 hover:text-blue-800 font-semibold">
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
          </div>
        )}

        {/* Dispositivos Tab */}
        {activeTab === 'devices' && (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="p-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Gestión de Dispositivos</h2>
              {devices.length === 0 ? (
                <p className="text-gray-600">No hay dispositivos registrados</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {devices.map((device) => (
                    <div
                      key={device.id}
                      className="border border-gray-200 rounded-lg p-4 hover:shadow-lg transition"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <h3 className="text-lg font-bold text-gray-800">
                          📱 {(device as any).alias || device.id}
                        </h3>
                        <span
                          className={`inline-block px-2 py-1 rounded text-xs font-semibold ${
                            (device as any).isActive
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {(device as any).isActive ? '🟢 Activo' : '⚪ Inactivo'}
                        </span>
                      </div>
                      <div className="space-y-2 text-sm text-gray-600">
                        <p>
                          <strong>ID:</strong> {device.id}
                        </p>
                        <p>
                          <strong>Paciente:</strong> {(device as any).patientName || 'Sin asignar'}
                        </p>
                        <p>
                          <strong>Última conexión:</strong>{' '}
                          {(device as any).lastSeen
                            ? new Date((device as any).lastSeen).toLocaleString('es-ES')
                            : 'Nunca'}
                        </p>
                      </div>
                      <div className="flex gap-2 mt-4">
                        <button className="flex-1 bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 transition">
                          Editar
                        </button>
                        <button className="flex-1 bg-gray-300 text-gray-700 px-3 py-1 rounded text-sm hover:bg-gray-400 transition">
                          Detalles
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Admin;