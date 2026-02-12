import React, { useEffect, useMemo, useState } from 'react';
import { Activity, HardDrive, Search, UserCheck, Users as UsersIcon } from 'lucide-react';
import { AdminService } from '../services/adminService';
import { Device } from '../types';

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

  useEffect(() => {
    const loadData = async () => {
      try {
        const response = await AdminService.getDevices();
        setDevices(response.data);
      } catch (error) {
        console.error('Error cargando pacientes:', error);
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
      const userText = patient.assignedUsers.join(' ').toLowerCase();
      const deviceText = patient.devices.map((device) => `${device.alias || ''} ${device.id}`).join(' ').toLowerCase();

      return (
        patient.name.toLowerCase().includes(normalizedSearch) ||
        (patient.patientId || '').toLowerCase().includes(normalizedSearch) ||
        userText.includes(normalizedSearch) ||
        deviceText.includes(normalizedSearch)
      );
    });
  }, [patients, normalizedSearch]);

  return (
    <div className="p-8 max-w-7xl mx-auto reveal">
      <header className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
        <div>
          <h1 className="text-5xl font-bold tracking-tight mb-2 text-white">Pacientes</h1>
          <p className="text-xl text-[var(--color-text-secondary)]">
            Vista consolidada de pacientes segun dispositivos y asignaciones activas.
          </p>
        </div>
      </header>

      <div className="relative mb-8">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
        <input
          type="text"
          placeholder="Buscar por nombre, paciente, usuario o dispositivo..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-[#1A1F26] border-none rounded-2xl py-4 pl-12 pr-6 focus:ring-2 focus:ring-indigo-500 transition-all outline-none text-lg text-white"
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filteredPatients.length === 0 ? (
        <div className="glass-panel p-12 text-center">
          <Activity className="mx-auto mb-4 text-[#64748B]" size={48} />
          <p className="text-[var(--color-text-secondary)]">
            {normalizedSearch ? 'No hay pacientes que coincidan con la busqueda.' : 'No hay pacientes registrados en los dispositivos.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredPatients.map((patient) => (
            <div key={patient.key} className="glass-panel p-6 border border-white/10">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 bg-indigo-500/15 rounded-2xl flex items-center justify-center">
                  <UsersIcon size={22} className="text-indigo-300" />
                </div>
                <span className="text-xs px-3 py-1 rounded-full bg-white/5 text-[#94A3B8]">
                  {patient.devices.length} disp.
                </span>
              </div>

              <h2 className="text-xl font-bold text-white mb-1">{patient.name}</h2>
              <p className="text-sm text-[var(--color-text-secondary)] mb-4">
                {patient.patientId ? `ID paciente: ${patient.patientId}` : 'Sin patient_id registrado'}
              </p>

              <div className="space-y-3">
                <div>
                  <p className="text-xs uppercase tracking-widest text-[#64748B] mb-2">Usuarios asignados</p>
                  {patient.assignedUsers.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {patient.assignedUsers.map((assignedUser) => (
                        <span key={assignedUser} className="px-2.5 py-1 rounded-full bg-cyan-500/10 text-cyan-300 text-xs flex items-center gap-1">
                          <UserCheck size={12} />
                          {assignedUser}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-[#94A3B8]">Sin usuarios asignados</p>
                  )}
                </div>

                <div>
                  <p className="text-xs uppercase tracking-widest text-[#64748B] mb-2">Dispositivos vinculados</p>
                  <div className="space-y-2">
                    {patient.devices.map((device) => (
                      <div key={device.id} className="flex items-center justify-between px-3 py-2 rounded-lg bg-white/5">
                        <div className="flex items-center gap-2 min-w-0">
                          <HardDrive size={14} className="text-indigo-300 shrink-0" />
                          <p className="text-sm text-white truncate">{device.alias || device.id}</p>
                        </div>
                        <span className={`text-[11px] font-semibold ${device.isActive ? 'text-emerald-300' : 'text-[#94A3B8]'}`}>
                          {device.isActive ? 'Activo' : 'Offline'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

