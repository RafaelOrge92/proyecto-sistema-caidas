import React, { useEffect, useState } from 'react';
import { AdminService } from '../services/adminService';
import { User } from '../types';
import { UserModal } from '../components/UserModal';

export const UsersPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [userToEdit, setUserToEdit] = useState<User | undefined>(undefined);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Cargar usuarios al montar el componente
  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const response = await AdminService.getUsers();
      setUsers(response.data);
    } catch (error) {
      console.error("Error cargando usuarios", error);
    } finally {
      setLoading(false);
    }
  };

  // Manejo del Soft Delete
  const handleDelete = async (user: User) => {
    if (!window.confirm(`¿Seguro que deseas desactivar a ${user.fullName}?`)) return;

    try {
      await AdminService.softDeleteUser(user.id);
      // Actualizamos el estado local para reflejar el cambio sin recargar
      setUsers(users.map(u => u.id === user.id ? { ...u, isActive: false } : u));
    } catch (error) {
      alert("Error al desactivar usuario");
    }
  };

  const handleCreate = () => {
    setUserToEdit(undefined);
    setIsModalOpen(true);
  };

  const handleEdit = (user: User) => {
    setUserToEdit(user);
    setIsModalOpen(true);
  };

  const handleSuccess = () => {
    loadUsers();
    setIsModalOpen(false);
  };

  // Logic for displaying current users
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentUsers = users.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(users.length / itemsPerPage);

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  if (loading) return <p className="p-6">Cargando datos...</p>;

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Gestión de Usuarios</h2>
      <button
        onClick={handleCreate}
        className="bg-blue-500 text-white px-4 py-2 rounded mb-4 hover:bg-blue-600"
      >
        + Nuevo Usuario
      </button>

      <div className="overflow-x-auto shadow-md rounded-lg">
        <table className="min-w-full bg-white border">
          <thead className="bg-gray-100">
            <tr>
              <th className="py-2 px-4 border text-left">Nombre</th>
              <th className="py-2 px-4 border text-left">Email</th>
              <th className="py-2 px-4 border text-left">Rol</th>
              <th className="py-2 px-4 border text-center">Estado</th>
              <th className="py-2 px-4 border text-center">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {currentUsers.map(user => (
              <tr key={user.id} className="hover:bg-gray-50">
                <td className="p-2 border">{user.fullName}</td>
                <td className="p-2 border">{user.email}</td>
                <td className="p-2 border">{user.role}</td>
                <td className="p-2 border text-center">
                  <span className={`px-2 py-1 rounded-full text-xs ${user.isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                    {user.isActive ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
                <td className="p-2 border text-center space-x-2">
                  <button
                    onClick={() => handleEdit(user)}
                    className="bg-yellow-500 text-white px-2 py-1 rounded text-sm hover:bg-yellow-600"
                  >
                    Editar
                  </button>
                  {user.isActive && (
                    <button
                      onClick={() => handleDelete(user)}
                      className="bg-red-500 text-white px-2 py-1 rounded text-sm hover:bg-red-600"
                    >
                      Desactivar
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {currentUsers.length === 0 && (
              <tr>
                <td colSpan={5} className="p-4 text-center text-gray-500">No hay usuarios registrados.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="mt-4 flex justify-center space-x-2">
        <button
          onClick={() => paginate(currentPage - 1)}
          disabled={currentPage === 1}
          className="px-3 py-1 border rounded disabled:opacity-50"
        >
          Anterior
        </button>
        <span className="px-3 py-1">Página {currentPage} de {totalPages || 1}</span>
        <button
          onClick={() => paginate(currentPage + 1)}
          disabled={currentPage === totalPages || totalPages === 0}
          className="px-3 py-1 border rounded disabled:opacity-50"
        >
          Siguiente
        </button>
      </div>

      <UserModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleSuccess}
        userToEdit={userToEdit}
      />
    </div>
  );
};
