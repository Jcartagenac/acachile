/**
 * Sistema de Inscripciones a Eventos - ACA Chile
 * Gestión completa de inscripciones con Cloudflare KV
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

// Interfaz para inscripción a evento
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

// Datos para crear inscripción
export interface InscriptionRequest {
  eventId: number;
  notes?: string;
}

// Respuesta de inscripción
export interface InscriptionResponse {
  success: boolean;
  data?: EventInscription;
  error?: string;
  message?: string;
  waitlistPosition?: number;
}

/**
 * Inscribirse a un evento
 */
export async function inscribirseEvento(
  env: Env,
  userId: number,
  eventId: number,
  userInfo: any,
  notes?: string
): Promise<InscriptionResponse> {
  try {
    // 1. Verificar que el evento existe
    const eventoData = await env.ACA_KV.get(`evento:${eventId}`);
    if (!eventoData) {
      return { success: false, error: 'Evento no encontrado' };
    }

    const evento = JSON.parse(eventoData);

    // 2. Verificar que las inscripciones están abiertas
    if (!evento.registrationOpen) {
      return { success: false, error: 'Las inscripciones para este evento están cerradas' };
    }

    // 3. Verificar que el evento no haya pasado
    const eventDate = new Date(evento.date);
    const now = new Date();
    if (eventDate < now) {
      return { success: false, error: 'No se puede inscribir a un evento que ya pasó' };
    }

    // 4. Verificar si el usuario ya está inscrito
    const existingInscription = await getInscripcionUsuarioEvento(env, userId, eventId);
    if (existingInscription.data) {
      if (existingInscription.data.status === 'confirmed') {
        return { success: false, error: 'Ya estás inscrito en este evento' };
      }
      if (existingInscription.data.status === 'pending') {
        return { success: false, error: 'Ya tienes una inscripción pendiente para este evento' };
      }
      if (existingInscription.data.status === 'waitlist') {
        return { success: false, error: 'Ya estás en la lista de espera de este evento' };
      }
    }

    // 5. Verificar cupos disponibles
    const inscripcionesEvento = await getInscripcionesEvento(env, eventId);
    const inscripcionesConfirmadas = inscripcionesEvento.data?.filter(
      insc => insc.status === 'confirmed' || insc.status === 'pending'
    ) || [];

    let inscriptionStatus: 'confirmed' | 'waitlist' = 'confirmed';
    let waitlistPosition: number | undefined;

    if (evento.maxParticipants && inscripcionesConfirmadas.length >= evento.maxParticipants) {
      inscriptionStatus = 'waitlist';
      const waitlistInscriptions = inscripcionesEvento.data?.filter(
        insc => insc.status === 'waitlist'
      ) || [];
      waitlistPosition = waitlistInscriptions.length + 1;
    }

    // 6. Crear la inscripción
    const inscriptionId = `insc_${eventId}_${userId}_${Date.now()}`;
    const inscripcion: EventInscription = {
      id: inscriptionId,
      userId,
      eventId,
      userInfo: {
        name: userInfo.name,
        email: userInfo.email,
        phone: userInfo.phone,
        region: userInfo.region
      },
      eventInfo: {
        title: evento.title,
        date: evento.date,
        location: evento.location,
        price: evento.price
      },
      status: inscriptionStatus,
      inscriptionDate: new Date().toISOString(),
      paymentStatus: evento.price && evento.price > 0 ? 'pending' : undefined,
      paymentAmount: evento.price || 0,
      notes,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // 7. Guardar en KV
    // Inscripción individual
    await env.ACA_KV.put(`inscripcion:${inscriptionId}`, JSON.stringify(inscripcion));

    // Índice por usuario
    const userInscriptionsKey = `user_inscripciones:${userId}`;
    const userInscriptions = await env.ACA_KV.get(userInscriptionsKey);
    const userInscriptionsList = userInscriptions ? JSON.parse(userInscriptions) : [];
    userInscriptionsList.push(inscriptionId);
    await env.ACA_KV.put(userInscriptionsKey, JSON.stringify(userInscriptionsList));

    // Índice por evento
    const eventInscriptionsKey = `event_inscripciones:${eventId}`;
    const eventInscriptions = await env.ACA_KV.get(eventInscriptionsKey);
    const eventInscriptionsList = eventInscriptions ? JSON.parse(eventInscriptions) : [];
    eventInscriptionsList.push(inscriptionId);
    await env.ACA_KV.put(eventInscriptionsKey, JSON.stringify(eventInscriptionsList));

    // 8. Actualizar contador de participantes en el evento
    if (inscriptionStatus === 'confirmed') {
      evento.currentParticipants = (evento.currentParticipants || 0) + 1;
      evento.updatedAt = new Date().toISOString();
      
      // Actualizar evento individual
      await env.ACA_KV.put(`evento:${eventId}`, JSON.stringify(evento));

      // Actualizar en lista principal de eventos
      const eventosData = await env.ACA_KV.get('eventos:all');
      if (eventosData) {
        const parsedData = JSON.parse(eventosData);
        const eventoIndex = parsedData.eventos.findIndex((e: any) => e.id === eventId);
        if (eventoIndex !== -1) {
          parsedData.eventos[eventoIndex] = evento;
          await env.ACA_KV.put('eventos:all', JSON.stringify(parsedData));
        }
      }
    }

    return {
      success: true,
      data: inscripcion,
      message: inscriptionStatus === 'confirmed' 
        ? 'Inscripción exitosa' 
        : `Agregado a lista de espera (posición ${waitlistPosition})`,
      waitlistPosition
    };

  } catch (error) {
    console.error('Error en inscripción:', error);
    return { success: false, error: 'Error interno al procesar inscripción' };
  }
}

/**
 * Cancelar inscripción a evento
 */
export async function cancelarInscripcion(
  env: Env,
  userId: number,
  inscriptionId: string
): Promise<{ success: boolean; error?: string; message?: string }> {
  try {
    // 1. Verificar que la inscripción existe
    const inscripcionData = await env.ACA_KV.get(`inscripcion:${inscriptionId}`);
    if (!inscripcionData) {
      return { success: false, error: 'Inscripción no encontrada' };
    }

    const inscripcion: EventInscription = JSON.parse(inscripcionData);

    // 2. Verificar permisos (solo el usuario puede cancelar su inscripción)
    if (inscripcion.userId !== userId) {
      return { success: false, error: 'No tienes permisos para cancelar esta inscripción' };
    }

    // 3. Verificar que se puede cancelar
    if (inscripcion.status === 'cancelled') {
      return { success: false, error: 'La inscripción ya está cancelada' };
    }

    // 4. Verificar tiempo límite para cancelación (ej: 24 horas antes)
    const eventDate = new Date(inscripcion.eventInfo.date);
    const now = new Date();
    const hoursUntilEvent = (eventDate.getTime() - now.getTime()) / (1000 * 60 * 60);
    
    if (hoursUntilEvent < 24) {
      return { 
        success: false, 
        error: 'No se puede cancelar con menos de 24 horas de anticipación' 
      };
    }

    // 5. Verificar si estaba confirmada antes de cancelar
    const wasConfirmed = inscripcion.status === 'confirmed';

    // 6. Marcar como cancelada
    inscripcion.status = 'cancelled';
    inscripcion.updatedAt = new Date().toISOString();
    
    await env.ACA_KV.put(`inscripcion:${inscriptionId}`, JSON.stringify(inscripcion));

    // 7. Actualizar contador del evento si estaba confirmada
    if (wasConfirmed) {
      const eventoData = await env.ACA_KV.get(`evento:${inscripcion.eventId}`);
      if (eventoData) {
        const evento = JSON.parse(eventoData);
        evento.currentParticipants = Math.max(0, (evento.currentParticipants || 1) - 1);
        evento.updatedAt = new Date().toISOString();
        
        await env.ACA_KV.put(`evento:${inscripcion.eventId}`, JSON.stringify(evento));

        // Actualizar lista principal
        const eventosData = await env.ACA_KV.get('eventos:all');
        if (eventosData) {
          const parsedData = JSON.parse(eventosData);
          const eventoIndex = parsedData.eventos.findIndex((e: any) => e.id === inscripcion.eventId);
          if (eventoIndex !== -1) {
            parsedData.eventos[eventoIndex] = evento;
            await env.ACA_KV.put('eventos:all', JSON.stringify(parsedData));
          }
        }

        // 8. Promover a alguien de la lista de espera
        await promoverDesdeListaEspera(env, inscripcion.eventId);
      }
    }

    return {
      success: true,
      message: 'Inscripción cancelada exitosamente'
    };

  } catch (error) {
    console.error('Error cancelando inscripción:', error);
    return { success: false, error: 'Error interno al cancelar inscripción' };
  }
}

/**
 * Obtener inscripciones de un usuario
 */
export async function getInscripcionesUsuario(
  env: Env,
  userId: number
): Promise<{ success: boolean; data?: EventInscription[]; error?: string }> {
  try {
    const userInscriptionsKey = `user_inscripciones:${userId}`;
    const userInscriptionsData = await env.ACA_KV.get(userInscriptionsKey);
    
    if (!userInscriptionsData) {
      return { success: true, data: [] };
    }

    const inscriptionIds: string[] = JSON.parse(userInscriptionsData);
    const inscripciones: EventInscription[] = [];

    // Obtener cada inscripción
    for (const inscriptionId of inscriptionIds) {
      const inscripcionData = await env.ACA_KV.get(`inscripcion:${inscriptionId}`);
      if (inscripcionData) {
        const inscripcion = JSON.parse(inscripcionData);
        inscripciones.push(inscripcion);
      }
    }

    // Ordenar por fecha de inscripción (más recientes primero)
    inscripciones.sort((a, b) => 
      new Date(b.inscriptionDate).getTime() - new Date(a.inscriptionDate).getTime()
    );

    return { success: true, data: inscripciones };

  } catch (error) {
    console.error('Error obteniendo inscripciones de usuario:', error);
    return { success: false, error: 'Error obteniendo inscripciones' };
  }
}

/**
 * Obtener inscripciones de un evento (para admins)
 */
export async function getInscripcionesEvento(
  env: Env,
  eventId: number
): Promise<{ success: boolean; data?: EventInscription[]; error?: string }> {
  try {
    const eventInscriptionsKey = `event_inscripciones:${eventId}`;
    const eventInscriptionsData = await env.ACA_KV.get(eventInscriptionsKey);
    
    if (!eventInscriptionsData) {
      return { success: true, data: [] };
    }

    const inscriptionIds: string[] = JSON.parse(eventInscriptionsData);
    const inscripciones: EventInscription[] = [];

    // Obtener cada inscripción
    for (const inscriptionId of inscriptionIds) {
      const inscripcionData = await env.ACA_KV.get(`inscripcion:${inscriptionId}`);
      if (inscripcionData) {
        const inscripcion = JSON.parse(inscripcionData);
        inscripciones.push(inscripcion);
      }
    }

    // Ordenar: confirmadas primero, luego por fecha
    inscripciones.sort((a, b) => {
      // Orden de prioridad: confirmed, pending, waitlist, cancelled
      const statusOrder = { confirmed: 1, pending: 2, waitlist: 3, cancelled: 4 };
      const aOrder = statusOrder[a.status] || 5;
      const bOrder = statusOrder[b.status] || 5;
      
      if (aOrder !== bOrder) {
        return aOrder - bOrder;
      }
      
      return new Date(a.inscriptionDate).getTime() - new Date(b.inscriptionDate).getTime();
    });

    return { success: true, data: inscripciones };

  } catch (error) {
    console.error('Error obteniendo inscripciones de evento:', error);
    return { success: false, error: 'Error obteniendo inscripciones del evento' };
  }
}

/**
 * Verificar si un usuario está inscrito en un evento
 */
export async function getInscripcionUsuarioEvento(
  env: Env,
  userId: number,
  eventId: number
): Promise<{ success: boolean; data?: EventInscription; error?: string }> {
  try {
    const userInscriptions = await getInscripcionesUsuario(env, userId);
    
    if (!userInscriptions.success || !userInscriptions.data) {
      return { success: false, error: 'Error obteniendo inscripciones del usuario' };
    }

    const inscripcion = userInscriptions.data.find(
      insc => insc.eventId === eventId && insc.status !== 'cancelled'
    );

    return { 
      success: true, 
      data: inscripcion 
    };

  } catch (error) {
    console.error('Error verificando inscripción:', error);
    return { success: false, error: 'Error verificando inscripción' };
  }
}

/**
 * Promover usuarios de lista de espera cuando hay cancelaciones
 */
async function promoverDesdeListaEspera(env: Env, eventId: number): Promise<void> {
  try {
    const inscripcionesResult = await getInscripcionesEvento(env, eventId);
    if (!inscripcionesResult.success || !inscripcionesResult.data) return;

    const inscripciones = inscripcionesResult.data;
    
    // Buscar primera persona en lista de espera
    const enListaEspera = inscripciones
      .filter(insc => insc.status === 'waitlist')
      .sort((a, b) => new Date(a.inscriptionDate).getTime() - new Date(b.inscriptionDate).getTime());

    if (enListaEspera.length === 0) return;

    const primerEnEspera = enListaEspera[0];
    
    // Promover a confirmado
    primerEnEspera.status = 'confirmed';
    primerEnEspera.updatedAt = new Date().toISOString();
    
    await env.ACA_KV.put(`inscripcion:${primerEnEspera.id}`, JSON.stringify(primerEnEspera));

    // Actualizar contador del evento
    const eventoData = await env.ACA_KV.get(`evento:${eventId}`);
    if (eventoData) {
      const evento = JSON.parse(eventoData);
      evento.currentParticipants = (evento.currentParticipants || 0) + 1;
      evento.updatedAt = new Date().toISOString();
      
      await env.ACA_KV.put(`evento:${eventId}`, JSON.stringify(evento));

      // Actualizar lista principal
      const eventosData = await env.ACA_KV.get('eventos:all');
      if (eventosData) {
        const parsedData = JSON.parse(eventosData);
        const eventoIndex = parsedData.eventos.findIndex((e: any) => e.id === eventId);
        if (eventoIndex !== -1) {
          parsedData.eventos[eventoIndex] = evento;
          await env.ACA_KV.put('eventos:all', JSON.stringify(parsedData));
        }
      }
    }

    // TODO: Enviar email de notificación sobre la promoción

  } catch (error) {
    console.error('Error promoviendo desde lista de espera:', error);
  }
}