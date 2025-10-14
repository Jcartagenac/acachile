/**
 * Tipos compartidos entre Frontend y Worker
 * ACA Chile - Asociación Chilena de Asadores
 */

// Eventos
export interface Evento {
  id: number;
  title: string;
  date: string;
  time?: string;
  location: string;
  description: string;
  image: string;
  type: 'campeonato' | 'taller' | 'encuentro' | 'torneo';
  registrationOpen: boolean;
  maxParticipants?: number;
  currentParticipants: number;
  price?: number;
  requirements?: string[];
  organizerId: number;
  createdAt: string;
  updatedAt: string;
  status: 'draft' | 'published' | 'cancelled' | 'completed';
  tags?: string[];
  contactInfo?: {
    email?: string;
    phone?: string;
    website?: string;
  };
}

export interface EventoForm {
  title: string;
  date: string;
  time?: string;
  location: string;
  description: string;
  image?: string;
  type: 'campeonato' | 'taller' | 'encuentro' | 'torneo';
  registrationOpen: boolean;
  maxParticipants?: number;
  price?: number;
  requirements?: string[];
  tags?: string[];
  contactInfo?: {
    email?: string;
    phone?: string;
    website?: string;
  };
}

export interface EventInscription {
  id: string;
  userId: number;
  eventId: number;
  userInfo: {
    name: string;
    email: string;
    phone?: string;
    region?: string;
  };
  eventInfo: {
    title: string;
    date: string;
    location: string;
    price?: number;
  };
  status: 'confirmed' | 'pending' | 'cancelled' | 'waitlist';
  inscriptionDate: string;
  paymentStatus?: 'pending' | 'paid' | 'failed' | 'refunded';
  paymentAmount?: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// Noticias
export interface Noticia {
  id: number;
  title: string;
  date: string;
  excerpt: string;
  content?: string;
  image: string;
  author?: string;
  category?: 'evento' | 'torneo' | 'taller' | 'general';
  slug?: string;
}

// Miembros
export interface Miembro {
  id: number;
  name: string;
  email: string;
  phone?: string;
  region: string;
  membershipType: 'basic' | 'premium' | 'vip';
  joinDate: string;
  active: boolean;
}

// Autenticación
export interface User {
  id: number;
  email: string;
  name: string;
  phone?: string;
  region?: RegionChile;
  membershipType?: 'basic' | 'premium' | 'vip';
  avatar?: string;
  joinDate: string;
  active: boolean;
  roles?: string[];
  status?: 'active' | 'pending' | 'suspended';
  emailVerified?: boolean;
}

export interface AuthUser {
  user: User;
  token: string;
  expiresAt: string;
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
  region?: RegionChile;
}

export interface AuthResponse extends ApiResponse<AuthUser> {}

// Sesión
export interface UserSession {
  user: User;
  token: string;
  isAuthenticated: boolean;
}

// API Responses
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// Constantes
export const REGIONES_CHILE = [
  'Arica y Parinacota',
  'Tarapacá',
  'Antofagasta',
  'Atacama',
  'Coquimbo',
  'Valparaíso',
  'Metropolitana',
  'O\'Higgins',
  'Maule',
  'Ñuble',
  'Biobío',
  'La Araucanía',
  'Los Ríos',
  'Los Lagos',
  'Aysén',
  'Magallanes'
] as const;

export type RegionChile = typeof REGIONES_CHILE[number];

// Utilidades
export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('es-CL', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove accents
    .replace(/[^a-z0-9 -]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .trim();
}

// Exportar tipos de auth-roles
export * from './auth-roles';