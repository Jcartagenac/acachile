/**
 * Sistema de gestión de eventos con Cloudflare KV
 * ACA Chile - Eventos y participación
 */

export interface Env {
  ACA_KV: KVNamespace;
  ENVIRONMENT: string;
  JWT_SECRET?: string;
  ADMIN_EMAIL?: string;
  CORS_ORIGIN?: string;
  RESEND_API_KEY?: string;
  FROM_EMAIL?: string;
  FRONTEND_URL?: string;
}

interface Evento {
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

interface EventoForm {
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

// Eventos de ejemplo para inicializar el sistema
const eventosIniciales: Evento[] = [
  {
    id: 1,
    title: 'Campeonato Nacional de Asadores 2025',
    date: '2025-11-15',
    time: '09:00',
    location: 'Parque O\'Higgins, Santiago',
    description: 'El evento más importante del año para asadores chilenos. Competencia por categorías con premiación especial y degustación para el público.\n\nEn este campeonato nacional participarán los mejores asadores de todas las regiones del país, compitiendo en diferentes categorías como mejor asado, mejor chorizo, y mejor acompañamiento.\n\nEl evento incluye:\n- Competencias oficiales por categorías\n- Degustación abierta al público\n- Actividades para toda la familia\n- Premiación con trofeos y premios en efectivo\n- Música en vivo y entretenimiento',
    image: 'https://acachile.com/wp-content/uploads/2025/03/64694334-bbdc-4e97-b4a7-ef75e6bbe50d-500x375.jpg',
    type: 'campeonato',
    registrationOpen: true,
    maxParticipants: 50,
    currentParticipants: 32,
    price: 15000,
    organizerId: 1,
    createdAt: '2024-10-01T10:00:00Z',
    updatedAt: '2024-10-14T15:30:00Z',
    status: 'published',
    requirements: [
      'Parrilla propia (tamaño mínimo 60x40cm)',
      'Implementos de cocina básicos',
      'Delantal y gorro de cocinero',
      'Carne proporcionada por la organización'
    ],
    tags: ['campeonato', 'nacional', 'asadores', '2025'],
    contactInfo: {
      email: 'campeonato@acachile.com',
      phone: '+56912345678',
      website: 'https://campeonato.acachile.com'
    }
  },
  {
    id: 2,
    title: 'Taller de Técnicas de Ahumado',
    date: '2025-11-08',
    time: '14:00',
    location: 'Centro de Capacitación ACA, Las Condes',
    description: 'Aprende las técnicas tradicionales de ahumado con expertos internacionales. Incluye degustación y certificado.',
    image: 'https://acachile.com/wp-content/uploads/2024/08/post-alemania-500x375.jpg',
    type: 'taller',
    registrationOpen: true,
    maxParticipants: 20,
    currentParticipants: 8,
    price: 35000,
    organizerId: 2,
    createdAt: '2024-09-15T09:00:00Z',
    updatedAt: '2024-10-10T11:20:00Z',
    status: 'published',
    requirements: ['Sin experiencia previa necesaria'],
    tags: ['taller', 'ahumado', 'técnicas'],
    contactInfo: {
      email: 'talleres@acachile.com',
      phone: '+56987654321'
    }
  },
  {
    id: 3,
    title: 'Encuentro Regional Valparaíso',
    date: '2025-12-08',
    time: '11:00',
    location: 'Viña del Mar, Quinta Región',
    description: 'Encuentro gastronómico regional con asadores de la V Región. Actividades familiares y competencias amistosas.',
    image: 'https://acachile.com/wp-content/uploads/2024/08/post-alemania-500x375.jpg',
    type: 'encuentro',
    registrationOpen: true,
    maxParticipants: undefined,
    currentParticipants: 15,
    price: 0,
    organizerId: 2,
    createdAt: '2024-10-05T16:00:00Z',
    updatedAt: '2024-10-12T09:45:00Z',
    status: 'published',
    requirements: ['Solo ganas de compartir'],
    tags: ['encuentro', 'regional', 'familia'],
    contactInfo: {
      email: 'valparaiso@acachile.com'
    }
  },
  {
    id: 4,
    title: 'Torneo de Costillares',
    date: '2025-11-30',
    time: '10:00',
    location: 'Club de Campo Los Leones',
    description: 'Torneo especializado en preparación de costillares. Modalidad equipos de 3 personas.',
    image: 'https://acachile.com/wp-content/uploads/2024/08/1697587321850-500x375.jpg',
    type: 'torneo',
    registrationOpen: false,
    maxParticipants: 30,
    currentParticipants: 30,
    price: 25000,
    organizerId: 1,
    createdAt: '2024-09-20T12:00:00Z',
    updatedAt: '2024-10-01T14:15:00Z',
    status: 'published',
    requirements: ['Equipo de 3 personas', 'Costillar por equipo'],
    tags: ['torneo', 'costillares', 'equipos'],
    contactInfo: {
      email: 'torneos@acachile.com',
      phone: '+56956789012'
    }
  }
];

// Funciones para gestionar eventos en KV
export async function initializeEventos(env: Env): Promise<{ success: boolean; message: string; data?: any }> {
  try {
    // Verificar si ya existen eventos inicializados
    const existingEventos = await env.ACA_KV.get('eventos:initialized');
    if (existingEventos) {
      return {
        success: true,
        message: 'Eventos ya inicializados previamente',
        data: { count: eventosIniciales.length }
      };
    }

    // Guardar eventos iniciales
    const eventosData = {
      eventos: eventosIniciales,
      lastEventId: Math.max(...eventosIniciales.map(e => e.id)),
      totalCount: eventosIniciales.length,
      initializedAt: new Date().toISOString()
    };

    await env.ACA_KV.put('eventos:all', JSON.stringify(eventosData));

    // Crear índices por ID
    for (const evento of eventosIniciales) {
      await env.ACA_KV.put(`evento:${evento.id}`, JSON.stringify(evento));
    }

    // Marcar como inicializado
    await env.ACA_KV.put('eventos:initialized', 'true');

    return {
      success: true,
      message: 'Eventos inicializados exitosamente',
      data: { count: eventosIniciales.length, eventos: eventosIniciales }
    };

  } catch (error) {
    return {
      success: false,
      message: 'Error inicializando eventos',
      data: { error: error instanceof Error ? error.message : 'Error desconocido' }
    };
  }
}

export async function getEventos(
  env: Env,
  filters: {
    type?: string;
    status?: string;
    search?: string;
    page?: number;
    limit?: number;
    organizerId?: number;
  } = {}
): Promise<{ success: boolean; data?: any; error?: string; pagination?: any }> {
  try {
    // Obtener todos los eventos
    const eventosData = await env.ACA_KV.get('eventos:all');
    if (!eventosData) {
      // Si no hay eventos, inicializar
      const initResult = await initializeEventos(env);
      if (!initResult.success) {
        return { success: false, error: 'Error inicializando eventos' };
      }
      
      // Volver a obtener después de inicializar
      const newEventosData = await env.ACA_KV.get('eventos:all');
      if (!newEventosData) {
        return { success: false, error: 'Error obteniendo eventos después de inicializar' };
      }
      
      const parsedData = JSON.parse(newEventosData);
      let eventos = parsedData.eventos || [];

      // Aplicar filtros
      eventos = applyFilters(eventos, filters);

      // Aplicar paginación
      const { page = 1, limit = 12 } = filters;
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedEventos = eventos.slice(startIndex, endIndex);

      const total = eventos.length;
      const pages = Math.ceil(total / limit);

      return {
        success: true,
        data: paginatedEventos,
        pagination: {
          page,
          limit,
          total,
          pages,
          hasNext: page < pages,
          hasPrev: page > 1
        }
      };
    }

    const parsedData = JSON.parse(eventosData);
    let eventos = parsedData.eventos || [];

    // Aplicar filtros
    eventos = applyFilters(eventos, filters);

    // Aplicar paginación
    const { page = 1, limit = 12 } = filters;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedEventos = eventos.slice(startIndex, endIndex);

    const total = eventos.length;
    const pages = Math.ceil(total / limit);

    return {
      success: true,
      data: paginatedEventos,
      pagination: {
        page,
        limit,
        total,
        pages,
        hasNext: page < pages,
        hasPrev: page > 1
      }
    };

  } catch (error) {
    return {
      success: false,
      error: 'Error obteniendo eventos'
    };
  }
}

export async function getEventoById(env: Env, id: number): Promise<{ success: boolean; data?: Evento; error?: string }> {
  try {
    const eventoData = await env.ACA_KV.get(`evento:${id}`);
    if (!eventoData) {
      return { success: false, error: 'Evento no encontrado' };
    }

    const evento = JSON.parse(eventoData);
    return { success: true, data: evento };

  } catch (error) {
    return { success: false, error: 'Error obteniendo evento' };
  }
}

export async function createEvento(
  env: Env, 
  eventoData: EventoForm, 
  organizerId: number
): Promise<{ success: boolean; data?: Evento; error?: string }> {
  try {
    // Obtener datos actuales
    const allEventosData = await env.ACA_KV.get('eventos:all');
    let parsedData;
    
    if (!allEventosData) {
      // Inicializar si no existe
      const initResult = await initializeEventos(env);
      if (!initResult.success) {
        return { success: false, error: 'Error inicializando sistema de eventos' };
      }
      parsedData = {
        eventos: eventosIniciales,
        lastEventId: Math.max(...eventosIniciales.map(e => e.id)),
        totalCount: eventosIniciales.length
      };
    } else {
      parsedData = JSON.parse(allEventosData);
    }

    // Generar nuevo ID
    const newId = parsedData.lastEventId + 1;

    // Crear nuevo evento
    const nuevoEvento: Evento = {
      id: newId,
      ...eventoData,
      image: eventoData.image || 'https://acachile.com/wp-content/uploads/2024/08/default-event.jpg',
      currentParticipants: 0,
      organizerId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: 'published'
    };

    // Actualizar datos
    parsedData.eventos.push(nuevoEvento);
    parsedData.lastEventId = newId;
    parsedData.totalCount = parsedData.eventos.length;

    // Guardar en KV
    await env.ACA_KV.put('eventos:all', JSON.stringify(parsedData));
    await env.ACA_KV.put(`evento:${newId}`, JSON.stringify(nuevoEvento));

    return { success: true, data: nuevoEvento };

  } catch (error) {
    return { success: false, error: 'Error creando evento' };
  }
}

export async function updateEvento(
  env: Env, 
  id: number, 
  eventoData: Partial<EventoForm>,
  userId: number
): Promise<{ success: boolean; data?: Evento; error?: string }> {
  try {
    // Verificar que el evento existe
    const existingEventoData = await env.ACA_KV.get(`evento:${id}`);
    if (!existingEventoData) {
      return { success: false, error: 'Evento no encontrado' };
    }

    const existingEvento: Evento = JSON.parse(existingEventoData);

    // Verificar permisos (solo el organizador o admin puede editar)
    if (existingEvento.organizerId !== userId) {
      // TODO: Verificar si el usuario es admin
      return { success: false, error: 'No tienes permisos para editar este evento' };
    }

    // Actualizar evento
    const eventoActualizado: Evento = {
      ...existingEvento,
      ...eventoData,
      updatedAt: new Date().toISOString()
    };

    // Actualizar en KV individual
    await env.ACA_KV.put(`evento:${id}`, JSON.stringify(eventoActualizado));

    // Actualizar en lista principal
    const allEventosData = await env.ACA_KV.get('eventos:all');
    if (allEventosData) {
      const parsedData = JSON.parse(allEventosData);
      const eventoIndex = parsedData.eventos.findIndex((e: Evento) => e.id === id);
      if (eventoIndex !== -1) {
        parsedData.eventos[eventoIndex] = eventoActualizado;
        await env.ACA_KV.put('eventos:all', JSON.stringify(parsedData));
      }
    }

    return { success: true, data: eventoActualizado };

  } catch (error) {
    return { success: false, error: 'Error actualizando evento' };
  }
}

export async function deleteEvento(
  env: Env, 
  id: number, 
  userId: number
): Promise<{ success: boolean; error?: string }> {
  try {
    // Verificar que el evento existe
    const existingEventoData = await env.ACA_KV.get(`evento:${id}`);
    if (!existingEventoData) {
      return { success: false, error: 'Evento no encontrado' };
    }

    const existingEvento: Evento = JSON.parse(existingEventoData);

    // Verificar permisos
    if (existingEvento.organizerId !== userId) {
      return { success: false, error: 'No tienes permisos para eliminar este evento' };
    }

    // Eliminar de KV individual
    await env.ACA_KV.delete(`evento:${id}`);

    // Actualizar lista principal
    const allEventosData = await env.ACA_KV.get('eventos:all');
    if (allEventosData) {
      const parsedData = JSON.parse(allEventosData);
      parsedData.eventos = parsedData.eventos.filter((e: Evento) => e.id !== id);
      parsedData.totalCount = parsedData.eventos.length;
      await env.ACA_KV.put('eventos:all', JSON.stringify(parsedData));
    }

    return { success: true };

  } catch (error) {
    return { success: false, error: 'Error eliminando evento' };
  }
}

// Función helper para aplicar filtros
function applyFilters(eventos: Evento[], filters: any): Evento[] {
  let filtered = [...eventos];

  // Filtrar por tipo
  if (filters.type) {
    filtered = filtered.filter(evento => evento.type === filters.type);
  }

  // Filtrar por estado
  if (filters.status) {
    filtered = filtered.filter(evento => evento.status === filters.status);
  }

  // Filtrar por organizador
  if (filters.organizerId) {
    filtered = filtered.filter(evento => evento.organizerId === filters.organizerId);
  }

  // Filtrar por búsqueda
  if (filters.search) {
    const searchLower = filters.search.toLowerCase();
    filtered = filtered.filter(evento => 
      evento.title.toLowerCase().includes(searchLower) ||
      evento.description.toLowerCase().includes(searchLower) ||
      evento.location.toLowerCase().includes(searchLower) ||
      (evento.tags && evento.tags.some(tag => tag.toLowerCase().includes(searchLower)))
    );
  }

  // Ordenar por fecha (más recientes primero)
  filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return filtered;
}