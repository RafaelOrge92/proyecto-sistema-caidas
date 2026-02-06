import React, { useState, useEffect } from 'react';
import { AdminService } from '../services/adminService';
import { Device, User } from '../types';
import { Laptop, Plus, Settings2, Link as LinkIcon } from 'lucide-react';

export const DevicePage: React.FC = () => {
  const [devices, setDevices] = useState<Device[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [devRes, userRes] = await Promise.all([AdminService.getDevices(), AdminService.getUsers()]);
      setDevices(devRes.data);
      setUsers(userRes.data);
    } finally { setLoading(false); }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto reveal">
      <header className="flex justify-between items-end mb-12">
        <div>
          <h1 className="text-5xl font-bold tracking-tight">Dispositivos</h1>
          <p className="text-xl text-[var(--color-text-secondary)] mt-2">Hardware vinculado a tu red de protección.</p>
        </div>
        <button className="w-12 h-12 rounded-full bg-white text-black flex items-center justify-center hover:scale-110 transition-transform shadow-xl">
          <Plus size={24} />
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {devices.map(device => (
          <div key={device.id} className="glass-panel p-8 group relative overflow-hidden">
            <div className="flex justify-between items-start mb-10">
              <div className="w-14 h-14 bg-[var(--color-bg-elevated)] rounded-2xl flex items-center justify-center text-[var(--color-primary)]">
                <Laptop size={28} />
              </div>
              <button className="text-gray-500 hover:text-white transition-colors">
                <Settings2 size={20} />
              </button>
            </div>

            <h3 className="text-2xl font-bold mb-2">{device.alias}</h3>
            <p className="text-xs font-mono text-[var(--color-text-secondary)] mb-8 tracking-widest uppercase">ID: {device.deviceId}</p>

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
          </div>
        ))}
      </div>
    </div>
  );
};