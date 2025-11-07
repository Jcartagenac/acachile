/**
 * Shared types and constants for the ACA Chile projects.
 * These definitions are consumed by both the frontend app and the Cloudflare functions.
 */

/** Region names used across onboarding and profile flows */
export const REGIONES_CHILE = [
  'Arica y Parinacota',
  'Tarapacá',
  'Antofagasta',
  'Atacama',
  'Coquimbo',
  'Valparaíso',
  'Metropolitana de Santiago',
  "Libertador General Bernardo O'Higgins",
  'Maule',
  'Ñuble',
  'Biobío',
  'La Araucanía',
  'Los Ríos',
  'Los Lagos',
  'Aysén del General Carlos Ibáñez del Campo',
  'Magallanes y de la Antártica Chilena'
] as const;

export type RegionName = (typeof REGIONES_CHILE)[number];

export type UserRole = 'admin' | 'director' | 'director_editor' | 'usuario';

// Legacy role mappings for backward compatibility
export type LegacyUserRole = 'editor' | 'user' | 'organizer' | 'super_admin';

// Role hierarchy and permissions
export const ROLE_HIERARCHY = {
  admin: 4,
  director: 3,
  director_editor: 2,
  usuario: 1
} as const;

// Role permissions mapping
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  admin: [
    'manage_users',
    'manage_events',
    'manage_content',
    'manage_system',
    'view_analytics',
    'moderate_community',
    'access_admin_panel'
  ],
  director: [
    'manage_events',
    'manage_content',
    'view_analytics',
    'moderate_community',
    'access_director_panel'
  ],
  director_editor: [
    'manage_events',
    'manage_content',
    'moderate_community',
    'access_editor_panel'
  ],
  usuario: [
    'view_events',
    'join_events',
    'view_content',
    'access_profile'
  ]
};

export type Permission = 
  | 'manage_users'
  | 'manage_events'
  | 'manage_content'
  | 'manage_system'
  | 'view_analytics'
  | 'moderate_community'
  | 'access_admin_panel'
  | 'access_director_panel'
  | 'access_editor_panel'
  | 'view_events'
  | 'join_events'
  | 'view_content'
  | 'access_profile';

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext?: boolean;
  hasPrev?: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: Pagination;
}

export type EventStatus = 'draft' | 'published' | 'cancelled' | 'completed';

export interface Evento {
  id: number;
  title: string;
  description: string;
  date: string; // Fecha de inicio
  endDate?: string; // Fecha de fin (opcional para eventos multi-día)
  time?: string;
  location: string;
  image: string;
  type: string;
  status: EventStatus;
  registrationOpen: boolean;
  maxParticipants?: number;
  currentParticipants: number;
  price?: number;
  requirements?: string[];
  tags?: string[];
  organizerId: number;
  organizerName?: string;
  contactInfo?: Record<string, unknown>;
  isPublic: boolean; // Indica si el evento permite inscripción pública sin autenticación
  paymentLink?: string; // Enlace para pagos o generación de entradas
  createdAt: string;
  updatedAt: string;
}

export interface EventoForm {
  title: string;
  description: string;
  date: string; // Fecha de inicio
  endDate?: string; // Fecha de fin (opcional para eventos multi-día)
  time?: string;
  location: string;
  image?: string;
  type?: string;
  status?: EventStatus;
  registrationOpen?: boolean;
  maxParticipants?: number;
  price?: number;
  requirements?: string[];
  tags?: string[];
  contactInfo?: Record<string, unknown>;
  isPublic?: boolean; // Indica si el evento permite inscripción pública sin autenticación
  paymentLink?: string; // Enlace para pagos o generación de entradas
}

export type EventInscriptionStatus = 'pending' | 'confirmed' | 'waitlist' | 'cancelled';

export interface EventInscription {
  id: string;
  eventId: number;
  eventoId?: number;
  userId: number;
  status: EventInscriptionStatus;
  estado?: 'pendiente' | 'confirmada' | 'lista_espera' | 'cancelada';
  notes?: string;
  createdAt: string;
  fechaInscripcion?: string;
  updatedAt?: string;
  evento?: Evento | null;
}

export interface EventParticipantsPayload {
  evento: Evento | null;
  inscripciones: EventInscription[];
  stats?: Record<string, unknown>;
}

