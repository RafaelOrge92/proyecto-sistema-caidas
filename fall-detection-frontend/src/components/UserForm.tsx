import React, { useState, useEffect } from 'react';
import { AdminService } from '../services/adminService';
import { User, UserRole } from '../types';
import Button from './ui/Button';
import { FormInput, FormSelect } from './FormInput';

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
      
      <FormInput
        label="Nombre Completo"
        type="text"
        value={formData.fullName}
        onChange={e => setFormData({ ...formData, fullName: e.target.value })}
        required
      />

      <FormInput
        label="Email"
        type="email"
        value={formData.email}
        onChange={e => setFormData({ ...formData, email: e.target.value })}
        disabled={!!initialData}
        required
      />

      {!initialData && (
        <FormInput
          label="Contraseña"
          type="password"
          value={formData.password}
          onChange={e => setFormData({ ...formData, password: e.target.value })}
          required
        />
      )}

      <FormSelect
        label="Rol de Acceso"
        options={[
          { value: 'MEMBER', label: 'Miembro' },
          { value: 'ADMIN', label: 'Administrador' }
        ]}
        value={formData.role}
        onChange={e => setFormData({ ...formData, role: e.target.value as UserRole })}
      />

      <div className="flex gap-4 pt-4">
        <Button variant="ghost" fullWidth onClick={onCancel}>Cancelar</Button>
        <Button variant="primary" fullWidth disabled={submitting} type="submit">
          {submitting ? 'Guardando...' : (initialData ? 'Guardar' : 'Crear')}
        </Button>
      </div>
    </form>
  );
};