import React, { useState, useEffect } from 'react';
import { AdminService } from '../services/adminService';
import { User, UserRole } from '../types';
import Button from './ui/Button';

interface UserFormProps {
  initialData?: User;
  onSuccess: () => void;
  onCancel: () => void;
}

export const UserForm: React.FC<UserFormProps> = ({ initialData, onSuccess, onCancel }) => {
  const [formData, setFormData] = useState({
    fullName: '', email: '', password: '', role: 'MEMBER' as UserRole, isActive: true
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (initialData) setFormData({ ...initialData, password: '' });
  }, [initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      if (initialData?.id) {
        await AdminService.updateUser(initialData.id, {
          fullName: formData.fullName,
          role: formData.role
        });
      } else {
        await AdminService.createUser({
          fullName: formData.fullName,
          email: formData.email,
          password: formData.password,
          role: formData.role
        });
      }
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.error || 'No se pudo guardar el usuario');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-900/30 border border-red-500/50 text-red-200 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}
      <div className="space-y-2">
        <label className="text-xs font-bold text-[var(--color-text-secondary)] uppercase px-1">Nombre Completo</label>
        <input
          type="text"
          className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white focus:ring-2 focus:ring-[var(--color-primary)] outline-none transition-all"
          value={formData.fullName}
          onChange={e => setFormData({ ...formData, fullName: e.target.value })}
          required
        />
      </div>

      <div className="space-y-2">
        <label className="text-xs font-bold text-[var(--color-text-secondary)] uppercase px-1">Email</label>
        <input
          type="email"
          className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white focus:ring-2 focus:ring-[var(--color-primary)] outline-none transition-all disabled:opacity-50"
          value={formData.email}
          disabled={!!initialData}
          onChange={e => setFormData({ ...formData, email: e.target.value })}
          required
        />
      </div>

      {!initialData && (
        <div className="space-y-2">
          <label className="text-xs font-bold text-[var(--color-text-secondary)] uppercase px-1">Contrasena</label>
          <input
            type="password"
            className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white focus:ring-2 focus:ring-[var(--color-primary)] outline-none transition-all"
            value={formData.password}
            onChange={e => setFormData({ ...formData, password: e.target.value })}
            required
          />
        </div>
      )}

      <div className="space-y-2">
        <label className="text-xs font-bold text-[var(--color-text-secondary)] uppercase px-1">Rol de Acceso</label>
        <select
          className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white outline-none appearance-none cursor-pointer"
          value={formData.role}
          onChange={e => setFormData({ ...formData, role: e.target.value as UserRole })}
        >
          <option value="MEMBER">Miembro (Paciente)</option>
          <option value="ADMIN">Administrador</option>
        </select>
      </div>

      <div className="flex gap-4 pt-4">
        <Button variant="ghost" fullWidth onClick={onCancel}>Cancelar</Button>
        <Button variant="primary" fullWidth disabled={submitting}>
          {submitting ? 'Guardando...' : (initialData ? 'Guardar' : 'Crear')}
        </Button>
      </div>
    </form>
  );
};