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

export type UserRole = 'admin' | 'editor' | 'user' | 'organizer' | 'super_admin';

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
  date: string;
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
  createdAt: string;
  updatedAt: string;
}

export interface EventoForm {
  title: string;
  description: string;
  date: string;
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
  city?: string | null;
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

export interface RegisterResponse {
  success: boolean;
  data?: {
    user: AuthApiUser;
    token?: string;
  };
  message?: string;
  error?: string;
}
