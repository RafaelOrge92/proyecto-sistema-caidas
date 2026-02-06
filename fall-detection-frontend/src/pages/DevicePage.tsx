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

            <div className="space-y-4">
              <label className="text-xs font-bold text-[var(--color-text-secondary)] uppercase tracking-tighter block">Asignación de Usuario</label>
              <div className="relative">
                <select
                  value={device.assignedUserId || ""}
                  className="w-full bg-[var(--color-bg-primary)] border-none rounded-xl py-3 px-4 appearance-none focus:ring-2 focus:ring-[var(--color-primary)] transition-all cursor-pointer"
                >
                  <option value="">Disponible</option>
                  {users.map(u => <option key={u.id} value={u.id}>{u.fullName}</option>)}
                </select>
                <LinkIcon size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
              </div>
            </div>

            {/* Indicador de Estado Sutil */}
            <div className="absolute top-0 right-0 p-4">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]"></span>
                <span className="text-[10px] font-bold text-green-500 uppercase tracking-widest">Activo</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};