export interface AuthApiUser {
  id: number;
  email: string;
  nombre: string;
  apellido: string;
  telefono?: string | null;
  rut?: string | null;
  ciudad?: string | null;
  direccion?: string | null;
  role: UserRole;
  activo: boolean;
  created_at: string;
  last_login?: string | null;
}

export interface AppUser {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  name: string;
  roles: UserRole[];
  avatar?: string | null;
  phone?: string | null;
  rut?: string | null;
  ciudad?: string | null;
  direccion?: string | null;
  region?: RegionName | string | null;
  membershipType?: string | null;
  isActive: boolean;
  createdAt: string;
  lastLogin?: string | null;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
  phone?: string;
  region?: RegionName | string;
  rut?: string;
  preferredRole?: 'user' | 'organizer';
  motivation?: string;
  experience?: string;
  references?: string;
}

export interface AuthResponse {
  success: boolean;
  data?: {
    user: AuthApiUser;
    token: string;
  };
  message?: string;
  error?: string;
}

// User profile and account types
export interface UserProfile extends AppUser {
  direccion?: string;
  fechaIngreso?: string;
  yearsInACA?: number;
  avatar?: string;
}

export interface MembershipPayment {
  id: number;
  userId: number;
  month: number;
  year: number;
  amount: number;
  paid: boolean;
  paidDate?: string;
  paymentMethod?: 'efectivo' | 'transferencia' | 'tarjeta';
  notes?: string;
}

export interface Tournament {
  id: number;
  name: string;
  date: string;
  position?: number;
  participants: number;
  category: string;
}

export interface Award {
  id: number;
  title: string;
  description: string;
  date: string;
  category: 'torneo' | 'reconocimiento' | 'participacion';
  imageUrl?: string;
}

export interface UserAccount {
  payments: MembershipPayment[];
  tournaments: Tournament[];
  awards: Award[];
  eventsParticipated: Evento[];
}

export interface NotificationPreferences {
  noticiasImportantes: boolean;
  noticiasCorrientes: boolean;
  comunicadosUrgentes: boolean;
  medios: {
    whatsapp: boolean;
    email: boolean;
    sms: boolean;
  };
}

export interface UserSettings {
  notifications: NotificationPreferences;
  privacy: {
    showProfile: boolean;
    showParticipation: boolean;
    allowMessages: boolean;
  };
}

// Admin panel types
export interface AdminNews {
  id: number;
  title: string;
  content: string;
  type: 'importante' | 'corriente' | 'urgente';
  publishDate: string;
  authorId: number;
  published: boolean;
}

export interface CommunicationType {
  id: number;
  name: string;
  type: 'importante' | 'corriente' | 'urgente';
  template: string;
}

export interface MemberManagement {
  id: number;
  userId: number;
  action: 'agregar' | 'quitar' | 'editar' | 'pago_cuota';
  details: Record<string, unknown>;
  performedBy: number;
  date: string;
}

export interface RegisterResponse {
  success: boolean;
  data?: {
    user: AuthApiUser;
    token?: string;
  };
  message?: string;
  error?: string;
}

// Role utility functions
export const roleUtils = {
  hasPermission: (userRole: UserRole, permission: Permission): boolean => {
    return ROLE_PERMISSIONS[userRole]?.includes(permission) || false;
  },
  
  canManage: (userRole: UserRole, targetRole: UserRole): boolean => {
    return ROLE_HIERARCHY[userRole] > ROLE_HIERARCHY[targetRole];
  },
  
  getRoleDisplayName: (role: UserRole): string => {
    const displayNames = {
      admin: 'Administrador',
      director: 'Director',
      director_editor: 'Director Editor',
      usuario: 'Usuario'
    };
    return displayNames[role];
  },
  
  getRoleColor: (role: UserRole): string => {
    const colors = {
      admin: 'red',
      director: 'purple',
      director_editor: 'blue',
      usuario: 'green'
    };
    return colors[role];
  },
  
  getAllRoles: (): UserRole[] => {
    return Object.keys(ROLE_HIERARCHY) as UserRole[];
  },
  
  isHigherRole: (role1: UserRole, role2: UserRole): boolean => {
    return ROLE_HIERARCHY[role1] > ROLE_HIERARCHY[role2];
  }
};
