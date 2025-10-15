import React, { useState } from 'react';
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
  CheckCircle
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface Member {
  id: number;
  name: string;
  email: string;
  phone: string;
  memberSince: string;
  status: 'active' | 'inactive';
  lastPayment: string;
  role: string;
}

interface Communication {
  id: number;
  title: string;
  content: string;
  type: 'importante' | 'corriente' | 'urgente';
  recipients: string[];
  sentAt: string;
  status: 'draft' | 'sent';
}

export const AdminModule: React.FC = () => {
  const { hasPermission } = useAuth();
  const [activeSection, setActiveSection] = useState<'members' | 'content' | 'payments' | 'communications'>('members');
  const [searchTerm, setSearchTerm] = useState('');

  // Mock data
  const members: Member[] = [
    { id: 1, name: 'Juan Pérez', email: 'juan@email.com', phone: '+56912345678', memberSince: '2023-01-15', status: 'active', lastPayment: '2024-10-01', role: 'usuario' },
    { id: 2, name: 'María González', email: 'maria@email.com', phone: '+56987654321', memberSince: '2022-06-10', status: 'active', lastPayment: '2024-09-15', role: 'director' },
    { id: 3, name: 'Carlos Silva', email: 'carlos@email.com', phone: '+56911222333', memberSince: '2024-02-01', status: 'inactive', lastPayment: '2024-07-01', role: 'usuario' },
  ];

  const communications: Communication[] = [
    { id: 1, title: 'Evento Especial - Campeonato Nacional', content: 'Se aproxima nuestro evento más importante del año...', type: 'importante', recipients: ['todos'], sentAt: '2024-10-15', status: 'sent' },
    { id: 2, title: 'Recordatorio de Cuotas', content: 'Les recordamos que las cuotas de octubre...', type: 'corriente', recipients: ['morosos'], sentAt: '', status: 'draft' },
  ];

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
    // Implementar modal para agregar socio
    console.log('Agregar socio');
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
    // Implementar envío de comunicado
    console.log('Enviar comunicado');
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
    </div>
  );
};