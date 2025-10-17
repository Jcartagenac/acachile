// Tipos base de la aplicación

export interface Event {
  id: string;
  title: string;
  description: string;
  date: Date;
  endDate?: Date;
  location: string;
  category: EventCategory;
  imageUrl?: string;
  registrationUrl?: string;
  isRegistrationOpen: boolean;
  maxParticipants?: number;
  currentParticipants: number;
  price?: number;
  isFeatured: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Post {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  imageUrl?: string;
  category: PostCategory;
  tags: string[];
  author: Author;
  publishedAt?: Date;
  isPublished: boolean;
  isFeatured: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Member {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  city: string;
  region: string;
  membershipStatus: MembershipStatus;
  joinDate: Date;
  sponsor1?: string;
  sponsor2?: string;
  profileImageUrl?: string;
  bio?: string;
  socialLinks?: SocialLinks;
  createdAt: Date;
  updatedAt: Date;
}

export interface Author {
  id: string;
  name: string;
  email: string;
  imageUrl?: string;
  bio?: string;
}

export interface SocialLinks {
  instagram?: string;
  facebook?: string;
  youtube?: string;
  website?: string;
}

export interface Partner {
  id: string;
  name: string;
  logoUrl: string;
  websiteUrl?: string;
  category: PartnerCategory;
  isActive: boolean;
  order: number;
}

export interface SiteConfig {
  siteName: string;
  tagline: string;
  description: string;
  logoUrl: string;
  contactEmail: string;
  socialLinks: SocialLinks;
  featuredContent: {
    heroTitle: string;
    heroDescription: string;
    heroImageUrl: string;
    heroCTAText: string;
    heroCTAUrl: string;
  };
}

// Tipos de unión
export type EventCategory = 
  | 'tournament'
  | 'workshop'
  | 'meeting'
  | 'competition'
  | 'social';

export type PostCategory = 
  | 'news'
  | 'tournament'
  | 'workshop'
  | 'international'
  | 'general';

export type MembershipStatus = 
  | 'pending'
  | 'active'
  | 'inactive'
  | 'suspended';

export type PartnerCategory = 
  | 'sponsor'
  | 'affiliate'
  | 'media'
  | 'supplier';

// API Response types
export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}