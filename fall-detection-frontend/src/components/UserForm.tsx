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
        <div className="border px-4 py-3 rounded-lg text-sm" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', borderColor: 'rgba(239, 68, 68, 0.5)', color: 'var(--color-text-primary)' }}>
          {error}
        </div>
      )}
      <div className="space-y-2">
        <label className="text-xs font-bold text-[var(--color-text-secondary)] uppercase px-1">Nombre Completo</label>
        <input
          type="text"
          className="w-full border rounded-2xl p-4 focus:ring-2 focus:ring-[var(--color-primary)] outline-none transition-all"
          style={{ backgroundColor: 'var(--color-bg-primary)', color: 'var(--color-text-primary)', borderColor: 'var(--color-border)' }}
          value={formData.fullName}
          onChange={e => setFormData({ ...formData, fullName: e.target.value })}
          required
        />
      </div>

      <div className="space-y-2">
        <label className="text-xs font-bold text-[var(--color-text-secondary)] uppercase px-1">Email</label>
        <input
          type="email"
          className="w-full border rounded-2xl p-4 focus:ring-2 focus:ring-[var(--color-primary)] outline-none transition-all disabled:opacity-50"
          style={{ backgroundColor: 'var(--color-bg-primary)', color: 'var(--color-text-primary)', borderColor: 'var(--color-border)' }}
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
            className="w-full border rounded-2xl p-4 focus:ring-2 focus:ring-[var(--color-primary)] outline-none transition-all"
            style={{ backgroundColor: 'var(--color-bg-primary)', color: 'var(--color-text-primary)', borderColor: 'var(--color-border)' }}
            value={formData.password}
            onChange={e => setFormData({ ...formData, password: e.target.value })}
            required
          />
        </div>
      )}

      <div className="space-y-2">
        <label className="text-xs font-bold text-[var(--color-text-secondary)] uppercase px-1">Rol de Acceso</label>
        <select
          className="w-full border rounded-2xl p-4 outline-none appearance-none cursor-pointer"
          style={{ backgroundColor: 'var(--color-bg-primary)', color: 'var(--color-text-primary)', borderColor: 'var(--color-border)' }}
          value={formData.role}
          onChange={e => setFormData({ ...formData, role: e.target.value as UserRole })}
        >
          <option value="MEMBER">Miembro</option>
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