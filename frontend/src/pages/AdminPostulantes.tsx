import React, { useCallback, useEffect, useState } from 'react';
import { postulacionesService, PostulanteSummary } from '../services/postulacionesService';
import { sociosService } from '../services/sociosService';
import { useAuth } from '../contexts/AuthContext';
import {
  AlertCircle,
  CheckCircle,

  Loader2,
  Mail,
  MapPin,
  Home,
  Phone,
  RefreshCw,
  Search,
  Shield,
  UserCheck,
  UserPlus,
  X,
  XCircle,
  UserCog,
} from 'lucide-react';

const STATUS_OPTIONS = [
  { value: 'pendiente', label: 'Pendientes' },
  { value: 'en_revision', label: 'En revisión' },
  { value: 'aprobada', label: 'Aprobadas' },
  { value: 'rechazada', label: 'Rechazadas' },
  { value: 'todos', label: 'Todas' },
] as const;

type StatusValue = typeof STATUS_OPTIONS[number]['value'];

const statusBadgeClass = (status: PostulanteSummary['status']) => {
  switch (status) {
    case 'pendiente':
      return 'bg-yellow-100 text-yellow-800';
    case 'en_revision':
      return 'bg-blue-100 text-blue-800';
    case 'aprobada':
      return 'bg-green-100 text-green-700';
    case 'rechazada':
      return 'bg-red-100 text-red-700';
    default:
      return 'bg-gray-100 text-gray-700';
  }
};

