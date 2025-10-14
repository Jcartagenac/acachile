/**
 * Servicio de inscripciones usando D1 (SQLite)
 * ACA Chile - Sistema de inscripciones robusto y consistente
 */

export interface Env {
  DB: D1Database;
  ACA_KV: KVNamespace;
  ENVIRONMENT: string;
}

export interface InscriptionData {
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
  waitlistPosition?: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * Inscribir usuario a un evento
 */
export async function inscribirseEventoD1(
  env: Env,
  userId: number,
  eventId: number,
  notes?: string
): Promise<{ success: boolean; data?: InscriptionData; error?: string; message?: string }> {
  try {
    // 1. Obtener información del usuario
    const userResult = await env.DB.prepare(`
      SELECT id, name, email, phone, region 
      FROM users 
      WHERE id = ?
    `).bind(userId).first();

    if (!userResult) {
      return { success: false, error: 'Usuario no encontrado' };
    }

    // 2. Obtener información del evento
    const eventResult = await env.DB.prepare(`
      SELECT id, title, date, time, location, price, max_participants, 
             current_participants, registration_open, status
      FROM events 
      WHERE id = ? AND status = 'published'
    `).bind(eventId).first();

    if (!eventResult) {
      return { success: false, error: 'Evento no encontrado' };
    }

    // 3. Verificar si las inscripciones están abiertas
    if (!eventResult.registration_open) {
      return { success: false, error: 'Las inscripciones están cerradas para este evento' };
    }

    // 4. Verificar fecha del evento
    const eventDate = new Date(eventResult.date as string);
    const now = new Date();
    if (eventDate < now) {
      return { success: false, error: 'No se puede inscribir a un evento que ya pasó' };
    }

    // 5. Verificar si el usuario ya está inscrito (usando UNIQUE constraint)
    const existingInscription = await env.DB.prepare(`
      SELECT id, status 
      FROM inscriptions 
      WHERE user_id = ? AND event_id = ? AND status != 'cancelled'
    `).bind(userId, eventId).first();

    if (existingInscription) {
      switch (existingInscription.status) {
        case 'confirmed':
          return { success: false, error: 'Ya estás inscrito en este evento' };
        case 'pending':
          return { success: false, error: 'Ya tienes una inscripción pendiente para este evento' };
        case 'waitlist':
          return { success: false, error: 'Ya estás en la lista de espera de este evento' };
      }
    }

    // 6. Determinar si hay cupos disponibles
    const maxParticipants = eventResult.max_participants as number;
    const currentParticipants = eventResult.current_participants as number;
    
    let inscriptionStatus: 'confirmed' | 'waitlist' = 'confirmed';
    let waitlistPosition: number | undefined;

    if (maxParticipants && currentParticipants >= maxParticipants) {
      // Evento lleno, agregar a lista de espera
      inscriptionStatus = 'waitlist';
      
      // Obtener posición en lista de espera
      const waitlistCount = await env.DB.prepare(`
        SELECT COUNT(*) as count
        FROM inscriptions 
        WHERE event_id = ? AND status = 'waitlist'
      `).bind(eventId).first();
      
      waitlistPosition = (waitlistCount?.count as number || 0) + 1;
    }

    // 7. Crear la inscripción
    const inscriptionId = `insc_${eventId}_${userId}_${Date.now()}`;
    const inscriptionDate = new Date().toISOString();
    
    const insertResult = await env.DB.prepare(`
      INSERT INTO inscriptions (
        id, user_id, event_id, status, inscription_date,
        payment_status, payment_amount, notes, waitlist_position,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      inscriptionId,
      userId,
      eventId,
      inscriptionStatus,
      inscriptionDate,
      'pending',
      eventResult.price || 0,
      notes || null,
      waitlistPosition || null,
      inscriptionDate,
      inscriptionDate
    ).run();

    if (!insertResult.success) {
      return { success: false, error: 'Error al crear la inscripción' };
    }

    // 8. Construir respuesta
    const inscriptionData: InscriptionData = {
      id: inscriptionId,
      userId,
      eventId,
      userInfo: {
        name: userResult.name as string,
        email: userResult.email as string,
        phone: userResult.phone as string,
        region: userResult.region as string,
      },
      eventInfo: {
        title: eventResult.title as string,
        date: eventResult.date as string,
        location: eventResult.location as string,
        price: eventResult.price as number,
      },
      status: inscriptionStatus,
      inscriptionDate,
      paymentStatus: 'pending',
      paymentAmount: eventResult.price as number || 0,
      notes: notes,
      waitlistPosition,
      createdAt: inscriptionDate,
      updatedAt: inscriptionDate,
    };

    const message = inscriptionStatus === 'waitlist' 
      ? `Has sido agregado a la lista de espera. Posición: ${waitlistPosition}`
      : 'Inscripción exitosa';

    return {
      success: true,
      data: inscriptionData,
      message
    };

  } catch (error) {
    console.error('Error en inscribirseEventoD1:', error);
    return { success: false, error: 'Error interno al procesar inscripción' };
  }
}

/**
 * Cancelar inscripción
 */
export async function cancelarInscripcionD1(
  env: Env,
  userId: number,
  inscriptionId: string
): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    // 1. Verificar que la inscripción existe y pertenece al usuario
    const inscription = await env.DB.prepare(`
      SELECT i.*, e.title as event_title 
      FROM inscriptions i
      JOIN events e ON i.event_id = e.id
      WHERE i.id = ? AND i.user_id = ? AND i.status != 'cancelled'
    `).bind(inscriptionId, userId).first();

    if (!inscription) {
      return { success: false, error: 'Inscripción no encontrada' };
    }

    // 2. Marcar inscripción como cancelada
    const updateResult = await env.DB.prepare(`
      UPDATE inscriptions 
      SET status = 'cancelled', updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(inscriptionId).run();

    if (!updateResult.success) {
      return { success: false, error: 'Error al cancelar inscripción' };
    }

    // 3. Si había alguien en lista de espera, promoverlo automáticamente
    if (inscription.status === 'confirmed') {
      await promoverDesdeListaEspera(env, inscription.event_id as number);
    }

    return {
      success: true,
      message: `Inscripción cancelada exitosamente para ${inscription.event_title}`
    };

  } catch (error) {
    console.error('Error en cancelarInscripcionD1:', error);
    return { success: false, error: 'Error interno al cancelar inscripción' };
  }
}

/**
 * Obtener inscripciones del usuario
 */
export async function getInscripcionesUsuarioD1(
  env: Env,
  userId: number
): Promise<{ success: boolean; data?: InscriptionData[]; error?: string }> {
  try {
    const inscriptions = await env.DB.prepare(`
      SELECT 
        i.*,
        u.name as user_name, u.email as user_email, u.phone as user_phone, u.region as user_region,
        e.title as event_title, e.date as event_date, e.location as event_location, e.price as event_price
      FROM inscriptions i
      JOIN users u ON i.user_id = u.id
      JOIN events e ON i.event_id = e.id
      WHERE i.user_id = ? AND i.status != 'cancelled'
      ORDER BY i.created_at DESC
    `).bind(userId).all();

    const inscriptionData: InscriptionData[] = inscriptions.results.map((row: any) => ({
      id: row.id,
      userId: row.user_id,
      eventId: row.event_id,
      userInfo: {
        name: row.user_name,
        email: row.user_email,
        phone: row.user_phone,
        region: row.user_region,
      },
      eventInfo: {
        title: row.event_title,
        date: row.event_date,
        location: row.event_location,
        price: row.event_price,
      },
      status: row.status,
      inscriptionDate: row.inscription_date,
      paymentStatus: row.payment_status,
      paymentAmount: row.payment_amount,
      notes: row.notes,
      waitlistPosition: row.waitlist_position,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));

    return { success: true, data: inscriptionData };

  } catch (error) {
    console.error('Error en getInscripcionesUsuarioD1:', error);
    return { success: false, error: 'Error interno al obtener inscripciones' };
  }
}

/**
 * Obtener inscripciones de un evento (para organizadores)
 */
export async function getInscripcionesEventoD1(
  env: Env,
  eventId: number
): Promise<{ success: boolean; data?: InscriptionData[]; error?: string }> {
  try {
    const inscriptions = await env.DB.prepare(`
      SELECT 
        i.*,
        u.name as user_name, u.email as user_email, u.phone as user_phone, u.region as user_region,
        e.title as event_title, e.date as event_date, e.location as event_location, e.price as event_price
      FROM inscriptions i
      JOIN users u ON i.user_id = u.id
      JOIN events e ON i.event_id = e.id
      WHERE i.event_id = ? AND i.status != 'cancelled'
      ORDER BY 
        CASE i.status 
          WHEN 'confirmed' THEN 1 
          WHEN 'pending' THEN 2 
          WHEN 'waitlist' THEN 3 
        END,
        i.waitlist_position,
        i.created_at
    `).bind(eventId).all();

    const inscriptionData: InscriptionData[] = inscriptions.results.map((row: any) => ({
      id: row.id,
      userId: row.user_id,
      eventId: row.event_id,
      userInfo: {
        name: row.user_name,
        email: row.user_email,
        phone: row.user_phone,
        region: row.user_region,
      },
      eventInfo: {
        title: row.event_title,
        date: row.event_date,
        location: row.event_location,
        price: row.event_price,
      },
      status: row.status,
      inscriptionDate: row.inscription_date,
      paymentStatus: row.payment_status,
      paymentAmount: row.payment_amount,
      notes: row.notes,
      waitlistPosition: row.waitlist_position,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));

    return { success: true, data: inscriptionData };

  } catch (error) {
    console.error('Error en getInscripcionesEventoD1:', error);
    return { success: false, error: 'Error interno al obtener inscripciones del evento' };
  }
}

/**
 * Promover automáticamente desde lista de espera
 */
async function promoverDesdeListaEspera(env: Env, eventId: number): Promise<void> {
  try {
    // Buscar el primer usuario en lista de espera
    const waitlistUser = await env.DB.prepare(`
      SELECT id, waitlist_position
      FROM inscriptions 
      WHERE event_id = ? AND status = 'waitlist'
      ORDER BY waitlist_position ASC
      LIMIT 1
    `).bind(eventId).first();

    if (waitlistUser) {
      // Promover a confirmado
      await env.DB.prepare(`
        UPDATE inscriptions 
        SET status = 'confirmed', waitlist_position = NULL, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).bind(waitlistUser.id).run();

      // Actualizar posiciones de los demás en lista de espera
      await env.DB.prepare(`
        UPDATE inscriptions 
        SET waitlist_position = waitlist_position - 1, updated_at = CURRENT_TIMESTAMP
        WHERE event_id = ? AND status = 'waitlist' AND waitlist_position > ?
      `).bind(eventId, waitlistUser.waitlist_position).run();
    }
  } catch (error) {
    console.error('Error promoviendo desde lista de espera:', error);
  }
}