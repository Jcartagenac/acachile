/**
 * Tipos compartidos entre Frontend y Worker
 * ACA Chile - Asociación Chilena de Asadores
 */

// Eventos
export interface Evento {
  id: number;
  title: string;
  date: string;
  location: string;
  description: string;
  image: string;
  type: 'campeonato' | 'taller' | 'encuentro' | 'torneo';
  registrationOpen?: boolean;
  maxParticipants?: number;
  currentParticipants?: number;
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