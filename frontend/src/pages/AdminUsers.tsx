import React, { useEffect, useState } from 'react';
import { adminService, type User } from '../services/adminService';
import { authService } from '../services/authService';
import { normalizeRut, normalizePhone } from '@shared/utils/validators';
import { AddressInput } from '../components/ui/AddressInput';

type RoleKey = User['role'];

type RoleOption = {
  key: RoleKey;
  label: string;
  description?: string;
  priority?: number;
};

const DEFAULT_ROLE_OPTIONS: RoleOption[] = [
  {
    key: 'usuario',
    label: 'Usuario / Socio',
    description: 'Acceso básico al portal de socios.',
    priority: 100
  },
  {
    key: 'director',
    label: 'Director',
    description: 'Gestión avanzada de socios y cuotas.',
    priority: 60
  },
  {
    key: 'director_editor',
    label: 'Director Editor',
    description: 'Puede administrar contenido y revisar postulaciones.',
    priority: 80
  },
  {
    key: 'admin',
    label: 'Administrador',
    description: 'Acceso total al sistema.',
    priority: 40
  }
];

const isRoleKey = (value: string): value is RoleKey =>
  ['usuario', 'director', 'director_editor', 'admin'].includes(value);

type Pagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext?: boolean;
  hasPrev?: boolean;
};