const formatDate = (value: string | null | undefined) => {
  if (!value) return '—';
  try {
    return new Date(value).toLocaleDateString('es-CL', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch (error) {
    return value;
  }
};

const AdminPostulantes: React.FC = () => {
  const { isDirector, isDirectorEditor, isAdmin, user } = useAuth();
  const canReview = isDirector() || isDirectorEditor() || isAdmin();

  const [postulantes, setPostulantes] = useState<PostulanteSummary[]>([]);
  const [statusFilter, setStatusFilter] = useState<StatusValue>('pendiente');
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<{ page: number; limit: number; total: number; totalPages: number; hasNext?: boolean; hasPrev?: boolean } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedPostulacion, setSelectedPostulacion] = useState<PostulanteSummary | null>(null);
  const [directors, setDirectors] = useState<Array<{ id: number; nombre: string; apellido: string; email: string; role: string }>>([]);
  const [selectedDirectorId, setSelectedDirectorId] = useState<number | null>(null);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedbackText, setFeedbackText] = useState('');
  const [feedbackLoading, setFeedbackLoading] = useState(false);

  const fetchPostulantes = useCallback(
    async ({ overridePage, overrideSearch }: { overridePage?: number; overrideSearch?: string } = {}) => {
      if (!canReview) return;
      try {
        setLoading(true);
        setError(null);
        const response = await postulacionesService.getAdminPostulantes({
          status: statusFilter === 'todos' ? undefined : statusFilter,
          search: overrideSearch ?? (search || undefined),
          page: overridePage ?? page,
          limit: 20,
        });

        if (response.success) {
          setPostulantes(response.data ?? []);
          setPagination(response.pagination ?? null);
        } else {
          setError(response.error || 'Error al cargar postulaciones');
        }
      } catch (fetchError) {
        console.error('Error al cargar postulaciones:', fetchError);
        setError('Error al cargar postulaciones');
      } finally {
        setLoading(false);
      }
    },
    [canReview, statusFilter, search, page],
  );

  useEffect(() => {
    if (canReview) {
      fetchPostulantes();
    }
  }, [canReview, fetchPostulantes]);

  const hasApproved = (postulacion: PostulanteSummary) =>
    postulacion.approvals?.some((approval) => approval.approverId === user?.id) ?? false;

  const handleApprove = async (postulacion: PostulanteSummary) => {
    const comment = window.prompt('Comentario para registrar junto a tu aprobación (opcional)');
    setActionLoadingId(postulacion.id);
    try {
      const response = await postulacionesService.approvePostulante(postulacion.id, comment || undefined);
      if (response.success && response.data) {
        setPostulantes((prev) => prev.map((item) => (item.id === response.data!.postulacion.id ? response.data!.postulacion : item)));
        if (response.data.generatedPassword) {
          window.alert(`Postulación aprobada. Contraseña temporal: ${response.data.generatedPassword}`);
        }
      } else if (response.error) {
        setError(response.error);
      }
    } catch (approveError) {
      console.error('Error aprobando postulacion:', approveError);
      setError('No pudimos registrar la aprobación');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleReject = async (postulacion: PostulanteSummary) => {
    const reason = window.prompt('Indica el motivo del rechazo de esta postulación');
    if (!reason) return;
    setActionLoadingId(postulacion.id);
    try {
      const response = await postulacionesService.rejectPostulante(postulacion.id, reason);
      if (response.success && response.data) {
        setPostulantes((prev) => prev.map((item) => (item.id === response.data!.id ? response.data! : item)));
      } else if (response.error) {
        setError(response.error);
      }
    } catch (rejectError) {
      console.error('Error rechazando postulacion:', rejectError);
      setError('No pudimos rechazar la postulación');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleSearchSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setPage(1);
    setSearch(searchInput.trim());
    fetchPostulantes({ overridePage: 1, overrideSearch: searchInput.trim() });
  };

  const handleStatusChange = (value: StatusValue) => {
    setStatusFilter(value);
    setPage(1);
    fetchPostulantes({ overridePage: 1 });
  };

  const handleResetFilters = () => {
    setStatusFilter('pendiente');
    setSearch('');
    setSearchInput('');
    setPage(1);
    fetchPostulantes({ overridePage: 1, overrideSearch: '' });
  };

  const handlePageChange = (direction: 'prev' | 'next') => {
    if (!pagination) return;
    const nextPage = direction === 'prev' ? page - 1 : page + 1;
    if (nextPage < 1 || nextPage > (pagination.totalPages || nextPage)) return;
    setPage(nextPage);
    fetchPostulantes({ overridePage: nextPage });
  };

  const handleRefresh = () => {
    fetchPostulantes();
  };

  const loadDirectors = useCallback(async () => {
    try {
      const response = await sociosService.getSocios({ limit: 100 });
      if (response.success && response.data) {
        // Filtrar solo directores
        const allSocios = response.data.socios || [];
        const directorRoles = ['admin', 'organizer', 'editor'];
        const filteredDirectors = allSocios
          .filter((socio: any) => directorRoles.includes(socio.role))
          .map((socio: any) => ({
            id: socio.id,
            nombre: socio.nombre,
            apellido: socio.apellido,
            email: socio.email,
            role: socio.role,
          }));
        setDirectors(filteredDirectors);
      }
    } catch (error) {
      console.error('Error loading directors:', error);
    }
  }, []);

  useEffect(() => {
    if (canReview && showAssignModal) {
      loadDirectors();
    }
  }, [canReview, showAssignModal, loadDirectors]);

  const handleOpenAssignModal = (postulacion: PostulanteSummary) => {
    setSelectedPostulacion(postulacion);
    setSelectedDirectorId(null);
    setShowAssignModal(true);
  };

  const handleCloseAssignModal = () => {
    setShowAssignModal(false);
    setSelectedPostulacion(null);
    setSelectedDirectorId(null);
  };

  const handleAssignReviewer = async () => {
    if (!selectedPostulacion || !selectedDirectorId) return;

    try {
      setActionLoadingId(selectedPostulacion.id);
      const response = await postulacionesService.assignReviewer(selectedPostulacion.id, selectedDirectorId);
      
      if (response.success && response.data) {
        setPostulantes((prev) =>
          prev.map((item) =>
            item.id === selectedPostulacion.id ? { ...item, reviewers: response.data!.reviewers } : item
          )
        );
        handleCloseAssignModal();
      } else if (response.error) {
        setError(response.error);
      }
    } catch (assignError) {
      console.error('Error asignando revisor:', assignError);
      setError('No pudimos asignar el revisor');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleRemoveReviewer = async (postulacionId: number, reviewerId: number) => {
    if (!window.confirm('¿Estás seguro de remover este revisor?')) return;

    try {
      setActionLoadingId(postulacionId);
      const response = await postulacionesService.removeReviewer(postulacionId, reviewerId);
      
      if (response.success) {
        setPostulantes((prev) =>
          prev.map((item) =>
            item.id === postulacionId
              ? { ...item, reviewers: (item.reviewers || []).filter((r) => r.reviewerId !== reviewerId) }
              : item
          )
        );
      } else if (response.error) {
        setError(response.error);
      }
    } catch (removeError) {
      console.error('Error removiendo revisor:', removeError);
      setError('No pudimos remover el revisor');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleOpenFeedbackModal = (postulacion: PostulanteSummary) => {
    const currentReviewer = postulacion.reviewers?.find(r => r.reviewerId === user?.id);
    setSelectedPostulacion(postulacion);
    setFeedbackText(currentReviewer?.feedback || '');
    setShowFeedbackModal(true);
  };

  const handleSaveFeedback = async () => {
    if (!selectedPostulacion) return;

    try {
      setFeedbackLoading(true);
      const response = await postulacionesService.updateReviewerFeedback(selectedPostulacion.id, feedbackText);

      if (response.success && response.data) {
        setPostulantes((prev) =>
          prev.map((item) =>
            item.id === selectedPostulacion.id ? { ...item, reviewers: response.data!.reviewers } : item
          )
        );
        setShowFeedbackModal(false);
        setFeedbackText('');
        setSelectedPostulacion(null);
      } else if (response.error) {
        setError(response.error);
      }
    } catch (feedbackError) {
      console.error('Error guardando feedback:', feedbackError);
      setError('No pudimos guardar el feedback');
    } finally {
      setFeedbackLoading(false);
    }
  };

  if (!canReview) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-sm px-8 py-10 text-center text-gray-500 max-w-md">
          <Shield className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <h2 className="text-lg font-semibold text-gray-800">Acceso restringido</h2>
          <p className="mt-2">Solo los miembros del directorio pueden revisar postulaciones.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3 sm:gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Postulaciones a ACA Chile</h1>
            <p className="text-gray-600">Revisa, aprueba o rechaza las postulaciones pendientes.</p>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={handleRefresh}
              className={"inline-flex items-center px-4 py-2 rounded-lg border border-gray-300 bg-white shadow-sm hover:bg-gray-100 transition-colors" + (loading ? ' opacity-70 cursor-not-allowed' : '')}
              disabled={loading}
            >
              <RefreshCw className={"h-5 w-5 mr-2" + (loading ? ' animate-spin' : '')} />
              Recargar lista
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-red-400 mr-2" />
              <p className="text-red-700">{error}</p>
              <button onClick={() => setError(null)} className="ml-auto text-red-400 hover:text-red-600">
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        <form onSubmit={handleSearchSubmit} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-5">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Buscar postulaciones</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Buscar por nombre, email o ciudad"
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
              <select
                value={statusFilter}
                onChange={(e) => handleStatusChange(e.target.value as StatusValue)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              >
                {STATUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-end gap-2">
              <button type="submit" className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
                Aplicar filtros
              </button>
              <button type="button" onClick={handleResetFilters} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
                Limpiar
              </button>
            </div>
          </div>
        </form>

        {loading ? (
          <div className="py-16 flex flex-col items-center justify-center text-gray-500">
            <Loader2 className="h-10 w-10 animate-spin text-red-500 mb-4" />
            <p>Cargando postulaciones...</p>
          </div>
        ) : postulantes.length === 0 ? (
          <div className="py-16 flex flex-col items-center justify-center text-gray-500">
            <UserPlus className="h-12 w-12 text-gray-400 mb-2" />
            <p>No se encontraron postulaciones para los filtros seleccionados.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {postulantes.map((postulacion) => {
              const alreadyApproved = hasApproved(postulacion);
              const disableActions = actionLoadingId === postulacion.id;
              const isFinalizada = postulacion.status === 'aprobada' || postulacion.status === 'rechazada';
              const pendingApprovals = Math.max(0, (postulacion.approvalsRequired ?? 2) - (postulacion.approvalsCount ?? 0));

              return (
                <div key={postulacion.id} className="bg-white rounded-lg border border-gray-200 shadow-sm p-5 space-y-4">
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                    <div className="flex items-start gap-4">
                      {postulacion.photoUrl ? (
                        <img
                          src={postulacion.photoUrl}
                          alt={`Foto de ${postulacion.fullName}`}
                          className="h-16 w-16 rounded-xl object-cover border border-gray-200 shadow-sm"
                        />
                      ) : (
                        <div className="h-16 w-16 rounded-xl bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-400 text-sm uppercase">
                          {postulacion.fullName.slice(0, 2)}
                        </div>
                      )}
                      <div className="space-y-1">
                        <h3 className="text-lg font-semibold text-gray-900">{postulacion.fullName}</h3>
                        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                          <span className="flex items-center gap-1"><Mail className="h-4 w-4 text-gray-400" /> {postulacion.email}</span>
                          <span className="flex items-center gap-1"><Phone className="h-4 w-4 text-gray-400" /> {postulacion.phone || 'Sin teléfono'}</span>
                          <span className="flex items-center gap-1"><MapPin className="h-4 w-4 text-gray-400" /> {postulacion.region || 'Región no indicada'}</span>
                          {postulacion.city && <span className="flex items-center gap-1"><Home className="h-4 w-4 text-gray-400" /> {postulacion.city}</span>}
                        </div>
                        {postulacion.rut && (
                          <p className="text-sm text-gray-600">
                            <span className="font-medium">RUT:</span> {postulacion.rut}
                          </p>
                        )}
                        {postulacion.birthdate && (
                          <p className="text-sm text-gray-600">
                            <span className="font-medium">Fecha de nacimiento:</span> {formatDate(postulacion.birthdate)}
                          </p>
                        )}
                        {postulacion.occupation && (
                          <p className="text-sm text-gray-600">
                            <span className="font-medium">Ocupación:</span> {postulacion.occupation}
                          </p>
                        )}
                        {postulacion.photoUrl && (
                          <button
                            type="button"
                            onClick={() => postulacion.photoUrl && window.open(postulacion.photoUrl, '_blank')}
                            className="inline-flex items-center text-xs text-primary-600 hover:text-primary-700"
                          >
                            Ver foto en tamaño completo
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="text-right space-y-1">
                      <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${statusBadgeClass(postulacion.status)}`}>
                        {postulacion.status === 'en_revision' ? 'En revisión' : postulacion.status === 'aprobada' ? 'Aprobada' : postulacion.status === 'rechazada' ? 'Rechazada' : 'Pendiente'}
                      </span>
                      {(postulacion.status === 'pendiente' || postulacion.status === 'en_revision') && (
                        <p className="text-xs text-gray-500">Faltan {pendingApprovals} aprobación{pendingApprovals === 1 ? '' : 'es'}</p>
                      )}
                      <p className="text-xs text-gray-400">Enviada el {formatDate(postulacion.createdAt)}</p>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4 text-sm text-gray-600">
                    <div>
                      <p className="font-semibold text-gray-800">Nivel de experiencia</p>
                      <p className="mt-1 bg-gray-50 border border-gray-100 rounded-lg p-3">{postulacion.experienceLevel}</p>
                    </div>
                    {postulacion.specialties && (
                      <div>
                        <p className="font-semibold text-gray-800">Especialidades</p>
                        <p className="mt-1 bg-gray-50 border border-gray-100 rounded-lg p-3 whitespace-pre-line">{postulacion.specialties}</p>
                      </div>
                    )}
                    <div>
                      <p className="font-semibold text-gray-800">Motivación</p>
                      <p className="mt-1 bg-gray-50 border border-gray-100 rounded-lg p-3 whitespace-pre-line">{postulacion.motivation}</p>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800">Cómo puede aportar</p>
                      <p className="mt-1 bg-gray-50 border border-gray-100 rounded-lg p-3 whitespace-pre-line">{postulacion.contribution}</p>
                    </div>
                    {postulacion.hasCompetitionExperience && postulacion.competitionDetails && (
                      <div>
                        <p className="font-semibold text-gray-800">Experiencia competitiva</p>
                        <p className="mt-1 bg-gray-50 border border-gray-100 rounded-lg p-3 whitespace-pre-line">{postulacion.competitionDetails}</p>
                      </div>
                    )}
                    {postulacion.references && (
                      <div>
                        <p className="font-semibold text-gray-800">Referencias</p>
                        <p className="mt-1 bg-gray-50 border border-gray-100 rounded-lg p-3 whitespace-pre-line">{postulacion.references}</p>
                      </div>
                    )}
                    {(postulacion.instagram || postulacion.otherNetworks) && (
                      <div>
                        <p className="font-semibold text-gray-800">Redes sociales</p>
                        <div className="mt-1 bg-gray-50 border border-gray-100 rounded-lg p-3 space-y-1">
                          {postulacion.instagram && <p>Instagram: {postulacion.instagram}</p>}
                          {postulacion.otherNetworks && <p>Otras: {postulacion.otherNetworks}</p>}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
                      {(postulacion.availability || []).map((item) => (
                        <span key={item} className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-blue-50 text-blue-600 border border-blue-100">
                          <UserCheck className="h-3 w-3" /> {item.replace(/_/g, ' ')}
                        </span>
                      ))}
                      {(postulacion.approvals || []).map((approval) => (
                        <span key={approval.id} className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-green-50 text-green-600 border border-green-100">
                          <UserCheck className="h-3 w-3" /> {approval.approverName || 'Miembro directorio'}
                        </span>
                      ))}
                    </div>
                    {(postulacion.reviewers && postulacion.reviewers.length > 0) && (
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-medium text-gray-600">Revisores asignados:</span>
                        {postulacion.reviewers.map((reviewer) => (
                          <span key={reviewer.id} className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-purple-50 text-purple-700 border border-purple-200 text-xs">
                            <UserCog className="h-3 w-3" /> {reviewer.reviewerName}
                            <button
                              type="button"
                              onClick={() => handleRemoveReviewer(postulacion.id, reviewer.reviewerId)}
                              disabled={disableActions}
                              className="ml-1 hover:text-purple-900"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Sección de Feedbacks */}
                  {postulacion.reviewers && postulacion.reviewers.length > 0 && (
                    <div className="mt-4 space-y-3 border-t pt-4">
                      <h3 className="text-sm font-semibold text-gray-700">Feedback de Revisores</h3>
                      {postulacion.reviewers.map((reviewer, idx) => {
                        const isCurrentUser = reviewer.reviewerId === user?.id;
                        return (
                          <div key={reviewer.id} className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-xs font-medium text-purple-700">
                                Feedback {idx + 1} - {reviewer.reviewerName}
                              </span>
                              {isCurrentUser && !isFinalizada && (
                                <button
                                  type="button"
                                  onClick={() => handleOpenFeedbackModal(postulacion)}
                                  className="text-xs text-purple-600 hover:text-purple-800 underline"
                                >
                                  {reviewer.feedback ? 'Editar' : 'Agregar'}
                                </button>
                              )}
                            </div>
                            {reviewer.feedback ? (
                              <p className="text-sm text-gray-700 whitespace-pre-line">{reviewer.feedback}</p>
                            ) : (
                              <p className="text-xs text-gray-400 italic">Sin feedback aún</p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  <div className="flex flex-wrap items-center gap-3 pt-2">
                    <button
                      type="button"
                      disabled={disableActions || alreadyApproved || isFinalizada}
                      onClick={() => handleApprove(postulacion)}
                      className={`inline-flex items-center px-4 py-2 rounded-lg border ${disableActions || alreadyApproved || isFinalizada ? 'border-green-200 text-green-300 cursor-not-allowed' : 'border-green-500 text-green-600 hover:bg-green-50'}`}
                    >
                      <CheckCircle className="h-4 w-4 mr-1" /> Aprobar
                    </button>
                    <button
                      type="button"
                      disabled={disableActions || isFinalizada}
                      onClick={() => handleReject(postulacion)}
                      className={`inline-flex items-center px-4 py-2 rounded-lg border ${disableActions || isFinalizada ? 'border-red-200 text-red-300 cursor-not-allowed' : 'border-red-500 text-red-600 hover:bg-red-50'}`}
                    >
                      <XCircle className="h-4 w-4 mr-1" /> Rechazar
                    </button>
                    <button
                      type="button"
                      disabled={disableActions || (postulacion.reviewers?.length || 0) >= 2}
                      onClick={() => handleOpenAssignModal(postulacion)}
                      className={`inline-flex items-center px-4 py-2 rounded-lg border ${disableActions || (postulacion.reviewers?.length || 0) >= 2 ? 'border-purple-200 text-purple-300 cursor-not-allowed' : 'border-purple-500 text-purple-600 hover:bg-purple-50'}`}
                      title={(postulacion.reviewers?.length || 0) >= 2 ? 'Máximo 2 revisores permitidos' : ''}
                    >
                      <UserCog className="h-4 w-4 mr-1" /> Asignar revisor {(postulacion.reviewers?.length || 0) >= 2 ? '(máx. 2)' : ''}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-between pt-2 text-sm text-gray-500">
            <div>
              Página {pagination.page} de {pagination.totalPages}
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handlePageChange('prev')}
                disabled={page <= 1}
                className="px-3 py-1 border border-gray-300 rounded-md hover:bg-gray-100 disabled:opacity-50"
              >
                Anterior
              </button>
              <button
                type="button"
                onClick={() => handlePageChange('next')}
                disabled={pagination.hasNext === false || page >= (pagination.totalPages || page)}
                className="px-3 py-1 border border-gray-300 rounded-md hover:bg-gray-100 disabled:opacity-50"
              >
                Siguiente
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal para asignar revisor */}
      {showAssignModal && selectedPostulacion && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Asignar revisor</h3>
              <button
                type="button"
                onClick={handleCloseAssignModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div>
              <p className="text-sm text-gray-600 mb-2">
                Postulación de: <span className="font-medium">{selectedPostulacion.fullName}</span>
              </p>
              <p className="text-xs text-gray-500 mb-4">
                Asigna un director para que revise esta postulación
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Seleccionar director
              </label>
              <select
                value={selectedDirectorId || ''}
                onChange={(e) => setSelectedDirectorId(Number(e.target.value))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="">Seleccionar...</option>
                {directors.map((director) => (
                  <option key={director.id} value={director.id}>
                    {director.nombre} {director.apellido} ({director.email})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={handleCloseAssignModal}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleAssignReviewer}
                disabled={!selectedDirectorId || actionLoadingId === selectedPostulacion.id}
                className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {actionLoadingId === selectedPostulacion.id ? 'Asignando...' : 'Asignar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal para agregar/editar feedback */}
      {showFeedbackModal && selectedPostulacion && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Mi Feedback</h3>
              <button
                type="button"
                onClick={() => {
                  setShowFeedbackModal(false);
                  setFeedbackText('');
                  setSelectedPostulacion(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div>
              <p className="text-sm text-gray-600 mb-2">
                Postulación de: <span className="font-medium">{selectedPostulacion.fullName}</span>
              </p>
              <p className="text-xs text-gray-500 mb-4">
                Deja tu feedback sobre esta postulación
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Feedback
              </label>
              <textarea
                value={feedbackText}
                onChange={(e) => setFeedbackText(e.target.value)}
                rows={8}
                placeholder="Escribe tu evaluación y comentarios sobre el postulante..."
                maxLength={5000}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
              />
              <p className="text-xs text-gray-500 mt-1">
                {feedbackText.length} / 5000 caracteres
              </p>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowFeedbackModal(false);
                  setFeedbackText('');
                  setSelectedPostulacion(null);
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSaveFeedback}
                disabled={feedbackLoading}
                className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {feedbackLoading ? 'Guardando...' : 'Guardar feedback'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPostulantes;
