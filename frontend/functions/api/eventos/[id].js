import { requireAuth, requireAdminOrDirector } from '../../_middleware';

// Endpoint para gestión de eventos individuales por ID
// GET /api/eventos/[id] - Obtener evento específico
// PUT /api/eventos/[id] - Actualizar evento específico  
// DELETE /api/eventos/[id] - Eliminar evento específico

export async function onRequest(context) {
  const { request, env, params } = context;
  const method = request.method;
  const eventId = parseInt(params.id);

  const corsHeaders = {
    'Access-Control-Allow-Origin': env.CORS_ORIGIN || '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  // Manejar preflight requests
  if (method === 'OPTIONS') {
    return new Response(null, { 
      status: 204, 
      headers: corsHeaders 
    });
  }

  // Validar ID
  if (isNaN(eventId)) {
    return new Response(JSON.stringify({
      success: false,
      error: 'ID de evento inválido'
    }), {
      status: 400,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    });
  }

  try {
    if (method === 'GET') {
      return await handleGetEventoById(eventId, env, corsHeaders);
    }
    
    if (method === 'PUT') {
      return await handleUpdateEvento(request, eventId, env, corsHeaders);
    }

    if (method === 'DELETE') {
      return await handleDeleteEvento(request, eventId, env, corsHeaders);
    }

    return new Response(JSON.stringify({
      success: false,
      error: `Método ${method} no permitido`
    }), {
      status: 405,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    });

  } catch (error) {
    console.error('Error in eventos/[id] endpoint:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Error interno del servidor'
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    });
  }
}

// GET /api/eventos/[id] - Obtener evento específico
async function handleGetEventoById(eventId, env, corsHeaders) {
  try {
    const result = await getEventoById(env, eventId);

    if (!result.success) {
      return new Response(JSON.stringify({
        success: false,
        error: result.error
      }), {
        status: result.error === 'Evento no encontrado' ? 404 : 500,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      });
    }

    return new Response(JSON.stringify({
      success: true,
      data: result.data
    }), {
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    });

  } catch (error) {
    console.error('Error getting evento by ID:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Error obteniendo evento'
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    });
  }
}

// PUT /api/eventos/[id] - Actualizar evento específico
async function handleUpdateEvento(request, eventId, env, corsHeaders) {
  try {
    let authUser;
    try {
      authUser = await requireAuth(request, env);
    } catch (error) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Autenticación requerida'
      }), {
        status: 401,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      });
    }

    // Opcional: validar que el usuario tenga permisos adecuados (admin/director)
    if (authUser.role && !['admin', 'director', 'director_editor'].includes(authUser.role)) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Permisos insuficientes'
      }), {
        status: 403,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      });
    }
    const body = await request.json();
    
    const result = await updateEvento(env, eventId, body);

    if (!result.success) {
      return new Response(JSON.stringify({
        success: false,
        error: result.error
      }), {
        status: result.error === 'Evento no encontrado' ? 404 : 400,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      });
    }

    return new Response(JSON.stringify({
      success: true,
      data: result.data,
      message: 'Evento actualizado exitosamente'
    }), {
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    });

  } catch (error) {
    console.error('Error updating evento:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Error actualizando evento'
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    });
  }
}

// DELETE /api/eventos/[id] - Eliminar evento específico
async function handleDeleteEvento(request, eventId, env, corsHeaders) {
  try {
    try {
      await requireAdminOrDirector(request, env);
    } catch (error) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Permisos insuficientes'
      }), {
        status: 403,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      });
    }

    // TODO: Verificar JWT y permisos de admin/organizador

    const result = await deleteEvento(env, eventId);

    if (!result.success) {
      return new Response(JSON.stringify({
        success: false,
        error: result.error
      }), {
        status: result.error === 'Evento no encontrado' ? 404 : 400,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      });
    }

    return new Response(JSON.stringify({
      success: true,
      message: 'Evento eliminado exitosamente'
    }), {
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    });

  } catch (error) {
    console.error('Error deleting evento:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Error eliminando evento'
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    });
  }
}

