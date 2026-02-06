import React, { useState, useEffect } from 'react';
import { AdminService } from '../services/adminService';
import { User, UserRole } from '../types';

interface UserFormProps {
  initialData?: User;
  onSuccess: () => void;
  onCancel: () => void;
}

export const UserForm: React.FC<UserFormProps> = ({ initialData, onSuccess, onCancel }) => {
  const [formData, setFormData] = useState<{
    fullName: string;
    email: string;
    password: string;
    role: UserRole;
    isActive: boolean;
  }>({
    fullName: '',
    email: '',
    password: '',
    role: 'MEMBER',
    isActive: true
  });

  const [errors, setErrors] = useState<any>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (initialData) {
      setFormData({
        fullName: initialData.fullName,
        email: initialData.email,
        password: '', // No pre-fill password for security/logic reasons usually
        role: initialData.role,
        isActive: initialData.isActive
      });
    }
  }, [initialData]);

  // Lógica de Validación Manual
  const validate = () => {
    let tempErrors: any = {};
    if (!formData.fullName.trim()) tempErrors.name = "El nombre es obligatorio.";

    // Regex simple para email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) tempErrors.email = "Email inválido.";

    // Validación de contraseña (mínimo 6 caracteres) - Solo si es creación o si el usuario intenta cambiarla
    if (!initialData && formData.password.length < 6) {
      tempErrors.password = "Mínimo 6 caracteres.";
    }
    if (initialData && formData.password && formData.password.length < 6) {
      tempErrors.password = "Mínimo 6 caracteres.";
    }

    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setIsSubmitting(true);

    try {
      if (initialData) {
        await AdminService.updateUser(initialData.id, formData);
        alert("Usuario actualizado correctamente");
      } else {
        await AdminService.createUser(formData);
        alert("Usuario creado correctamente");
      }
      onSuccess();
    } catch (error) {
      console.error(error);
      alert("Error al guardar usuario.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-bold">Nombre Completo</label>
        <input
          type="text"
          className="w-full border p-2 rounded"
          value={formData.fullName}
          onChange={e => setFormData({ ...formData, fullName: e.target.value })}
        />
        {errors.name && <p className="text-red-500 text-xs">{errors.name}</p>}
      </div>

      <div>
        <label className="block text-sm font-bold">Email</label>
        <input
          type="email"
          className="w-full border p-2 rounded"
          value={formData.email}
          onChange={e => setFormData({ ...formData, email: e.target.value })}
          disabled={!!initialData} // Usually email is unique/ID, maybe disable edit
        />
        {errors.email && <p className="text-red-500 text-xs">{errors.email}</p>}
      </div>

      <div>
        <label className="block text-sm font-bold">
          {initialData ? 'Nueva Contraseña (dejalo en blanco para no cambiar)' : 'Contraseña'}
        </label>
        <input
          type="password"
          className="w-full border p-2 rounded"
          value={formData.password}
          onChange={e => setFormData({ ...formData, password: e.target.value })}
        />
        {errors.password && <p className="text-red-500 text-xs">{errors.password}</p>}
      </div>

      <div>
        <label className="block text-sm font-bold">Rol</label>
        <select
          className="w-full border p-2 rounded"
          value={formData.role}
          onChange={e => setFormData({ ...formData, role: e.target.value as UserRole })}
        >
          <option value="USUARIO">Usuario (Paciente)</option>
          <option value="CUIDADOR">Cuidador</option>
          <option value="ADMIN">Administrador</option>
        </select>
      </div>

      <div className="flex gap-2 justify-end">
        <button type="button" onClick={onCancel} className="px-4 py-2 text-gray-600 hover:text-gray-800">
          Cancelar
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:bg-blue-300"
        >
          {isSubmitting ? 'Guardando...' : (initialData ? 'Actualizar' : 'Crear')}
        </button>
      </div>
    </form>
  );
};
