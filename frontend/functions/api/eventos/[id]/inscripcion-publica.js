/**
 * Endpoint para inscripción pública a eventos sin autenticación
 * POST /api/eventos/[id]/inscripcion-publica
 * 
 * Permite registrarse en eventos públicos sin requerir login
 * Requiere: nombre, apellido, telefono, email
 */

export async function onRequestPost(context) {
  const { env, params, request } = context;
  const eventoId = parseInt(params.id);

  if (isNaN(eventoId)) {
    return new Response(JSON.stringify({
      success: false,
      error: 'ID de evento inválido'
    }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    // Parsear el cuerpo de la solicitud
    const body = await request.json();
    const { nombre, apellido, telefono, email } = body;

    // Validar campos requeridos
    if (!nombre || !apellido || !telefono || !email) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Todos los campos son obligatorios: nombre, apellido, teléfono, email'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Formato de email inválido'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Obtener evento de D1
    const eventoResult = await getEventoById(env, eventoId);
    
    console.log('EventoResult:', JSON.stringify(eventoResult, null, 2));
    
    if (!eventoResult.success) {
      console.error('Error al obtener evento:', eventoResult.error);
      return new Response(JSON.stringify({
        success: false,
        error: eventoResult.error || 'Evento no encontrado'
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const evento = eventoResult.data;

    // Verificar que el evento es público
    if (!evento.isPublic) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Este evento requiere autenticación para inscribirse'
      }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Verificar que el evento tiene inscripción abierta
    if (!evento.registrationOpen) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Las inscripciones para este evento están cerradas'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Verificar cupo disponible
    const inscripcionesResult = await getInscripcionesEvento(env, eventoId);
    if (!inscripcionesResult.success) {
      console.error('Error obteniendo inscripciones:', inscripcionesResult.error);
    }

    const inscripcionesActuales = inscripcionesResult.success ? inscripcionesResult.data : [];
    const cantidadInscripciones = inscripcionesActuales.length;

    if (evento.maxParticipants && cantidadInscripciones >= evento.maxParticipants) {
      return new Response(JSON.stringify({
        success: false,
        error: 'No hay cupos disponibles para este evento'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Verificar si el email ya está inscrito
    const yaInscrito = inscripcionesActuales.some(
      insc => insc.email?.toLowerCase() === email.toLowerCase()
    );

    if (yaInscrito) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Este email ya está registrado para este evento'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Crear inscripción en D1
    const inscripcionId = `${eventoId}-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    const now = new Date().toISOString();

    try {
      // Insertar inscripción pública en D1
      await env.DB.prepare(
        `INSERT INTO inscriptions (id, user_id, event_id, status, inscription_date, payment_status, nombre, apellido, email, telefono, tipo)
         VALUES (?, NULL, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).bind(
        inscripcionId,
        eventoId,
        'confirmed',
        now,
        'pending',
        nombre,
        apellido,
        email,
        telefono,
        'publica'
      ).run();

      console.log('[inscripcion-publica] Inserted public inscription in D1 for evento', eventoId);

      // Incrementar contador de participantes en D1
      await env.DB.prepare(
        'UPDATE eventos SET current_participants = current_participants + 1 WHERE id = ?'
      ).bind(eventoId).run();
      console.log('[inscripcion-publica] Incremented current_participants for evento', eventoId);

    } catch (dbError) {
      console.error('[inscripcion-publica] Error inserting inscription in D1:', dbError);
      return new Response(JSON.stringify({
        success: false,
        error: 'Error al guardar la inscripción en la base de datos'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const nuevaInscripcion = {
      id: inscripcionId,
      eventoId,
      nombre,
      apellido,
      telefono,
      email,
      status: 'confirmed',
      tipo: 'publica',
      createdAt: now,
    };

    // Invalidar TODAS las claves de caché de eventos para forzar refresh desde BD
    if (env.ACA_KV) {
      // Lista de todas las combinaciones posibles de status, type, page
      const statuses = ['published', 'draft', 'all'];
      const types = ['all', 'encuentro', 'taller', 'webinar'];
      const searches = ['none'];
      const pages = Array.from({length: 5}, (_, i) => i + 1); // páginas 1-5
      const limit = 12;
      
      const cacheKeys = [];
      for (const status of statuses) {
        for (const type of types) {
          for (const search of searches) {
            for (const page of pages) {
              cacheKeys.push(`eventos:list:${status}:${type}:${search}:${page}:${limit}`);
            }
          }
        }
      }
      
      for (const key of cacheKeys) {
        await env.ACA_KV.delete(key);
      }
      console.log('[inscripcion-publica] Invalidated all eventos cache keys');
    }

    return new Response(JSON.stringify({
      success: true,
      data: {
        inscripcion: nuevaInscripcion,
        paymentLink: evento.paymentLink || null
      },
      message: 'Inscripción registrada exitosamente'
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error en inscripción pública:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Error procesando la inscripción'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Función para obtener evento por ID desde D1
async function getEventoById(env, id) {
  try {
    const { results } = await env.DB.prepare(
      `SELECT id, title, description, date, time, location, image, type, status,
              registration_open as registrationOpen, 
              max_participants as maxParticipants, 
              price, 
              organizer_id as organizerId, 
              created_at as createdAt, 
              updated_at as updatedAt, 
              is_public as isPublic, 
              payment_link as paymentLink
       FROM eventos
       WHERE id = ?`
    ).bind(id).all();

    if (!results || results.length === 0) {
      return {
        success: false,
        error: 'Evento no encontrado'
      };
    }

    const evento = results[0];
    
    // Asegurar conversión correcta de tipos
    const eventoFormatted = {
      id: evento.id,
      title: evento.title,
      description: evento.description,
      date: evento.date,
      time: evento.time,
      location: evento.location,
      image: evento.image,
      type: evento.type,
      status: evento.status,
      registrationOpen: evento.registrationOpen === 1 || evento.registrationOpen === true,
      maxParticipants: evento.maxParticipants,
      price: evento.price,
      organizerId: evento.organizerId,
      isPublic: evento.isPublic === 1 || evento.isPublic === true,
      paymentLink: evento.paymentLink,
      createdAt: evento.createdAt,
      updatedAt: evento.updatedAt
    };

    return {
      success: true,
      data: eventoFormatted
    };

  } catch (error) {
    console.error('Error in getEventoById:', error);
    return {
      success: false,
      error: `Error obteniendo evento: ${error.message}`
    };
  }
}

// Función para obtener inscripciones de un evento desde D1
async function getInscripcionesEvento(env, eventoId) {
  try {
    const { results } = await env.DB.prepare(
      'SELECT * FROM inscriptions WHERE event_id = ?'
    ).bind(eventoId).all();

    const inscripciones = results || [];

    return {
      success: true,
      data: inscripciones
    };

  } catch (error) {
    console.error('Error in getInscripcionesEvento:', error);
    return {
      success: false,
      error: 'Error obteniendo inscripciones del evento'
    };
  }
}