// Funciones de servicio
async function getEventoById(env, id) {
  try {
    const query = `
      SELECT * FROM eventos WHERE id = ?
    `;
    
    const { results } = await env.DB.prepare(query).bind(id).all();
    
    if (results.length === 0) {
      return {
        success: false,
        error: 'Evento no encontrado'
      };
    }

    const evento = results[0];
    
    // Mapear nombres de columnas de DB a nombres de propiedades del frontend
    const mappedEvento = {
      ...evento,
      registrationOpen: evento.registration_open,
      maxParticipants: evento.max_participants,
      currentParticipants: evento.current_participants || 0,
      organizerId: evento.organizer_id,
      createdAt: evento.created_at,
      updatedAt: evento.updated_at,
      endDate: evento.end_date,
      isPublic: Boolean(evento.is_public),
      paymentLink: evento.payment_link,
    };

    return {
      success: true,
      data: mappedEvento
    };

  } catch (error) {
    console.error('Error in getEventoById (D1):', error);
    return {
      success: false,
      error: 'Error obteniendo evento'
    };
  }
}

async function updateEvento(env, id, updateData) {
  try {
    // Verificar que el evento existe
    const existingQuery = `SELECT * FROM eventos WHERE id = ?`;
    const { results } = await env.DB.prepare(existingQuery).bind(id).all();
    
    if (results.length === 0) {
      return {
        success: false,
        error: 'Evento no encontrado'
      };
    }

    // Construir consulta de actualización dinámica
    const updateFields = [];
    const values = [];
    
    const fieldsMap = {
      title: 'title',
      description: 'description', 
      date: 'date',
      time: 'time',
      location: 'location',
      image: 'image',
      type: 'type',
      status: 'status',
      registrationOpen: 'registration_open',
      maxParticipants: 'max_participants',
      price: 'price',
      endDate: 'end_date',
      isPublic: 'is_public',
      paymentLink: 'payment_link'
    };

    Object.keys(updateData).forEach(key => {
      if (fieldsMap[key] !== undefined && updateData[key] !== undefined) {
        // Convertir isPublic a 0 o 1 para SQLite
        const value = key === 'isPublic' ? (updateData[key] ? 1 : 0) : updateData[key];
        updateFields.push(`${fieldsMap[key]} = ?`);
        values.push(value);
      }
    });

    if (updateFields.length === 0) {
      return {
        success: false,
        error: 'No hay campos para actualizar'
      };
    }

    // Agregar updated_at
    updateFields.push('updated_at = ?');
    values.push(new Date().toISOString());
    
    // Agregar ID al final para el WHERE
    values.push(id);

    const updateQuery = `
      UPDATE eventos 
      SET ${updateFields.join(', ')}
      WHERE id = ?
    `;

    const { success } = await env.DB.prepare(updateQuery).bind(...values).run();

    if (!success) {
      return {
        success: false,
        error: 'Error actualizando evento en la base de datos'
      };
    }

    // Obtener el evento actualizado
    const updatedResult = await getEventoById(env, id);
    if (!updatedResult.success) {
      return {
        success: false,
        error: 'Evento actualizado pero no se pudo recuperar'
      };
    }

    return {
      success: true,
      data: updatedResult.data
    };

  } catch (error) {
    console.error('Error in updateEvento (D1):', error);
    return {
      success: false,
      error: 'Error actualizando evento'
    };
  }
}

async function deleteEvento(env, id) {
  try {
    // Verificar que el evento existe
    const existingQuery = `SELECT id FROM eventos WHERE id = ?`;
    const { results } = await env.DB.prepare(existingQuery).bind(id).all();
    
    if (results.length === 0) {
      return {
        success: false,
        error: 'Evento no encontrado'
      };
    }

    // Eliminar el evento
    const deleteQuery = `DELETE FROM eventos WHERE id = ?`;
    const { success } = await env.DB.prepare(deleteQuery).bind(id).run();

    if (!success) {
      return {
        success: false,
        error: 'Error eliminando evento de la base de datos'
      };
    }

    return {
      success: true
    };

  } catch (error) {
    console.error('Error in deleteEvento (D1):', error);
    return {
      success: false,
      error: 'Error eliminando evento'
    };
  }
}
