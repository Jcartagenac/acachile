import React, { useState, useEffect } from 'react';
import { 
  Users, 
  UserCheck, 
  Clock, 
  Mail, 
  MapPin, 
  Calendar,
  Eye,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import authService from '../services/authService';

interface PendingRegistration {
  id: string;
  userData: {
    email: string;
    name: string;
    phone?: string;
    region?: string;
    motivation?: string;
    experience?: string;
    references?: string;
    preferredRole?: string;
  };
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: string;
  reviewedBy?: number;
  reviewedAt?: string;
  reviewNotes?: string;
}

interface ApprovalModal {
  isOpen: boolean;
  registration: PendingRegistration | null;
  type: 'approve' | 'reject' | null;
}

const AdminPanelPage: React.FC = () => {
  const { user } = useAuth();
  const [pendingRegistrations, setPendingRegistrations] = useState<PendingRegistration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRegistration, setSelectedRegistration] = useState<PendingRegistration | null>(null);
  const [modal, setModal] = useState<ApprovalModal>({
    isOpen: false,
    registration: null,
    type: null
  });
  const [actionLoading, setActionLoading] = useState(false);

  // Verificar permisos de admin
  const isAdmin = user?.roles?.includes('admin') || user?.roles?.includes('super_admin');

  useEffect(() => {
    if (!isAdmin) {
      setError('No tienes permisos para acceder a esta sección');
      setLoading(false);
      return;
    }
    
    loadPendingRegistrations();
  }, [isAdmin]);

  const loadPendingRegistrations = async () => {
    try {
      setLoading(true);
      const response = await authService.getPendingRegistrations();
      
      if (response.success) {
        setPendingRegistrations(response.data || []);
      } else {
        setError(response.error || 'Error cargando registros pendientes');
      }
    } catch (err) {
      setError('Error de conexión');
      console.error('Error loading pending registrations:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveRegistration = async (
    registrationId: string, 
    assignedRole: string = 'user',
    membershipType: string = 'basic',
    notes?: string
  ) => {
    try {
      setActionLoading(true);
      const response = await authService.approveRegistration(registrationId, {
        assignedRole,
        membershipType,
        notes
      });

      if (response.success) {
        await loadPendingRegistrations(); // Recargar lista
        setModal({ isOpen: false, registration: null, type: null });
        // Mostrar mensaje de éxito
      } else {
        setError(response.error || 'Error aprobando registro');
      }
    } catch (err) {
      setError('Error procesando aprobación');
      console.error('Error approving registration:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectRegistration = async (registrationId: string, reason?: string) => {
    try {
      setActionLoading(true);
      const response = await authService.rejectRegistration(registrationId, reason);

      if (response.success) {
        await loadPendingRegistrations(); // Recargar lista
        setModal({ isOpen: false, registration: null, type: null });
        // Mostrar mensaje de éxito
      } else {
        setError(response.error || 'Error rechazando registro');
      }
    } catch (err) {
      setError('Error procesando rechazo');
      console.error('Error rejecting registration:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-CL', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const openModal = (registration: PendingRegistration, type: 'approve' | 'reject') => {
    setModal({
      isOpen: true,
      registration,
      type
    });
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md text-center">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Acceso Denegado</h2>
          <p className="text-gray-600">No tienes permisos para acceder al panel administrativo.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Panel Administrativo</h1>
          <p className="text-gray-600">Gestión de registros y usuarios de ACA Chile</p>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
            <div className="flex">
              <XCircle className="h-5 w-5 text-red-400" />
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
              <button 
                onClick={() => setError(null)}
                className="ml-auto text-red-400 hover:text-red-600"
              >
                <XCircle className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Clock className="h-8 w-8 text-yellow-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Registros Pendientes
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {pendingRegistrations.length}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <UserCheck className="h-8 w-8 text-green-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Total Usuarios Activos
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      ---
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Users className="h-8 w-8 text-blue-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Registros del Mes
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      ---
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Pending Registrations Table */}
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Registros Pendientes
            </h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              Solicitudes de registro que requieren aprobación administrativa.
            </p>
          </div>

          {pendingRegistrations.length === 0 ? (
            <div className="text-center py-12">
              <UserCheck className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No hay registros pendientes</h3>
              <p className="mt-1 text-sm text-gray-500">
                Todos los registros han sido procesados.
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-200">
              {pendingRegistrations.map((registration) => (
                <li key={registration.id} className="px-4 py-6 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      {/* User Info */}
                      <div className="flex items-center space-x-4">
                        <div className="flex-shrink-0">
                          <div className="h-10 w-10 bg-orange-100 rounded-full flex items-center justify-center">
                            <Users className="h-5 w-5 text-orange-600" />
                          </div>
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {registration.userData.name}
                          </p>
                          <div className="flex items-center space-x-4 text-sm text-gray-500">
                            <div className="flex items-center">
                              <Mail className="h-4 w-4 mr-1" />
                              {registration.userData.email}
                            </div>
                            {registration.userData.region && (
                              <div className="flex items-center">
                                <MapPin className="h-4 w-4 mr-1" />
                                {registration.userData.region}
                              </div>
                            )}
                            <div className="flex items-center">
                              <Calendar className="h-4 w-4 mr-1" />
                              {formatDate(registration.submittedAt)}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Additional Info */}
                      {(registration.userData.motivation || registration.userData.experience) && (
                        <div className="mt-3 text-sm text-gray-600">
                          {registration.userData.motivation && (
                            <p><strong>Motivación:</strong> {registration.userData.motivation}</p>
                          )}
                          {registration.userData.experience && (
                            <p><strong>Experiencia:</strong> {registration.userData.experience}</p>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setSelectedRegistration(registration)}
                        className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Ver Detalles
                      </button>
                      
                      <button
                        onClick={() => openModal(registration, 'approve')}
                        className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Aprobar
                      </button>
                      
                      <button
                        onClick={() => openModal(registration, 'reject')}
                        className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
                      >
                        <XCircle className="h-4 w-4 mr-1" />
                        Rechazar
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Modal for Details */}
        {selectedRegistration && (
          <RegistrationDetailModal 
            registration={selectedRegistration}
            onClose={() => setSelectedRegistration(null)}
          />
        )}

        {/* Modal for Approval/Rejection */}
        {modal.isOpen && modal.registration && (
          <ApprovalModal 
            registration={modal.registration}
            type={modal.type!}
            onClose={() => setModal({ isOpen: false, registration: null, type: null })}
            onApprove={handleApproveRegistration}
            onReject={handleRejectRegistration}
            loading={actionLoading}
          />
        )}
      </div>
    </div>
  );
};

// Modal Component for Registration Details
const RegistrationDetailModal: React.FC<{
  registration: PendingRegistration;
  onClose: () => void;
}> = ({ registration, onClose }) => {
  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-2/3 lg:w-1/2 shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">
              Detalles del Registro
            </h3>
            <button 
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <XCircle className="h-6 w-6" />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Nombre</label>
              <p className="mt-1 text-sm text-gray-900">{registration.userData.name}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <p className="mt-1 text-sm text-gray-900">{registration.userData.email}</p>
            </div>

            {registration.userData.phone && (
              <div>
                <label className="block text-sm font-medium text-gray-700">Teléfono</label>
                <p className="mt-1 text-sm text-gray-900">{registration.userData.phone}</p>
              </div>
            )}

            {registration.userData.region && (
              <div>
                <label className="block text-sm font-medium text-gray-700">Región</label>
                <p className="mt-1 text-sm text-gray-900">{registration.userData.region}</p>
              </div>
            )}

            {registration.userData.motivation && (
              <div>
                <label className="block text-sm font-medium text-gray-700">Motivación</label>
                <p className="mt-1 text-sm text-gray-900">{registration.userData.motivation}</p>
              </div>
            )}

            {registration.userData.experience && (
              <div>
                <label className="block text-sm font-medium text-gray-700">Experiencia</label>
                <p className="mt-1 text-sm text-gray-900">{registration.userData.experience}</p>
              </div>
            )}

            {registration.userData.references && (
              <div>
                <label className="block text-sm font-medium text-gray-700">Referencias</label>
                <p className="mt-1 text-sm text-gray-900">{registration.userData.references}</p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700">Fecha de Solicitud</label>
              <p className="mt-1 text-sm text-gray-900">
                {new Date(registration.submittedAt).toLocaleDateString('es-CL', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Modal Component for Approval/Rejection
const ApprovalModal: React.FC<{
  registration: PendingRegistration;
  type: 'approve' | 'reject';
  onClose: () => void;
  onApprove: (id: string, role: string, membership: string, notes?: string) => void;
  onReject: (id: string, reason?: string) => void;
  loading: boolean;
}> = ({ registration, type, onClose, onApprove, onReject, loading }) => {
  const [assignedRole, setAssignedRole] = useState('user');
  const [membershipType, setMembershipType] = useState('basic');
  const [notes, setNotes] = useState('');

  const handleSubmit = () => {
    if (type === 'approve') {
      onApprove(registration.id, assignedRole, membershipType, notes);
    } else {
      onReject(registration.id, notes);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-1/2 shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">
              {type === 'approve' ? 'Aprobar Registro' : 'Rechazar Registro'}
            </h3>
            <button 
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <XCircle className="h-6 w-6" />
            </button>
          </div>

          <div className="mb-4 p-4 bg-gray-50 rounded-md">
            <p className="text-sm text-gray-900">
              <strong>Usuario:</strong> {registration.userData.name} ({registration.userData.email})
            </p>
          </div>

          {type === 'approve' ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rol Asignado
                </label>
                <select 
                  value={assignedRole}
                  onChange={(e) => setAssignedRole(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="user">Usuario Regular</option>
                  <option value="organizer">Organizador</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo de Membresía
                </label>
                <select 
                  value={membershipType}
                  onChange={(e) => setMembershipType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="basic">Básica</option>
                  <option value="premium">Premium</option>
                  <option value="vip">VIP</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notas (Opcional)
                </label>
                <textarea 
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="Comentarios adicionales sobre la aprobación..."
                />
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Razón del Rechazo
              </label>
              <textarea 
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="Explica la razón del rechazo..."
              />
            </div>
          )}

          <div className="flex justify-end space-x-3 mt-6">
            <button 
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Cancelar
            </button>
            <button 
              onClick={handleSubmit}
              disabled={loading}
              className={`px-4 py-2 rounded-md text-white disabled:opacity-50 ${
                type === 'approve' 
                  ? 'bg-green-600 hover:bg-green-700' 
                  : 'bg-red-600 hover:bg-red-700'
              }`}
            >
              {loading ? 'Procesando...' : (type === 'approve' ? 'Aprobar' : 'Rechazar')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPanelPage;