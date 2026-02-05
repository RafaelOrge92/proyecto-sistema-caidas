import React, { useEffect, useState } from 'react';
import { AdminService } from '../services/adminService';
import { User, UserRole } from '../types';
import { UserModal } from '../components/UserModal';
import { ArrowUpDown, Search, Filter } from 'lucide-react';

export const UsersPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [userToEdit, setUserToEdit] = useState<User | undefined>(undefined);

  // Filter & Sort state
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<UserRole | 'ALL'>('ALL');
  const [sortConfig, setSortConfig] = useState<{ key: keyof User; direction: 'asc' | 'desc' } | null>(null);

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

  const handleSort = (key: keyof User) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // Logic for filtering, sorting and displaying users
  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.fullName.toLowerCase().includes(searchTerm.toLowerCase()) || 
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = roleFilter === 'ALL' ? true : user.role === roleFilter;

    return matchesSearch && matchesRole;
  });

  const sortedUsers = [...filteredUsers].sort((a, b) => {
    if (!sortConfig) return 0;
    const { key, direction } = sortConfig;
    
    // Handle specific cases if any property is undefined or different types
    const valA = a[key] ?? '';
    const valB = b[key] ?? '';

    if (valA < valB) return direction === 'asc' ? -1 : 1;
    if (valA > valB) return direction === 'asc' ? 1 : -1;
    return 0;
  });

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentUsers = sortedUsers.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(sortedUsers.length / itemsPerPage);

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  if (loading) return <p className="p-6">Cargando datos...</p>;

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Gestión de Usuarios</h2>
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <button
          onClick={handleCreate}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition order-2 md:order-1"
        >
          + Nuevo Usuario
        </button>

        <div className="flex gap-4 w-full md:w-auto order-1 md:order-2">
          {/* Search Input */}
          <div className="relative flex-grow md:flex-grow-0">
            <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Buscar por nombre o email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border rounded-lg w-full md:w-64 focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          {/* Role Filter */}
          <div className="relative">
            <Filter className="absolute left-3 top-2.5 text-gray-400" size={18} />
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as UserRole | 'ALL')}
              className="pl-10 pr-8 py-2 border rounded-lg appearance-none bg-white focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer"
            >
              <option value="ALL">Todos los Roles</option>
              <option value="ADMIN">Administrador</option>
              <option value="MEMBER">Miembro</option>
            </select>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto shadow-md rounded-lg">
        <table className="min-w-full bg-white border">
          <thead className="bg-gray-100">
            <tr>
              <th 
                className="py-3 px-4 border text-left cursor-pointer hover:bg-gray-200 transition select-none"
                onClick={() => handleSort('fullName')}
              >
                <div className="flex items-center gap-1">
                  Nombre
                  <ArrowUpDown size={14} className={sortConfig?.key === 'fullName' ? 'text-blue-600' : 'text-gray-400'} />
                </div>
              </th>
              <th 
                className="py-3 px-4 border text-left cursor-pointer hover:bg-gray-200 transition select-none"
                onClick={() => handleSort('email')}
              >
                <div className="flex items-center gap-1">
                  Email
                  <ArrowUpDown size={14} className={sortConfig?.key === 'email' ? 'text-blue-600' : 'text-gray-400'} />
                </div>
              </th>
              <th 
                className="py-3 px-4 border text-left cursor-pointer hover:bg-gray-200 transition select-none"
                onClick={() => handleSort('role')}
              >
                <div className="flex items-center gap-1">
                  Rol
                  <ArrowUpDown size={14} className={sortConfig?.key === 'role' ? 'text-blue-600' : 'text-gray-400'} />
                </div>
              </th>
              <th className="py-3 px-4 border text-center">Estado</th>
              <th className="py-3 px-4 border text-center">Acciones</th>
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
