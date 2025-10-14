/**
 * Sistema de Roles y Permisos - ACA Chile
 * Definiciones extendidas para manejo de autorización
 */

import { User, RegisterRequest } from './index';

// Roles del sistema
export type UserRole = 'user' | 'organizer' | 'moderator' | 'admin' | 'super_admin';

// Permisos específicos
export type Permission = 
  // Eventos
  | 'events.create'
  | 'events.read'
  | 'events.update.own'
  | 'events.update.any'
  | 'events.delete.own' 
  | 'events.delete.any'
  | 'events.moderate'
  | 'events.publish'
  // Usuarios
  | 'users.create'
  | 'users.read'
  | 'users.update.own'
  | 'users.update.any'
  | 'users.delete'
  | 'users.moderate'
  // Inscripciones
  | 'inscriptions.create'
  | 'inscriptions.read.own'
  | 'inscriptions.read.any'
  | 'inscriptions.cancel.own'
  | 'inscriptions.cancel.any'
  // Noticias
  | 'news.create'
  | 'news.read'
  | 'news.update'
  | 'news.delete'
  | 'news.publish'
  // Admin
  | 'admin.dashboard'
  | 'admin.analytics'
  | 'admin.settings'
  | 'admin.logs';

// Usuario extendido con roles
export interface UserWithRoles extends User {
  roles: UserRole[];
  permissions?: Permission[];
  status: 'pending' | 'active' | 'suspended' | 'banned';
  emailVerified: boolean;
  lastLogin?: string;
  createdBy?: number;
  approvedBy?: number;
  approvedAt?: string;
}

// Configuración de roles y sus permisos
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  user: [
    'events.read',
    'inscriptions.create',
    'inscriptions.read.own',
    'inscriptions.cancel.own',
    'users.update.own',
    'news.read'
  ],
  organizer: [
    // Permisos de user
    'events.read',
    'inscriptions.create',
    'inscriptions.read.own',
    'inscriptions.cancel.own',
    'users.update.own',
    'news.read',
    // Permisos adicionales
    'events.create',
    'events.update.own',
    'events.delete.own',
    'inscriptions.read.any' // Ver inscripciones de sus eventos
  ],
  moderator: [
    // Permisos de organizer
    'events.read',
    'events.create',
    'events.update.own',
    'events.delete.own',
    'inscriptions.create',
    'inscriptions.read.any',
    'inscriptions.cancel.own',
    'users.update.own',
    'news.read',
    // Permisos adicionales
    'events.moderate',
    'events.update.any', // Editar eventos de otros
    'users.read',
    'users.moderate',
    'news.create',
    'news.update'
  ],
  admin: [
    // Permisos de moderator
    'events.read',
    'events.create',
    'events.update.own',
    'events.update.any',
    'events.delete.own',
    'events.delete.any',
    'events.moderate',
    'events.publish',
    'inscriptions.create',
    'inscriptions.read.any',
    'inscriptions.cancel.any',
    'users.read',
    'users.update.own',
    'users.update.any',
    'users.moderate',
    'news.create',
    'news.read',
    'news.update',
    'news.delete',
    'news.publish',
    // Permisos adicionales
    'admin.dashboard',
    'admin.analytics',
    'users.create' // Crear usuarios manualmente
  ],
  super_admin: [
    // Todos los permisos
    'events.create',
    'events.read',
    'events.update.own',
    'events.update.any',
    'events.delete.own',
    'events.delete.any',
    'events.moderate',
    'events.publish',
    'inscriptions.create',
    'inscriptions.read.own',
    'inscriptions.read.any',
    'inscriptions.cancel.own',
    'inscriptions.cancel.any',
    'users.create',
    'users.read',
    'users.update.own',
    'users.update.any',
    'users.delete',
    'users.moderate',
    'news.create',
    'news.read',
    'news.update',
    'news.delete',
    'news.publish',
    'admin.dashboard',
    'admin.analytics',
    'admin.settings',
    'admin.logs'
  ]
};

// Estados de registro
export type RegistrationStatus = 'pending' | 'approved' | 'rejected';

// Solicitud de registro extendida
export interface RegistrationRequest extends RegisterRequest {
  motivation?: string; // Por qué quiere unirse
  experience?: string; // Experiencia en asados
  references?: string; // Referencias o recomendaciones
  preferredRole?: 'user' | 'organizer'; // Rol solicitado
}

// Respuesta de registro pendiente
export interface PendingRegistration {
  id: string;
  userData: RegistrationRequest;
  status: RegistrationStatus;
  submittedAt: string;
  reviewedBy?: number;
  reviewedAt?: string;
  reviewNotes?: string;
}

// Utilidades para permisos
export function hasPermission(user: UserWithRoles, permission: Permission): boolean {
  // Verificar si tiene el permiso directamente
  if (user.permissions?.includes(permission)) {
    return true;
  }
  
  // Verificar permisos por rol
  return user.roles.some(role => 
    ROLE_PERMISSIONS[role]?.includes(permission)
  );
}

export function hasAnyRole(user: UserWithRoles, roles: UserRole[]): boolean {
  return roles.some(role => user.roles.includes(role));
}

export function canEditEvent(user: UserWithRoles, eventOwnerId: number): boolean {
  // Puede editar si es el propietario y tiene permiso para editar propios
  if (user.id === eventOwnerId && hasPermission(user, 'events.update.own')) {
    return true;
  }
  
  // Puede editar cualquier evento si tiene el permiso
  return hasPermission(user, 'events.update.any');
}

export function canDeleteEvent(user: UserWithRoles, eventOwnerId: number): boolean {
  // Puede eliminar si es el propietario y tiene permiso para eliminar propios
  if (user.id === eventOwnerId && hasPermission(user, 'events.delete.own')) {
    return true;
  }
  
  // Puede eliminar cualquier evento si tiene el permiso
  return hasPermission(user, 'events.delete.any');
}

// Configuración de membresías
export interface MembershipTier {
  type: 'basic' | 'premium' | 'vip';
  name: string;
  description: string;
  price: number; // Precio anual en CLP
  features: string[];
  maxEventsPerMonth: number;
  priority: number; // Para ordenar inscripciones
}

export const MEMBERSHIP_TIERS: Record<string, MembershipTier> = {
  basic: {
    type: 'basic',
    name: 'Miembro Básico',
    description: 'Acceso a eventos públicos y funciones básicas',
    price: 0,
    features: [
      'Participar en eventos públicos',
      'Ver calendario de eventos',
      'Acceso al foro básico'
    ],
    maxEventsPerMonth: 2,
    priority: 1
  },
  premium: {
    type: 'premium',
    name: 'Miembro Premium',
    description: 'Acceso completo y beneficios adicionales',
    price: 50000,
    features: [
      'Todo lo de Miembro Básico',
      'Crear hasta 3 eventos por mes',
      'Acceso prioritario a talleres',
      'Descuentos en eventos pagados',
      'Kit de bienvenida'
    ],
    maxEventsPerMonth: 3,
    priority: 2
  },
  vip: {
    type: 'vip',
    name: 'Miembro VIP',
    description: 'Experiencia completa y exclusiva',
    price: 120000,
    features: [
      'Todo lo de Miembro Premium',
      'Eventos ilimitados',
      'Acceso a eventos VIP exclusivos',
      'Asesoría personalizada',
      'Kit premium anual',
      'Invitaciones especiales'
    ],
    maxEventsPerMonth: -1, // Ilimitado
    priority: 3
  }
};