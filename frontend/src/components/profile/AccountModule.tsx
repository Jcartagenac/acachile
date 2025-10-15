import React, { useState } from 'react';
import { 
  CreditCard, 
  Trophy, 
  Calendar, 
  Award,
  CheckCircle,
  XCircle,
  Clock,
  Search
} from 'lucide-react';
import { MembershipPayment, Tournament, Award as AwardType } from '@shared/index';

export const AccountModule: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'payments' | 'tournaments' | 'awards' | 'events'>('payments');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterYear, setFilterYear] = useState<string>('2024');

  // Mock data - En producción vendrá de API
  const payments: MembershipPayment[] = [
    { id: 1, userId: 1, month: 10, year: 2024, amount: 25000, paid: true, paidDate: '2024-10-05', paymentMethod: 'transferencia' },
    { id: 2, userId: 1, month: 9, year: 2024, amount: 25000, paid: true, paidDate: '2024-09-03', paymentMethod: 'efectivo' },
    { id: 3, userId: 1, month: 8, year: 2024, amount: 25000, paid: false },
    { id: 4, userId: 1, month: 7, year: 2024, amount: 25000, paid: true, paidDate: '2024-07-02', paymentMethod: 'tarjeta' },
    { id: 5, userId: 1, month: 6, year: 2024, amount: 25000, paid: true, paidDate: '2024-06-05', paymentMethod: 'transferencia' },
  ];

  const tournaments: Tournament[] = [
    { id: 1, name: 'Campeonato Nacional de Asado 2024', date: '2024-09-15', position: 3, participants: 24, category: 'Profesional' },
    { id: 2, name: 'Torneo Regional Santiago', date: '2024-07-20', position: 1, participants: 16, category: 'Amateur' },
    { id: 3, name: 'Copa ACA Primavera', date: '2024-06-10', position: 5, participants: 32, category: 'Profesional' },
    { id: 4, name: 'Desafío Parrilleros del Sur', date: '2024-05-05', position: 2, participants: 12, category: 'Regional' },
  ];

  const awards: AwardType[] = [
    { id: 1, title: 'Mejor Asado Tradicional', description: 'Primer lugar en categoría tradicional', date: '2024-09-15', category: 'torneo' },
    { id: 2, title: 'Participación Destacada', description: 'Por excelente participación en eventos 2024', date: '2024-08-01', category: 'reconocimiento' },
    { id: 3, title: 'Asistencia Perfecta', description: 'Asistió a todos los eventos del año', date: '2024-07-15', category: 'participacion' },
  ];

  const eventsParticipated = [
    { id: 1, title: 'Workshop de Técnicas Avanzadas', date: '2024-10-01', type: 'taller' },
    { id: 2, title: 'Encuentro Mensual Octubre', date: '2024-10-15', type: 'encuentro' },
    { id: 3, title: 'Masterclass con Chef Invitado', date: '2024-09-20', type: 'masterclass' },
  ];

  const getMonthName = (month: number) => {
    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    return months[month - 1];
  };

  const getPaymentMethodIcon = (method?: string) => {
    switch (method) {
      case 'transferencia':
        return '🏦';
      case 'efectivo':
        return '💵';
      case 'tarjeta':
        return '💳';
      default:
        return '❓';
    }
  };

  const getPositionBadge = (position: number) => {
    const colors = {
      1: 'from-yellow-400 to-yellow-500 text-yellow-900',
      2: 'from-gray-300 to-gray-400 text-gray-800',
      3: 'from-orange-400 to-orange-500 text-orange-900'
    };
    
    return colors[position as keyof typeof colors] || 'from-blue-400 to-blue-500 text-blue-900';
  };

  const filteredPayments = payments.filter(p => p.year.toString() === filterYear);
  const totalPaid = filteredPayments.filter(p => p.paid).length;
  const totalPending = filteredPayments.filter(p => !p.paid).length;

  const tabs = [
    { id: 'payments', title: 'Cuotas', icon: CreditCard, count: filteredPayments.length },
    { id: 'tournaments', title: 'Torneos', icon: Trophy, count: tournaments.length },
    { id: 'awards', title: 'Premios', icon: Award, count: awards.length },
    { id: 'events', title: 'Eventos', icon: Calendar, count: eventsParticipated.length },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white/60 backdrop-blur-soft border border-white/30 rounded-2xl shadow-soft-lg p-6">
        <h2 className="text-2xl font-bold text-neutral-700 mb-6">Mi Cuenta</h2>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="text-center p-4 bg-gradient-to-r from-green-50 to-green-25 border border-green-200/50 rounded-xl">
            <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
            <p className="text-sm font-medium text-green-700">Cuotas Pagadas</p>
            <p className="text-2xl font-bold text-green-800">{totalPaid}</p>
          </div>
          
          <div className="text-center p-4 bg-gradient-to-r from-red-50 to-red-25 border border-red-200/50 rounded-xl">
            <XCircle className="w-8 h-8 text-red-600 mx-auto mb-2" />
            <p className="text-sm font-medium text-red-700">Cuotas Pendientes</p>
            <p className="text-2xl font-bold text-red-800">{totalPending}</p>
          </div>
          
          <div className="text-center p-4 bg-gradient-to-r from-blue-50 to-blue-25 border border-blue-200/50 rounded-xl">
            <Trophy className="w-8 h-8 text-blue-600 mx-auto mb-2" />
            <p className="text-sm font-medium text-blue-700">Torneos</p>
            <p className="text-2xl font-bold text-blue-800">{tournaments.length}</p>
          </div>
          
          <div className="text-center p-4 bg-gradient-to-r from-purple-50 to-purple-25 border border-purple-200/50 rounded-xl">
            <Award className="w-8 h-8 text-purple-600 mx-auto mb-2" />
            <p className="text-sm font-medium text-purple-700">Premios</p>
            <p className="text-2xl font-bold text-purple-800">{awards.length}</p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap gap-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-xl transition-all duration-300 ${
                  isActive
                    ? 'bg-gradient-to-r from-primary-600 to-primary-500 text-white shadow-soft-sm'
                    : 'bg-white/50 hover:bg-white/70 text-neutral-700 hover:shadow-soft-xs'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="font-medium">{tab.title}</span>
                <span className={`px-2 py-1 text-xs rounded-full ${
                  isActive 
                    ? 'bg-white/20 text-white' 
                    : 'bg-neutral-100 text-neutral-600'
                }`}>
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Content Area */}
      <div className="bg-white/60 backdrop-blur-soft border border-white/30 rounded-2xl shadow-soft-lg p-6">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-neutral-400" />
            <input
              type="text"
              placeholder="Buscar..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white/50 backdrop-blur-medium border border-white/30 rounded-xl shadow-soft-xs focus:outline-none focus:ring-2 focus:ring-primary-500 focus:shadow-soft-sm"
            />
          </div>
          
          {activeTab === 'payments' && (
            <select
              value={filterYear}
              onChange={(e) => setFilterYear(e.target.value)}
              className="px-4 py-3 bg-white/50 backdrop-blur-medium border border-white/30 rounded-xl shadow-soft-xs focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="2024">2024</option>
              <option value="2023">2023</option>
              <option value="2022">2022</option>
            </select>
          )}
        </div>

        {/* Content based on active tab */}
        {activeTab === 'payments' && (
          <div className="space-y-3">
            {filteredPayments.map((payment) => (
              <div key={payment.id} className="flex items-center justify-between p-4 bg-white/40 backdrop-blur-soft border border-white/20 rounded-xl hover:shadow-soft-sm transition-shadow">
                <div className="flex items-center space-x-4">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                    payment.paid 
                      ? 'bg-green-100 text-green-600' 
                      : 'bg-red-100 text-red-600'
                  }`}>
                    {payment.paid ? <CheckCircle className="w-6 h-6" /> : <Clock className="w-6 h-6" />}
                  </div>
                  <div>
                    <p className="font-medium text-neutral-700">
                      {getMonthName(payment.month)} {payment.year}
                    </p>
                    <p className="text-sm text-neutral-500">
                      ${payment.amount.toLocaleString('es-CL')}
                      {payment.paid && payment.paymentMethod && (
                        <span className="ml-2">
                          {getPaymentMethodIcon(payment.paymentMethod)} {payment.paymentMethod}
                        </span>
                      )}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-semibold ${
                    payment.paid ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {payment.paid ? 'Pagado' : 'Pendiente'}
                  </p>
                  {payment.paidDate && (
                    <p className="text-xs text-neutral-500">
                      {new Date(payment.paidDate).toLocaleDateString('es-CL')}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'tournaments' && (
          <div className="space-y-3">
            {tournaments.map((tournament) => (
              <div key={tournament.id} className="flex items-center justify-between p-4 bg-white/40 backdrop-blur-soft border border-white/20 rounded-xl hover:shadow-soft-sm transition-shadow">
                <div className="flex items-center space-x-4">
                  <div className={`w-12 h-12 rounded-full bg-gradient-to-r ${getPositionBadge(tournament.position || 0)} flex items-center justify-center font-bold text-lg shadow-soft-xs`}>
                    {tournament.position}°
                  </div>
                  <div>
                    <p className="font-medium text-neutral-700">{tournament.name}</p>
                    <p className="text-sm text-neutral-500">
                      {new Date(tournament.date).toLocaleDateString('es-CL')} • {tournament.participants} participantes
                    </p>
                  </div>
                </div>
                <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                  {tournament.category}
                </span>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'awards' && (
          <div className="space-y-3">
            {awards.map((award) => (
              <div key={award.id} className="flex items-center space-x-4 p-4 bg-white/40 backdrop-blur-soft border border-white/20 rounded-xl hover:shadow-soft-sm transition-shadow">
                <div className="w-12 h-12 rounded-full bg-gradient-to-r from-yellow-400 to-yellow-500 flex items-center justify-center shadow-soft-xs">
                  <Award className="w-6 h-6 text-yellow-900" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-neutral-700">{award.title}</p>
                  <p className="text-sm text-neutral-500">{award.description}</p>
                  <p className="text-xs text-neutral-400">
                    {new Date(award.date).toLocaleDateString('es-CL')}
                  </p>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  award.category === 'torneo' ? 'bg-red-100 text-red-700' :
                  award.category === 'reconocimiento' ? 'bg-blue-100 text-blue-700' :
                  'bg-green-100 text-green-700'
                }`}>
                  {award.category}
                </span>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'events' && (
          <div className="space-y-3">
            {eventsParticipated.map((event) => (
              <div key={event.id} className="flex items-center justify-between p-4 bg-white/40 backdrop-blur-soft border border-white/20 rounded-xl hover:shadow-soft-sm transition-shadow">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-r from-primary-100 to-primary-200 flex items-center justify-center">
                    <Calendar className="w-6 h-6 text-primary-600" />
                  </div>
                  <div>
                    <p className="font-medium text-neutral-700">{event.title}</p>
                    <p className="text-sm text-neutral-500">
                      {new Date(event.date).toLocaleDateString('es-CL')}
                    </p>
                  </div>
                </div>
                <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">
                  {event.type}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};