export default function AdminUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [roleOptions, setRoleOptions] = useState<RoleOption[]>(DEFAULT_ROLE_OPTIONS);
  const roleLabelMap = React.useMemo(() => {
    return roleOptions.reduce<Record<string, string>>((accumulator, option) => {
      accumulator[option.key] = option.label;
      return accumulator;
    }, {});
  }, [roleOptions]);

  useEffect(() => {
    let cancelled = false;

    const loadRoleCatalog = async () => {
      try {
        const catalog = await adminService.getRoleCatalog();
        if (!catalog || catalog.length === 0 || cancelled) {
          return;
        }

        const mappedRoles: RoleOption[] = [...catalog]
          .sort((a, b) => (b.priority ?? 100) - (a.priority ?? 100))
          .filter((item) => isRoleKey(item.key))
          .map((item) => ({
            key: item.key as RoleKey,
            label: item.label ?? item.key,
            description: item.description,
            priority: item.priority
          }));

        if (mappedRoles.length === 0 || cancelled) {
          return;
        }

        setRoleOptions((current) => {
          const merged = [...current];
          const existingKeys = new Set(current.map((option) => option.key));

          mappedRoles.forEach((option) => {
            if (existingKeys.has(option.key)) {
              const index = merged.findIndex((item) => item.key === option.key);
              if (index !== -1) {
                merged[index] = option;
              }
            } else {
              merged.push(option);
            }
          });

          return [...merged].sort((a, b) => (b.priority ?? 100) - (a.priority ?? 100));
        });
      } catch (error) {
        console.error('Error cargando catálogo de roles:', error);
      }
    };

    loadRoleCatalog();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const user = authService.getUser();
    const userRole = user?.role;
    if (!authService.isAdmin() && userRole !== 'director') {
      setError('Acceso denegado. Se requieren permisos de administrador o director.');
      setLoading(false);
      return;
    }

    console.log('🔍 [AdminUsers] Search triggered:', { searchTerm, currentPage, selectedRole });
    
    // Debounce para el término de búsqueda
    const timeoutId = setTimeout(() => {
      console.log('🔍 [AdminUsers] Loading users after debounce');
      loadUsers();
    }, searchTerm ? 300 : 0); // 300ms de debounce solo cuando hay término de búsqueda

    return () => {
      console.log('🔍 [AdminUsers] Cleanup - canceling timeout');
      clearTimeout(timeoutId);
    };
  }, [currentPage, searchTerm, selectedRole]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      console.log('🔍 [AdminUsers] Calling API with params:', {
        page: currentPage,
        search: searchTerm || undefined,
        role: selectedRole || undefined
      });
      const response = await adminService.getUsers({
        page: currentPage,
        limit: 20,
        search: searchTerm || undefined,
        role: selectedRole === 'all' ? undefined : selectedRole
      });

      setUsers(response.users ?? []);
      if (response.users && response.users.length > 0) {
        setRoleOptions((current) => {
          const existingKeys = new Set(current.map((option) => option.key));
          let updated = current;

          response.users.forEach((user) => {
            if (!existingKeys.has(user.role)) {
              const fallback = DEFAULT_ROLE_OPTIONS.find((option) => option.key === user.role);
              const option: RoleOption = fallback
                ? { ...fallback }
                : {
                    key: user.role,
                    label: user.role.charAt(0).toUpperCase() + user.role.slice(1),
                    description: undefined,
                    priority: -10
                  };
              if (updated === current) {
                updated = [...current, option];
              } else {
                updated.push(option);
              }
              existingKeys.add(user.role);
            }
          });

          if (updated === current) {
            return current;
          }

          return [...updated].sort((a, b) => (b.priority ?? 100) - (a.priority ?? 100));
        });
      }
      setPagination(response.pagination ?? null);
      setError(null);
    } catch (err) {
      console.error('Error cargando usuarios:', err);
      setError(err instanceof Error ? err.message : 'Error cargando los usuarios');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar este usuario?')) {
      return;
    }

    try {
      await adminService.deleteUser(userId);
      await loadUsers(); // Recargar lista
    } catch (err) {
      console.error('Error eliminando usuario:', err);
      alert(err instanceof Error ? err.message : 'Error eliminando el usuario');
    }
  };

  const handleUpdateUserRole = async (userId: string, newRole: RoleKey) => {
    try {
      await adminService.updateUser(userId, { role: newRole });
      await loadUsers(); // Recargar lista
    } catch (err) {
      console.error('Error actualizando usuario:', err);
      alert(err instanceof Error ? err.message : 'Error actualizando el rol del usuario');
    }
  };

  const formatDate = (dateStr?: string | null): string => {
    if (!dateStr) {
      return 'Fecha no disponible';
    }

    const date = new Date(dateStr);
    if (Number.isNaN(date.getTime())) {
      return 'Fecha no disponible';
    }

    return date.toLocaleString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getRoleBadgeColor = (role: string): string => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800';
      case 'super_admin': return 'bg-red-200 text-red-900';
      case 'director': return 'bg-purple-100 text-purple-800';
      case 'director_editor': return 'bg-blue-100 text-blue-800';
      case 'usuario': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading && users.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando usuarios...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
          <div className="flex items-center">
            <div className="text-red-400 mr-3">⚠️</div>
            <div>
              <h3 className="text-red-800 font-medium">Error</h3>
              <p className="text-red-600 mt-1">{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Gestión de Usuarios
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                Administrar usuarios del sistema
              </p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
            >
              ➕ Crear Usuario
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filtros */}
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Buscar usuarios
              </label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Nombre de usuario o email..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filtrar por rol
              </label>
              <select
                value={selectedRole}
                onChange={(e) => {
                  setSelectedRole(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Todos los roles</option>
                {roleOptions.map((option) => (
                  <option key={option.key} value={option.key}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-end">
              <button
                onClick={loadUsers}
                disabled={loading}
                className="w-full bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors disabled:opacity-50"
              >
                {loading ? '🔄 Cargando...' : '🔍 Buscar'}
              </button>
            </div>
          </div>
        </div>

        {/* Lista de usuarios */}
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Usuarios del Sistema
            </h3>
            {pagination && (
              <p className="mt-1 text-sm text-gray-500">
                Mostrando {users.length} de {pagination.total} usuarios
              </p>
            )}
          </div>

          {users.length > 0 ? (
            <ul className="divide-y divide-gray-200">
              {users.map((user) => (
                <li key={user.id}>
                  <div className="px-4 py-4 sm:px-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                            <span className="text-blue-600 font-medium text-sm">
                              {(user.name?.charAt(0)?.toUpperCase() || user.email?.charAt(0)?.toUpperCase() || '?')}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="flex items-center">
                            <div className="text-sm font-medium text-gray-900">
                              {user.name || 'Usuario sin nombre'}
                            </div>
                            <span className={`ml-2 px-2 py-1 text-xs font-semibold rounded-full ${getRoleBadgeColor(user.role)}`}>
                              {roleLabelMap[user.role] ?? user.role}
                            </span>
                          </div>
                          <div className="text-sm text-gray-500">
                            {user.email || 'Sin email registrado'}
                          </div>
                          <div className="text-xs text-gray-400">
                            Creado: {formatDate(user.created_at)}
                            {user.last_login && (
                              <span className="ml-2">
                                • Último acceso: {formatDate(user.last_login)}
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-gray-400 mt-1">
                            Estado: {user.status === 'inactive' ? 'Inactivo' : 'Activo'}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        {/* Cambiar rol */}
                        <select
                          value={user.role}
                          onChange={(e) => handleUpdateUserRole(user.id, e.target.value as RoleKey)}
                          className="text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          {roleOptions.map((option) => (
                            <option key={option.key} value={option.key}>
                              {option.label}
                            </option>
                          ))}
                        </select>

                        {/* Botón de editar */}
                        <button
                          onClick={() => setEditingUser(user)}
                          className="text-blue-600 hover:text-blue-800 px-2 py-1 text-sm"
                        >
                          ✏️ Editar
                        </button>

                        {/* Botón de eliminar */}
                        <button
                          onClick={() => handleDeleteUser(user.id)}
                          className="text-red-600 hover:text-red-800 px-2 py-1 text-sm"
                        >
                          🗑️ Eliminar
                        </button>
                      </div>
                    </div>

                    {/* Estadísticas del usuario */}
                    {user.stats && (
                      <div className="mt-3 grid grid-cols-3 gap-4 text-sm text-gray-500">
                        <div>
                          📅 {user.stats.events_created ?? 0} eventos creados
                        </div>
                        <div>
                          📝 {user.stats.inscriptions ?? 0} inscripciones
                        </div>
                        <div>
                          💬 {user.stats.comments ?? 0} comentarios
                        </div>
                      </div>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="px-4 py-8 text-center text-gray-500">
              <div className="text-4xl mb-2">👥</div>
              <p>No se encontraron usuarios</p>
            </div>
          )}
        </div>

        {/* Paginación */}
        {pagination && pagination.totalPages > 1 && (
          <div className="mt-6 flex justify-center">
            <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
              >
                Anterior
              </button>

              {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                const page = i + 1;
                return (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                      currentPage === page
                        ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                        : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                    }`}
                  >
                    {page}
                  </button>
                );
              })}

              <button
                onClick={() => setCurrentPage(Math.min(pagination.totalPages, currentPage + 1))}
                disabled={currentPage === pagination.totalPages}
                className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
              >
                Siguiente
              </button>
            </nav>
          </div>
        )}
      </div>

      {/* Modal de crear usuario */}
      {showCreateModal && (
        <CreateUserModal
          onClose={() => setShowCreateModal(false)}
          onUserCreated={() => {
            setShowCreateModal(false);
            loadUsers();
          }}
          roleOptions={roleOptions}
        />
      )}

      {/* Modal de editar usuario */}
      {editingUser && (
        <EditUserModal
          user={editingUser}
          onClose={() => setEditingUser(null)}
          onUserUpdated={() => {
            setEditingUser(null);
            loadUsers();
          }}
          roleOptions={roleOptions}
        />
      )}
    </div>
  );
}

// Componente para crear usuario
function CreateUserModal({ onClose, onUserCreated, roleOptions }: {
  onClose: () => void;
  onUserCreated: () => void;
  roleOptions: RoleOption[];
}) {
  const defaultRole: RoleKey = roleOptions[0]?.key ?? 'usuario';
  const [formData, setFormData] = useState<{
    name: string;
    email: string;
    password: string;
    role: RoleKey;
    send_welcome_email: boolean;
    rut: string;
    telefono: string;
    ciudad: string;
    direccion: string;
  }>(() => ({
    name: '',
    email: '',
    password: '',
    role: defaultRole,
    send_welcome_email: false,
    rut: '',
    telefono: '',
    ciudad: '',
    direccion: ''
  }));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const selectedRoleOption = roleOptions.find((option) => option.key === formData.role);

  useEffect(() => {
    setFormData((prev) => {
      const available = new Set(roleOptions.map((option) => option.key));
      if (available.has(prev.role)) {
        return prev;
      }

      return {
        ...prev,
        role: roleOptions[0]?.key ?? 'usuario'
      };
    });
  }, [roleOptions]);

  const validateAndNormalizeFields = () => {
    const errors: Record<string, string> = {};

    // Validar RUT si está presente
    if (formData.rut.trim()) {
      try {
        console.log('🔍 Validando RUT en submit:', formData.rut);
        const normalizedRut = normalizeRut(formData.rut);
        console.log('✅ RUT normalizado en submit:', normalizedRut);
        setFormData(prev => ({ ...prev, rut: normalizedRut }));
      } catch (err) {
        console.error('❌ Error validando RUT en submit:', err);
        errors.rut = err instanceof Error ? err.message : 'RUT inválido';
      }
    }

    // Validar teléfono si está presente
    if (formData.telefono.trim()) {
      try {
        console.log('🔍 Validando teléfono en submit:', formData.telefono);
        const normalizedPhone = normalizePhone(formData.telefono);
        console.log('✅ Teléfono normalizado en submit:', normalizedPhone);
        setFormData(prev => ({ ...prev, telefono: normalizedPhone }));
      } catch (err) {
        console.error('❌ Error validando teléfono en submit:', err);
        errors.telefono = err instanceof Error ? err.message : 'Teléfono inválido';
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.email || !formData.password) {
      setError('Nombre, email y contraseña son requeridos');
      return;
    }

    // Validar y normalizar campos antes de enviar
    if (!validateAndNormalizeFields()) {
      setError('Por favor corrige los errores en el formulario');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Preparar datos para envío
      const userData = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        password: formData.password,
        role: formData.role,
        send_welcome_email: formData.send_welcome_email,
        rut: formData.rut.trim() || undefined,
        telefono: formData.telefono.trim() || undefined,
        ciudad: formData.ciudad.trim() || undefined,
        direccion: formData.direccion.trim() || undefined
      };

      console.log('📤 Enviando datos del usuario:', userData);
      await adminService.createUser(userData);

      // Limpiar formulario
      setFormData({
        name: '',
        email: '',
        password: '',
        role: roleOptions[0]?.key ?? 'usuario',
        send_welcome_email: false,
        rut: '',
        telefono: '',
        ciudad: '',
        direccion: ''
      });
      setValidationErrors({});
      onUserCreated();
    } catch (err) {
      console.error('Error creando usuario:', err);
      setError(err instanceof Error ? err.message : 'Error creando el usuario');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Crear Nuevo Usuario
          </h3>
          
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Nombre completo
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Contraseña
              </label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                RUT (opcional)
              </label>
              <input
                type="text"
                value={formData.rut}
                onChange={(e) => {
                  const value = e.target.value;
                  console.log('🔄 RUT onChange - Input value:', value);

                  // Limpiar errores previos
                  if (validationErrors.rut) {
                    setValidationErrors(prev => ({ ...prev, rut: '' }));
                  }

                  // Formatear en tiempo real mientras escribe
                  let formattedValue = value;
                  if (value.trim()) {
                    try {
                      // Normalizar completamente en vivo
                      const cleanValue = value.replace(/[^0-9kK]/g, '');
                      console.log('🧹 RUT cleaned value:', cleanValue);

                      if (cleanValue.length >= 8) {
                        formattedValue = normalizeRut(cleanValue);
                        console.log('✅ RUT normalized live:', formattedValue);
                      } else {
                        // Formateo básico mientras escribe
                        formattedValue = cleanValue.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
                        if (cleanValue.length > 7) {
                          const body = cleanValue.slice(0, -1);
                          const dv = cleanValue.slice(-1);
                          formattedValue = `${body.replace(/\B(?=(\d{3})+(?!\d))/g, '.')}-${dv}`;
                        }
                        console.log('📝 RUT formatted basic:', formattedValue);
                      }
                    } catch (err) {
                      console.error('❌ Error formatting RUT live:', err);
                      // Si hay error, mantener el valor limpio
                      formattedValue = value.replace(/[^0-9kK.\-]/g, '');
                    }
                  }

                  console.log('💾 RUT setting formData to:', formattedValue);
                  setFormData({ ...formData, rut: formattedValue });
                }}
                onBlur={() => {
                  // Validar completamente al perder foco
                  if (formData.rut.trim()) {
                    try {
                      console.log('🔍 Validando RUT al perder foco:', formData.rut);
                      const normalizedRut = normalizeRut(formData.rut);
                      console.log('✅ RUT normalizado final:', normalizedRut);
                      setFormData(prev => ({ ...prev, rut: normalizedRut }));
                      setValidationErrors(prev => ({ ...prev, rut: '' }));
                    } catch (err) {
                      console.error('❌ Error validando RUT final:', err);
                      setValidationErrors(prev => ({
                        ...prev,
                        rut: err instanceof Error ? err.message : 'RUT inválido'
                      }));
                    }
                  }
                }}
                placeholder="12.345.678-9"
                className={`mt-1 block w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${validationErrors.rut ? 'border-red-500' : 'border-gray-300'}`}
              />
              {validationErrors.rut && (
                <p className="mt-1 text-sm text-red-600">{validationErrors.rut}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Teléfono (opcional)
              </label>
              <input
                type="text"
                value={formData.telefono}
                onChange={(e) => {
                  const value = e.target.value;
                  console.log('🔄 Phone onChange - Input value:', value);

                  // Limpiar errores previos
                  if (validationErrors.telefono) {
                    setValidationErrors(prev => ({ ...prev, telefono: '' }));
                  }

                  // Formatear en tiempo real mientras escribe
                  let formattedValue = value;
                  if (value.trim()) {
                    try {
                      // Normalizar completamente en vivo
                      const cleanValue = value.replace(/[^0-9]/g, '');
                      console.log('🧹 Phone cleaned value:', cleanValue);

                      if (cleanValue.length >= 9) {
                        formattedValue = normalizePhone(cleanValue);
                        console.log('✅ Phone normalized live:', formattedValue);
                      } else if (cleanValue.length >= 8) {
                        // Formateo básico mientras escribe
                        formattedValue = `+56${cleanValue}`;
                        console.log('📝 Phone formatted basic:', formattedValue);
                      } else {
                        formattedValue = cleanValue;
                      }
                    } catch (err) {
                      console.error('❌ Error formatting phone live:', err);
                      // Si hay error, mantener el valor limpio
                      formattedValue = value.replace(/[^0-9+]/g, '');
                    }
                  }

                  console.log('💾 Phone setting formData to:', formattedValue);
                  setFormData({ ...formData, telefono: formattedValue });
                }}
                onBlur={() => {
                  // Validar completamente al perder foco
                  if (formData.telefono.trim()) {
                    try {
                      console.log('🔍 Validando teléfono al perder foco:', formData.telefono);
                      const normalizedPhone = normalizePhone(formData.telefono);
                      console.log('✅ Teléfono normalizado final:', normalizedPhone);
                      setFormData(prev => ({ ...prev, telefono: normalizedPhone }));
                      setValidationErrors(prev => ({ ...prev, telefono: '' }));
                    } catch (err) {
                      console.error('❌ Error validando teléfono final:', err);
                      setValidationErrors(prev => ({
                        ...prev,
                        telefono: err instanceof Error ? err.message : 'Teléfono inválido'
                      }));
                    }
                  }
                }}
                placeholder="+56912345678"
                className={`mt-1 block w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${validationErrors.telefono ? 'border-red-500' : 'border-gray-300'}`}
              />
              {validationErrors.telefono && (
                <p className="mt-1 text-sm text-red-600">{validationErrors.telefono}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Ciudad (opcional)
              </label>
              <input
                type="text"
                value={formData.ciudad}
                onChange={(e) => setFormData({ ...formData, ciudad: e.target.value })}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Dirección (opcional)
              </label>
              <AddressInput
                value={formData.direccion}
                onChange={(value) => setFormData({ ...formData, direccion: value })}
                placeholder="Ingresa tu dirección completa"
                className="mt-1"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Rol
              </label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value as RoleKey })}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {roleOptions.map((option) => (
                  <option key={option.key} value={option.key}>
                    {option.label}
                  </option>
                ))}
              </select>
              {selectedRoleOption?.description && (
                <p className="mt-1 text-xs text-gray-500">
                  {selectedRoleOption.description}
                </p>
              )}
            </div>

            <div className="flex items-center justify-between">
              <label htmlFor="send-welcome" className="text-sm font-medium text-gray-700">
                Enviar email de bienvenida
              </label>
              <input
                id="send-welcome"
                type="checkbox"
                checked={formData.send_welcome_email}
                onChange={(e) => setFormData({ ...formData, send_welcome_email: e.target.checked })}
                className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Creando...' : 'Crear Usuario'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

// Componente para editar usuario
function EditUserModal({ user, onClose, onUserUpdated, roleOptions }: {
  user: User;
  onClose: () => void;
  onUserUpdated: () => void;
  roleOptions: RoleOption[];
}) {
  const [formData, setFormData] = useState<{
    name: string;
    email: string;
    role: RoleKey;
    status: 'active' | 'inactive';
    rut: string;
    telefono: string;
    ciudad: string;
    direccion: string;
  }>(() => ({
    name: user.name,
    email: user.email,
    role: user.role,
    status: user.status ?? (user.is_active ? 'active' : 'inactive'),
    rut: user.rut || '',
    telefono: user.telefono || '',
    ciudad: user.ciudad || '',
    direccion: user.direccion || ''
  }));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const selectedRoleOption = roleOptions.find((option) => option.key === formData.role);

  useEffect(() => {
    setFormData({
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status ?? (user.is_active ? 'active' : 'inactive'),
      rut: user.rut || '',
      telefono: user.telefono || '',
      ciudad: user.ciudad || '',
      direccion: user.direccion || ''
    });
  }, [user]);

  const validateAndNormalizeFields = () => {
    const errors: Record<string, string> = {};

    // Validar RUT si está presente
    if (formData.rut.trim()) {
      try {
        console.log('🔍 Validando RUT:', formData.rut);
        const normalizedRut = normalizeRut(formData.rut);
        console.log('✅ RUT normalizado:', normalizedRut);
        setFormData(prev => ({ ...prev, rut: normalizedRut }));
      } catch (err) {
        console.error('❌ Error validando RUT:', err);
        errors.rut = err instanceof Error ? err.message : 'RUT inválido';
      }
    }

    // Validar teléfono si está presente
    if (formData.telefono.trim()) {
      try {
        console.log('🔍 Validando teléfono:', formData.telefono);
        const normalizedPhone = normalizePhone(formData.telefono);
        console.log('✅ Teléfono normalizado:', normalizedPhone);
        setFormData(prev => ({ ...prev, telefono: normalizedPhone }));
      } catch (err) {
        console.error('❌ Error validando teléfono:', err);
        errors.telefono = err instanceof Error ? err.message : 'Teléfono inválido';
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validar y normalizar campos
    if (!validateAndNormalizeFields()) {
      setError('Por favor corrige los errores en el formulario');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const payload: Partial<User> = {};

      const trimmedName = formData.name.trim();
      if (trimmedName && trimmedName !== user.name.trim()) {
        payload.name = trimmedName;
      }

      if (formData.role !== user.role) {
        payload.role = formData.role;
      }

      const currentStatus = user.status ?? (user.is_active ? 'active' : 'inactive');
      if (formData.status !== currentStatus) {
        payload.status = formData.status;
      }

      const trimmedRut = formData.rut.trim();
      if (trimmedRut !== (user.rut || '')) {
        payload.rut = trimmedRut || undefined;
      }

      const trimmedTelefono = formData.telefono.trim();
      if (trimmedTelefono !== (user.telefono || '')) {
        payload.telefono = trimmedTelefono || undefined;
      }

      const trimmedCiudad = formData.ciudad.trim();
      if (trimmedCiudad !== (user.ciudad || '')) {
        payload.ciudad = trimmedCiudad || undefined;
      }

      const trimmedDireccion = formData.direccion.trim();
      if (trimmedDireccion !== (user.direccion || '')) {
        payload.direccion = trimmedDireccion || undefined;
      }

      if (Object.keys(payload).length === 0) {
        setError('No hay cambios para guardar');
        return;
      }

      await adminService.updateUser(user.id, payload);
      setValidationErrors({});
      onUserUpdated();
    } catch (err) {
      console.error('Error actualizando usuario:', err);
      setError(err instanceof Error ? err.message : 'Error actualizando el usuario');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Editar Usuario
          </h3>
          
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Nombre completo
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                type="email"
                value={formData.email}
                readOnly
                disabled
                className="mt-1 block w-full px-3 py-2 border border-gray-200 rounded-md bg-gray-100 text-gray-500 cursor-not-allowed"
              />
              <p className="mt-1 text-xs text-gray-400">
                El email no se puede actualizar desde este panel.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Rol
              </label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value as RoleKey })}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {roleOptions.map((option) => (
                  <option key={option.key} value={option.key}>
                    {option.label}
                  </option>
                ))}
              </select>
              {selectedRoleOption?.description && (
                <p className="mt-1 text-xs text-gray-500">
                  {selectedRoleOption.description}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Estado
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as 'active' | 'inactive' })}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="active">Activo</option>
                <option value="inactive">Inactivo</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                RUT (opcional)
              </label>
              <input
                type="text"
                value={formData.rut}
                onChange={(e) => setFormData({ ...formData, rut: e.target.value })}
                className={`mt-1 block w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${validationErrors.rut ? 'border-red-500' : 'border-gray-300'}`}
                placeholder="12345678-9"
              />
              {validationErrors.rut && (
                <p className="mt-1 text-sm text-red-600">{validationErrors.rut}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Teléfono (opcional)
              </label>
              <input
                type="text"
                value={formData.telefono}
                onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                className={`mt-1 block w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${validationErrors.telefono ? 'border-red-500' : 'border-gray-300'}`}
                placeholder="912345678"
              />
              {validationErrors.telefono && (
                <p className="mt-1 text-sm text-red-600">{validationErrors.telefono}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Ciudad (opcional)
              </label>
              <input
                type="text"
                value={formData.ciudad}
                onChange={(e) => setFormData({ ...formData, ciudad: e.target.value })}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Dirección (opcional)
              </label>
              <AddressInput
                value={formData.direccion}
                onChange={(value) => setFormData({ ...formData, direccion: value })}
                placeholder="Ingresa tu dirección completa"
                className="mt-1"
              />
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Guardando...' : 'Guardar Cambios'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
