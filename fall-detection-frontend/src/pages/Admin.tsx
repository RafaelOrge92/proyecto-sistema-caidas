import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AdminService } from '../services/adminService';
import { User, Device } from '../types';
import { Users, HardDrive, RefreshCw, Activity } from 'lucide-react';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';

const Admin = () => {
  const [activeTab, setActiveTab] = useState<'home' | 'users' | 'devices' | 'podium'>('users');
  const [users, setUsers] = useState<User[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
  const [podium, setPodium] = useState<Array<{ device_id: string; count: number }>>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  const isPodiumOnly = new URLSearchParams(location.search).get('tab') === 'podium';

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [usersRes, devicesRes] = await Promise.all([
          AdminService.getUsers(),
          AdminService.getDevices()
        ]);
        setUsers(usersRes.data);
        setDevices(devicesRes.data);

        try {
          const podiumRes = await AdminService.getDevicePodium();
          setPodium(podiumRes.data);
        } catch (error) {
          console.error('Error cargando podium:', error);
          setPodium([]);
        }
      } catch (error) {
        console.error('Error cargando datos admin:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  useEffect(() => {
    const tab = new URLSearchParams(location.search).get('tab');
    if (tab === 'users' || tab === 'devices' || tab === 'podium' || tab === 'home') {
      setActiveTab(tab);
    }
  }, [location.search]);

  return (
    <div className="min-h-screen pt-24 px-8 reveal">
      <div className="max-w-7xl mx-auto">
        {!isPodiumOnly && (
          <header className="flex flex-col md:flex-row justify-between items-end mb-16 gap-8">
            <div className="space-y-2">
              <h1 className="text-6xl font-bold tracking-tighter text-white">Consola de Control</h1>
              <p className="text-xl text-[var(--color-text-secondary)] font-medium">Gestión avanzada de infraestructura y seguridad.</p>
            </div>
            <div className="flex bg-white/5 p-1 rounded-full backdrop-blur-xl border border-white/10">
              <button
                onClick={() => {
                  setActiveTab('home');
                  navigate('/Dashboard');
                }}
                className={`px-8 py-3 rounded-full text-sm font-bold transition-all ${activeTab === 'home' ? 'bg-white text-black shadow-lg' : 'text-[#94A3B8] hover:text-white'}`}
              >
                Home
              </button>
              <button 
                onClick={() => setActiveTab('users')}
                className={`px-8 py-3 rounded-full text-sm font-bold transition-all ${activeTab === 'users' ? 'bg-white text-black shadow-lg' : 'text-[#94A3B8] hover:text-white'}`}
              >
                Usuarios
              </button>
              <button 
                onClick={() => setActiveTab('devices')}
                className={`px-8 py-3 rounded-full text-sm font-bold transition-all ${activeTab === 'devices' ? 'bg-white text-black shadow-lg' : 'text-[#94A3B8] hover:text-white'}`}
              >
                Dispositivos
              </button>
              <button 
                onClick={() => setActiveTab('podium')}
                className={`px-8 py-3 rounded-full text-sm font-bold transition-all ${activeTab === 'podium' ? 'bg-white text-black shadow-lg' : 'text-[#94A3B8] hover:text-white'}`}
              >
                Podium
              </button>
            </div>
          </header>
        )}

        <Card noPadding className="border-none bg-transparent shadow-none">
          {loading ? (
            <div className="flex justify-center py-16">
              <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : isPodiumOnly ? (
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <Activity size={24} className="text-amber-400" />
                <h2 className="text-2xl font-bold text-white">Dispositivos con mas eventos</h2>
              </div>
              {podium.length === 0 ? (
                <Card className="text-center py-12 border-dashed border-white/10 bg-transparent">
                  <p className="text-[var(--color-text-secondary)]">No hay datos de podium disponibles.</p>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {podium.slice(0, 6).map((item, index) => (
                    <Card key={`${item.device_id}-${index}`} hover className="border-white/5">
                      <div className="flex items-center justify-between mb-6">
                        <div className={`text-4xl font-bold ${
                          index === 0 ? 'text-amber-400' :
                          index === 1 ? 'text-gray-300' :
                          index === 2 ? 'text-amber-700' :
                          'text-indigo-400'
                        }`}>
                          #{index + 1}
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-[var(--color-text-secondary)] uppercase tracking-widest">Eventos</p>
                          <p className="text-3xl font-bold text-white">{item.count}</p>
                        </div>
                      </div>
                      <p className="text-white font-semibold truncate">Dispositivo {item.device_id}</p>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          ) : activeTab === 'users' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {users.map(user => (
                <Card key={user.id} hover className="border-white/5">
                  <div className="flex justify-between items-start mb-6">
                    <div className="w-12 h-12 bg-indigo-500/20 rounded-2xl flex items-center justify-center text-indigo-400 font-bold">
                      {user.fullName.charAt(0)}
                    </div>
                    <Badge variant={user.role === 'ADMIN' ? 'error' : 'info'}>{user.role}</Badge>
                  </div>
                  <h3 className="text-xl font-bold text-white mb-1">{user.fullName}</h3>
                  <p className="text-[var(--color-text-secondary)] text-sm mb-6">{user.email}</p>
                  <Button variant="outline" size="sm" fullWidth>Configurar Perfil</Button>
                </Card>
              ))}
            </div>
          ) : activeTab === 'devices' ? (
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
               {devices.map(device => (
                 <Card key={device.id} hover className="border-white/5">
                   <div className="flex justify-between items-center mb-8">
                      <HardDrive className="text-[var(--color-primary)]" size={32} />
                      <Badge variant={(device as any).isActive ? 'success' : 'default'}>
                        {(device as any).isActive ? 'En Línea' : 'Desconectado'}
                      </Badge>
                   </div>
                   <h3 className="text-2xl font-bold text-white mb-2">{(device as any).alias || device.id}</h3>
                   <p className="text-sm text-[var(--color-text-secondary)] mb-6">Paciente: {(device as any).patientName || 'No asignado'}</p>
                   <div className="flex gap-3">
                     <Button variant="outline" size="sm" className="flex-1">Logs</Button>
                     <Button variant="secondary" size="sm" className="flex-1">Editar</Button>
                   </div>
                 </Card>
               ))}
             </div>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <Activity size={24} className="text-amber-400" />
                <h2 className="text-2xl font-bold text-white">Dispositivos con mas eventos</h2>
              </div>
              {podium.length === 0 ? (
                <Card className="text-center py-12 border-dashed border-white/10 bg-transparent">
                  <p className="text-[var(--color-text-secondary)]">No hay datos de podium disponibles.</p>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {podium.slice(0, 6).map((item, index) => (
                    <Card key={`${item.device_id}-${index}`} hover className="border-white/5">
                      <div className="flex items-center justify-between mb-6">
                        <div className={`text-4xl font-bold ${
                          index === 0 ? 'text-amber-400' :
                          index === 1 ? 'text-gray-300' :
                          index === 2 ? 'text-amber-700' :
                          'text-indigo-400'
                        }`}>
                          #{index + 1}
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-[var(--color-text-secondary)] uppercase tracking-widest">Eventos</p>
                          <p className="text-3xl font-bold text-white">{item.count}</p>
                        </div>
                      </div>
                      <p className="text-white font-semibold truncate">Dispositivo {item.device_id}</p>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default Admin;