import React, { useState, useEffect } from 'react';
import { AdminService } from '../services/adminService';
import { Device, User } from '../types';
import { DeviceModal } from '../components/DeviceModal';

export const DevicePage: React.FC = () => {
  const [devices, setDevices] = useState<Device[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deviceToEdit, setDeviceToEdit] = useState<Device | undefined>(undefined);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setLoading(true);
    Promise.all([AdminService.getDevices(), AdminService.getUsers()])
      .then(([devRes, userRes]) => {
        setDevices(devRes.data);
        setUsers(userRes.data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  const handleCreate = () => {
    setDeviceToEdit(undefined);
    setIsModalOpen(true);
  };

  const handleEdit = (device: Device) => {
    setDeviceToEdit(device);
    setIsModalOpen(true);
  };

  const handleSuccess = () => {
    loadData();
    setIsModalOpen(false);
  };

  // Quick assignment change from card
  const handleAssign = async (deviceId: string, userId: string) => {
    try {
      await AdminService.assignDevice(deviceId, userId);
      // Optimistic update
      setDevices(devices.map(d => d.id === deviceId ? { ...d, assignedUserId: userId || null } : d));
    } catch (e) {
      alert("Error al asignar dispositivo.");
    }
  };

  if (loading) return <p className="p-6">Cargando inventario...</p>;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Inventario de Dispositivos IoT</h2>
        <button
          onClick={handleCreate}
          className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 shadow"
        >
          + Nuevo Dispositivo
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {devices.map(device => {
          const assignedUser = users.find(u => u.id === device.assignedUserId);
          return (
            <div key={device.id} className="border border-gray-200 p-5 rounded-lg shadow-sm bg-white hover:shadow-md transition-shadow relative">
              <div className="absolute top-4 right-4">
                <button
                  onClick={() => handleEdit(device)}
                  className="text-gray-400 hover:text-blue-600"
                  title="Editar"
                >
                  ✏️
                </button>
              </div>

              <h3 className="font-bold text-lg text-gray-800 mb-1">{device.alias}</h3>
              <p className="text-gray-500 text-sm mb-4 font-mono bg-gray-100 inline-block px-2 py-1 rounded">
                ID: {device.id}
              </p>

              <div className="mt-2">
                <label className="text-xs font-bold uppercase text-gray-500 tracking-wide block mb-1">
                  Asignado a:
                </label>
                <div className="relative">
                  <select
                    className={`w-full border p-2 rounded appearance-none ${device.assignedUserId ? 'bg-green-50 border-green-200' : 'bg-gray-50'}`}
                    value={device.assignedUserId || ""}
                    onChange={(e) => handleAssign(device.id, e.target.value)}
                  >
                    <option value="">-- Disponible (Sin asignar) --</option>
                    {users
                      .filter(u => u.role === 'MEMBER')
                      .map(user => (
                        <option key={user.id} value={user.id}>
                          {user.fullName}
                        </option>
                      ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                    <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" /></svg>
                  </div>
                </div>
                {assignedUser && (
                  <p className="text-xs text-green-700 mt-1">
                    ✅ Vinculado a {assignedUser.fullName}
                  </p>
                )}
              </div>
            </div>
          );
        })}
        {devices.length === 0 && (
          <div className="col-span-full text-center py-10 bg-gray-50 rounded border border-dashed">
            <p className="text-gray-500">No hay dispositivos registrados.</p>
            <button onClick={handleCreate} className="text-purple-600 underline mt-2">Registrar el primero</button>
          </div>
        )}
      </div>

      <DeviceModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleSuccess}
        deviceToEdit={deviceToEdit}
      />
    </div>
  );
};
