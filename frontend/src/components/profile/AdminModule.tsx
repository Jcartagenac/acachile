import React, { useState, useEffect } from 'react';
import { 
  Users,
  UserPlus,
  UserMinus,
  FileText,
  Calendar,
  CreditCard,
  Send,
  Settings,
  Shield,
  Search,
  Edit,
  Eye,
  Plus,
  AlertCircle,
  CheckCircle,
  Loader2,
  Upload,
  X
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useAdminService, Member, Communication, PaymentRecord } from '../../hooks/useAdminService';

export const AdminModule: React.FC = () => {
  const { hasPermission } = useAuth();
  const adminService = useAdminService();
  const [activeSection, setActiveSection] = useState<'members' | 'content' | 'payments' | 'communications'>('members');
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [showAddCommunicationModal, setShowAddCommunicationModal] = useState(false);
  
  // Data states
  const [members, setMembers] = useState<Member[]>([]);
  const [communications, setCommunications] = useState<Communication[]>([]);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);

  // Load admin data
  useEffect(() => {
    loadAdminData();
  }, []);

  const loadAdminData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const [membersRes, communicationsRes, paymentsRes] = await Promise.all([
        adminService.getMembers(searchTerm),
        adminService.getCommunications(),
        adminService.getPaymentRecords()
      ]);

      if (membersRes.success && membersRes.data) {
        setMembers(membersRes.data);
      }
      if (communicationsRes.success && communicationsRes.data) {
        setCommunications(communicationsRes.data);
      }
      if (paymentsRes.success && paymentsRes.data) {
        setPayments(paymentsRes.data);
      }
    } catch (error) {
      console.error('Error loading admin data:', error);
      setError('Error cargando datos administrativos');
    } finally {
      setIsLoading(false);
    }
  };

  // Search members when search term changes
  useEffect(() => {
    const searchMembers = async () => {
      const response = await adminService.getMembers(searchTerm);
      if (response.success && response.data) {
        setMembers(response.data);
      }
    };
    
    const timeoutId = setTimeout(searchMembers, 300);
    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  // Show loading state
  if (isLoading) {
    return (
      <div className="bg-white/60 backdrop-blur-soft border border-white/30 rounded-2xl shadow-soft-lg p-6">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
          <span className="ml-2 text-neutral-600">Cargando panel administrativo...</span>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="bg-white/60 backdrop-blur-soft border border-white/30 rounded-2xl shadow-soft-lg p-6">
        <div className="text-center py-12">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 font-medium">{error}</p>
          <button 
            onClick={loadAdminData}
            className="mt-4 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  // Only allow access to admin and director_editor roles
  if (!hasPermission('access_admin_panel')) {
    return (
      <div className="bg-white/60 backdrop-blur-soft border border-white/30 rounded-2xl shadow-soft-lg p-6">
        <div className="text-center">
          <Shield className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-neutral-700 mb-2">Acceso Denegado</h3>
          <p className="text-neutral-600">No tienes permisos para acceder al panel de administración.</p>
        </div>
      </div>
    );
  }

  const sections = [
    { id: 'members', title: 'Gestión de Socios', icon: Users, description: 'Agregar, quitar y editar socios' },
    { id: 'content', title: 'Contenido', icon: FileText, description: 'Configurar noticias y eventos' },
    { id: 'payments', title: 'Cuotas', icon: CreditCard, description: 'Marcar pagos mensuales' },
    { id: 'communications', title: 'Comunicados', icon: Send, description: 'Enviar comunicados y notificaciones' },
  ];

  const handleAddMember = () => {
    console.log('[AdminModule] Abriendo modal agregar socio');
    setShowAddMemberModal(true);
  };

  const handleCreateSocio = async (socioData: any) => {
    try {
      setIsLoading(true);
      setError(null);
      
      // TODO: Llamar a la API real para crear socio
      console.log('[AdminModule] Creando socio:', socioData);
      
      // Recargar lista de socios
      await loadAdminData();
      setShowAddMemberModal(false);
    } catch (err) {
      setError('Error al crear socio');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveMember = (memberId: number) => {
    // Implementar confirmación y eliminación
    console.log('Eliminar socio:', memberId);
  };

  const handleMarkPayment = (memberId: number, month: string) => {
    // Implementar marcado de pago
    console.log('Marcar pago para socio:', memberId, 'mes:', month);
  };

  const handleSendCommunication = () => {
    setShowAddCommunicationModal(true);
  };

  const handleCreateCommunication = async (data: any) => {
    setIsLoading(true);
    try {
      // Aquí se llamará a la API para crear el comunicado
      await loadAdminData(); // Recargar datos
      setShowAddCommunicationModal(false);
    } catch (error) {
      console.error('Error creating communication:', error);
      setError('Error al crear comunicado');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white/60 backdrop-blur-soft border border-white/30 rounded-2xl shadow-soft-lg p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-12 h-12 bg-gradient-to-r from-red-100 to-red-200 rounded-full flex items-center justify-center">
            <Shield className="w-6 h-6 text-red-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-neutral-700">Panel de Administración</h2>
            <p className="text-sm text-neutral-500">Gestión completa del sistema ACA</p>
          </div>
        </div>

        {/* Section Navigation */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {sections.map((section) => {
            const Icon = section.icon;
            const isActive = activeSection === section.id;
            
            return (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id as any)}
                className={`p-4 rounded-xl border text-left transition-all duration-300 ${
                  isActive
                    ? 'bg-gradient-to-r from-primary-600 to-primary-500 text-white border-primary-400 shadow-soft-sm'
                    : 'bg-white/50 hover:bg-white/70 text-neutral-700 border-white/30 hover:shadow-soft-xs'
                }`}
              >
                <Icon className={`w-6 h-6 mb-2 ${isActive ? 'text-white' : 'text-primary-600'}`} />
                <h3 className="font-semibold mb-1">{section.title}</h3>
                <p className={`text-sm ${isActive ? 'text-white/80' : 'text-neutral-500'}`}>
                  {section.description}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Content Area */}
      <div className="bg-white/60 backdrop-blur-soft border border-white/30 rounded-2xl shadow-soft-lg p-6">
        
        {/* Members Management */}
        {activeSection === 'members' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
              <h3 className="text-xl font-bold text-neutral-700">Gestión de Socios</h3>
              <button
                onClick={handleAddMember}
                className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-green-600 to-green-500 text-white rounded-xl shadow-soft-sm hover:shadow-soft-md transition-all duration-300"
              >
                <UserPlus className="w-5 h-5" />
                <span>Agregar Socio</span>
              </button>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-neutral-400" />
              <input
                type="text"
                placeholder="Buscar socios..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-white/50 backdrop-blur-medium border border-white/30 rounded-xl shadow-soft-xs focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            {/* Members List */}
            <div className="space-y-3">
              {members.map((member) => (
                <div key={member.id} className="flex items-center justify-between p-4 bg-white/40 backdrop-blur-soft border border-white/20 rounded-xl">
                  <div className="flex items-center space-x-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                      member.status === 'active' 
                        ? 'bg-green-100 text-green-600' 
                        : 'bg-red-100 text-red-600'
                    }`}>
                      <Users className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="font-medium text-neutral-700">{member.name}</p>
                      <p className="text-sm text-neutral-500">{member.email}</p>
                      <p className="text-xs text-neutral-400">
                        Socio desde: {new Date(member.memberSince).toLocaleDateString('es-CL')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      member.status === 'active'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-red-100 text-red-700'
                    }`}>
                      {member.status === 'active' ? 'Activo' : 'Inactivo'}
                    </span>
                    <button className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                      <Edit className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleRemoveMember(member.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <UserMinus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Content Management */}
        {activeSection === 'content' && (
          <div className="space-y-6">
            <h3 className="text-xl font-bold text-neutral-700">Configurar Contenido</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-6 bg-white/40 backdrop-blur-soft border border-white/20 rounded-xl">
                <div className="flex items-center space-x-3 mb-4">
                  <FileText className="w-8 h-8 text-blue-600" />
                  <div>
                    <h4 className="font-semibold text-neutral-700">Gestión de Noticias</h4>
                    <p className="text-sm text-neutral-500">Crear y editar noticias</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <button className="w-full p-3 text-left bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-blue-700">Crear Nueva Noticia</span>
                      <Plus className="w-4 h-4 text-blue-600" />
                    </div>
                  </button>
                  <button className="w-full p-3 text-left bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-blue-700">Ver Noticias Publicadas</span>
                      <Eye className="w-4 h-4 text-blue-600" />
                    </div>
                  </button>
                </div>
              </div>

              <div className="p-6 bg-white/40 backdrop-blur-soft border border-white/20 rounded-xl">
                <div className="flex items-center space-x-3 mb-4">
                  <Calendar className="w-8 h-8 text-purple-600" />
                  <div>
                    <h4 className="font-semibold text-neutral-700">Gestión de Eventos</h4>
                    <p className="text-sm text-neutral-500">Crear y organizar eventos</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <button className="w-full p-3 text-left bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-purple-700">Crear Nuevo Evento</span>
                      <Plus className="w-4 h-4 text-purple-600" />
                    </div>
                  </button>
                  <button className="w-full p-3 text-left bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-purple-700">Ver Eventos Programados</span>
                      <Eye className="w-4 h-4 text-purple-600" />
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Payments Management */}
        {activeSection === 'payments' && (
          <div className="space-y-6">
            <h3 className="text-xl font-bold text-neutral-700">Gestión de Cuotas</h3>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <div className="space-y-3">
                  {members.map((member) => (
                    <div key={member.id} className="p-4 bg-white/40 backdrop-blur-soft border border-white/20 rounded-xl">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <p className="font-medium text-neutral-700">{member.name}</p>
                          <p className="text-sm text-neutral-500">Último pago: {new Date(member.lastPayment).toLocaleDateString('es-CL')}</p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                          new Date(member.lastPayment) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-700'
                        }`}>
                          {new Date(member.lastPayment) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) ? 'Al día' : 'Atrasado'}
                        </span>
                      </div>
                      
                      <div className="flex flex-wrap gap-2">
                        {['Oct 2024', 'Nov 2024', 'Dic 2024'].map((month) => (
                          <button
                            key={month}
                            onClick={() => handleMarkPayment(member.id, month)}
                            className="px-3 py-1 text-sm bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg transition-colors"
                          >
                            Marcar {month}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <div className="p-4 bg-gradient-to-r from-green-50 to-green-100 border border-green-200 rounded-xl">
                  <div className="flex items-center space-x-2 mb-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span className="font-medium text-green-700">Al Día</span>
                  </div>
                  <p className="text-2xl font-bold text-green-800">2 socios</p>
                </div>

                <div className="p-4 bg-gradient-to-r from-red-50 to-red-100 border border-red-200 rounded-xl">
                  <div className="flex items-center space-x-2 mb-2">
                    <AlertCircle className="w-5 h-5 text-red-600" />
                    <span className="font-medium text-red-700">Atrasados</span>
                  </div>
                  <p className="text-2xl font-bold text-red-800">1 socio</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Communications */}
        {activeSection === 'communications' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
              <h3 className="text-xl font-bold text-neutral-700">Centro de Comunicados</h3>
              <button
                onClick={handleSendCommunication}
                className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-xl shadow-soft-sm hover:shadow-soft-md transition-all duration-300"
              >
                <Send className="w-5 h-5" />
                <span>Nuevo Comunicado</span>
              </button>
            </div>

            {/* Communication Types */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="p-4 bg-gradient-to-r from-red-50 to-red-100 border border-red-200 rounded-xl text-center">
                <AlertCircle className="w-8 h-8 text-red-600 mx-auto mb-2" />
                <p className="font-medium text-red-700">Noticias Importantes</p>
                <p className="text-sm text-red-600">Eventos críticos</p>
              </div>
              
              <div className="p-4 bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-xl text-center">
                <Settings className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                <p className="font-medium text-blue-700">Noticias Corrientes</p>
                <p className="text-sm text-blue-600">Actualizaciones generales</p>
              </div>
              
              <div className="p-4 bg-gradient-to-r from-orange-50 to-orange-100 border border-orange-200 rounded-xl text-center">
                <Send className="w-8 h-8 text-orange-600 mx-auto mb-2" />
                <p className="font-medium text-orange-700">Comunicados Urgentes</p>
                <p className="text-sm text-orange-600">Avisos inmediatos</p>
              </div>
            </div>

            {/* Recent Communications */}
            <div className="space-y-3">
              <h4 className="font-semibold text-neutral-700">Comunicados Recientes</h4>
              {communications.map((comm) => (
                <div key={comm.id} className="p-4 bg-white/40 backdrop-blur-soft border border-white/20 rounded-xl">
                  <div className="flex items-center justify-between mb-2">
                    <h5 className="font-medium text-neutral-700">{comm.title}</h5>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        comm.type === 'importante' ? 'bg-red-100 text-red-700' :
                        comm.type === 'corriente' ? 'bg-blue-100 text-blue-700' :
                        'bg-orange-100 text-orange-700'
                      }`}>
                        {comm.type}
                      </span>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        comm.status === 'sent' 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-gray-100 text-gray-700'
                      }`}>
                        {comm.status === 'sent' ? 'Enviado' : 'Borrador'}
                      </span>
                    </div>
                  </div>
                  <p className="text-sm text-neutral-600 mb-2">{comm.content}</p>
                  {comm.sentAt && (
                    <p className="text-xs text-neutral-400">
                      Enviado: {new Date(comm.sentAt).toLocaleDateString('es-CL')}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Modal Agregar Socio */}
      {showAddMemberModal && (
        <CreateSocioModal
          onClose={() => setShowAddMemberModal(false)}
          onSocioCreated={handleCreateSocio}
        />
      )}

      {/* Modal Nuevo Comunicado */}
      {showAddCommunicationModal && (
        <CreateCommunicationModal
          onClose={() => setShowAddCommunicationModal(false)}
          onCommunicationCreated={handleCreateCommunication}
        />
      )}
    </div>
  );
};

// Modal para crear socio - Componente separado
function CreateSocioModal({ onClose, onSocioCreated }: {
  onClose: () => void;
  onSocioCreated: (data: any) => void;
}) {
  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    email: '',
    telefono: '',
    rut: '',
    direccion: '',
    valorCuota: 6500,
    password: '',
  });
  const [foto, setFoto] = useState<File | null>(null);
  const [fotoPreview, setFotoPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFoto(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setFotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Validaciones
      if (!formData.nombre || !formData.apellido || !formData.email || !formData.password) {
        throw new Error('Por favor completa todos los campos obligatorios');
      }

      if (formData.password.length < 6) {
        throw new Error('La contraseña debe tener al menos 6 caracteres');
      }

      // Crear socio a través de la API
      const response = await fetch('/api/admin/socios', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al crear socio');
      }

      const data = await response.json();
      const socioId = data.data?.id;

      // Si hay foto, subirla
      if (foto && socioId) {
        const formDataFoto = new FormData();
        formDataFoto.append('foto', foto);

        await fetch(`/api/admin/socios/${socioId}/foto`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          },
          body: formDataFoto,
        });
      }

      onSocioCreated(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Agregar Nuevo Socio</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <span className="text-2xl">×</span>
            </button>
          </div>

          {error && (
            <div className="mb-4 bg-red-50 border-l-4 border-red-400 p-4 rounded">
              <div className="flex items-center">
                <AlertCircle className="h-5 w-5 text-red-400 mr-2" />
                <p className="text-red-700">{error}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Foto */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Foto del Socio <span className="text-red-500">*</span>
              </label>
              <div className="flex items-center space-x-4">
                <div className="flex-shrink-0">
                  {fotoPreview ? (
                    <img
                      src={fotoPreview}
                      alt="Preview"
                      className="h-20 w-20 rounded-full object-cover"
                    />
                  ) : (
                    <div className="h-20 w-20 rounded-full bg-gray-200 flex items-center justify-center">
                      <Upload className="h-8 w-8 text-gray-400" />
                    </div>
                  )}
                </div>
                <label className="cursor-pointer bg-white px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                  <span className="text-sm text-gray-700">Seleccionar foto</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFotoChange}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            {/* Nombre y Apellido */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Apellido <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.apellido}
                  onChange={(e) => setFormData({ ...formData, apellido: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Email y Teléfono */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Correo Electrónico <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Teléfono <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  required
                  value={formData.telefono}
                  onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                  placeholder="+56912345678"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* RUT */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                RUT <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.rut}
                onChange={(e) => setFormData({ ...formData, rut: e.target.value })}
                placeholder="12.345.678-9"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>

            {/* Dirección */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Dirección <span className="text-red-500">*</span>
              </label>
              <textarea
                required
                value={formData.direccion}
                onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                rows={2}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>

            {/* Valor Cuota */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Valor Cuota Mensual (CLP) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                required
                value={formData.valorCuota}
                onChange={(e) => setFormData({ ...formData, valorCuota: parseInt(e.target.value) })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
              <p className="mt-1 text-sm text-gray-500">Valor por defecto: $6.500 CLP</p>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Contraseña <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                minLength={6}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
              <p className="mt-1 text-sm text-gray-500">Mínimo 6 caracteres</p>
            </div>

            {/* Botones */}
            <div className="flex items-center justify-end space-x-4 pt-4 border-t">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex items-center px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    Creando...
                  </>
                ) : (
                  <>
                    <UserPlus className="h-5 w-5 mr-2" />
                    Crear Socio
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

// Modal para crear comunicado - Componente separado
function CreateCommunicationModal({ onClose, onCommunicationCreated }: {
  onClose: () => void;
  onCommunicationCreated: (data: any) => void;
}) {
  const [formData, setFormData] = useState({
    titulo: '',
    contenido: '',
    tipo: 'corriente' as 'importante' | 'corriente' | 'urgente',
    destinatarios: [] as string[],
    enviar: false
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const destinatariosOpciones = [
    { value: 'todos', label: 'Todos los socios' },
    { value: 'morosos', label: 'Socios con cuotas pendientes' },
    { value: 'activos', label: 'Socios con cuotas al día' },
    { value: 'administradores', label: 'Solo administradores' }
  ];

  const handleDestinatarioToggle = (value: string) => {
    setFormData(prev => ({
      ...prev,
      destinatarios: prev.destinatarios.includes(value)
        ? prev.destinatarios.filter(d => d !== value)
        : [...prev.destinatarios, value]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validaciones
    if (!formData.titulo.trim()) {
      setError('El título es requerido');
      return;
    }

    if (!formData.contenido.trim()) {
      setError('El contenido es requerido');
      return;
    }

    if (formData.destinatarios.length === 0) {
      setError('Selecciona al menos un destinatario');
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/admin/comunicados', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al crear comunicado');
      }

      const data = await response.json();
      onCommunicationCreated(data.comunicado);
    } catch (err: any) {
      console.error('Error creating communication:', err);
      setError(err.message || 'Error al crear comunicado');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-blue-500 text-white px-6 py-4 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Send className="h-6 w-6" />
              <h2 className="text-xl font-bold">Nuevo Comunicado</h2>
            </div>
            <button
              onClick={onClose}
              disabled={loading}
              className="hover:bg-white/20 rounded-full p-1 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start">
              <AlertCircle className="h-5 w-5 text-red-600 mr-2 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Título */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Título <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.titulo}
                onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                placeholder="Ej: Reunión General Noviembre"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Tipo */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo de Comunicado <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, tipo: 'corriente' })}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    formData.tipo === 'corriente'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-blue-300'
                  }`}
                >
                  <div className="text-center">
                    <Settings className="w-6 h-6 mx-auto mb-1 text-blue-600" />
                    <p className="text-sm font-medium">Corriente</p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, tipo: 'importante' })}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    formData.tipo === 'importante'
                      ? 'border-red-500 bg-red-50'
                      : 'border-gray-200 hover:border-red-300'
                  }`}
                >
                  <div className="text-center">
                    <AlertCircle className="w-6 h-6 mx-auto mb-1 text-red-600" />
                    <p className="text-sm font-medium">Importante</p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, tipo: 'urgente' })}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    formData.tipo === 'urgente'
                      ? 'border-orange-500 bg-orange-50'
                      : 'border-gray-200 hover:border-orange-300'
                  }`}
                >
                  <div className="text-center">
                    <Send className="w-6 h-6 mx-auto mb-1 text-orange-600" />
                    <p className="text-sm font-medium">Urgente</p>
                  </div>
                </button>
              </div>
            </div>

            {/* Contenido */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Contenido <span className="text-red-500">*</span>
              </label>
              <textarea
                required
                value={formData.contenido}
                onChange={(e) => setFormData({ ...formData, contenido: e.target.value })}
                placeholder="Escribe el contenido del comunicado..."
                rows={6}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              />
            </div>

            {/* Destinatarios */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Destinatarios <span className="text-red-500">*</span>
              </label>
              <div className="space-y-2">
                {destinatariosOpciones.map((opcion) => (
                  <label
                    key={opcion.value}
                    className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={formData.destinatarios.includes(opcion.value)}
                      onChange={() => handleDestinatarioToggle(opcion.value)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="ml-3 text-sm text-gray-700">{opcion.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Checkbox para enviar inmediatamente */}
            <div className="pt-4 border-t">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.enviar}
                  onChange={(e) => setFormData({ ...formData, enviar: e.target.checked })}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="ml-3 text-sm text-gray-700">
                  Enviar inmediatamente (si no se marca, se guardará como borrador)
                </span>
              </label>
            </div>

            {/* Botones */}
            <div className="flex items-center justify-end space-x-4 pt-4 border-t">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    {formData.enviar ? 'Enviando...' : 'Guardando...'}
                  </>
                ) : (
                  <>
                    <Send className="h-5 w-5 mr-2" />
                    {formData.enviar ? 'Enviar Comunicado' : 'Guardar Borrador'}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}