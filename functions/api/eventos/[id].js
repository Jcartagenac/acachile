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
    // Verificar autenticación
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Token de autorización requerido'
      }), {
        status: 401,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      });
    }

    // TODO: Verificar JWT y permisos
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
    // Verificar autenticación
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Token de autorización requerido'
      }), {
        status: 401,
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
    const eventoData = await env.ACA_KV.get(`evento:${id}`);
    
    if (!eventoData) {
      return {
        success: false,
        error: 'Evento no encontrado'
      };
    }

    const evento = JSON.parse(eventoData);
    return {
      success: true,
      data: evento
    };

  } catch (error) {
    console.error('Error in getEventoById:', error);
    return {
      success: false,
      error: 'Error obteniendo evento'
    };
  }
}

async function updateEvento(env, id, updateData) {
  try {
    // Verificar que el evento existe
    const eventoData = await env.ACA_KV.get(`evento:${id}`);
    
    if (!eventoData) {
      return {
        success: false,
        error: 'Evento no encontrado'
      };
    }

    const evento = JSON.parse(eventoData);
    
    // Actualizar campos
    const updatedEvento = {
      ...evento,
      ...updateData,
      id: id, // Mantener ID original
      updatedAt: new Date().toISOString()
    };

    // Guardar evento actualizado
    await env.ACA_KV.put(`evento:${id}`, JSON.stringify(updatedEvento));

    // Actualizar en la lista de todos los eventos
    const eventosData = await env.ACA_KV.get('eventos:all');
    const eventos = eventosData ? JSON.parse(eventosData) : [];
    const eventoIndex = eventos.findIndex(e => e.id === id);
    
    if (eventoIndex !== -1) {
      eventos[eventoIndex] = updatedEvento;
      await env.ACA_KV.put('eventos:all', JSON.stringify(eventos));
    }

    return {
      success: true,
      data: updatedEvento
    };

  } catch (error) {
    console.error('Error in updateEvento:', error);
    return {
      success: false,
      error: 'Error actualizando evento'
    };
  }
}

async function deleteEvento(env, id) {
  try {
    // Verificar que el evento existe
    const eventoData = await env.ACA_KV.get(`evento:${id}`);
    
    if (!eventoData) {
      return {
        success: false,
        error: 'Evento no encontrado'
      };
    }

    // Eliminar evento individual
    await env.ACA_KV.delete(`evento:${id}`);

    // Eliminar de la lista de todos los eventos
    const eventosData = await env.ACA_KV.get('eventos:all');
    const eventos = eventosData ? JSON.parse(eventosData) : [];
    const updatedEventos = eventos.filter(e => e.id !== id);
    await env.ACA_KV.put('eventos:all', JSON.stringify(updatedEventos));

    // TODO: También eliminar inscripciones relacionadas
    // await env.ACA_KV.delete(`inscripciones:evento:${id}`);

    return {
      success: true
    };

  } catch (error) {
    console.error('Error in deleteEvento:', error);
    return {
      success: false,
      error: 'Error eliminando evento'
    };
  }
}