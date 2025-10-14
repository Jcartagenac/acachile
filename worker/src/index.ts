/**
 * ACA Chile Cloudflare Worker
 * API Backend para la Asociación Chilena de Asadores
 */

export interface Env {
  ACA_KV: KVNamespace;
  ENVIRONMENT: string;
}

// CORS headers para permitir requests del frontend
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    // Manejar preflight CORS requests
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: corsHeaders,
      });
    }

    const url = new URL(request.url);
    
    try {
      // Router básico
      switch (url.pathname) {
        case '/':
          return handleHome();
        
        case '/api/health':
          return handleHealth();
        
        case '/api/eventos':
          return handleEventos(request, env);
        
        case '/api/noticias':
          return handleNoticias(request, env);
        
        default:
          return new Response('Not Found', { 
            status: 404,
            headers: corsHeaders 
          });
      }
    } catch (error) {
      console.error('Worker error:', error);
      return new Response('Internal Server Error', { 
        status: 500,
        headers: corsHeaders 
      });
    }
  },
};

// Handlers
function handleHome(): Response {
  return new Response(JSON.stringify({
    message: 'ACA Chile Worker API',
    version: '1.0.0',
    endpoints: [
      '/api/health',
      '/api/eventos',
      '/api/noticias'
    ]
  }), {
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders,
    },
  });
}

function handleHealth(): Response {
  return new Response(JSON.stringify({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'ACA Chile Worker'
  }), {
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders,
    },
  });
}

async function handleEventos(request: Request, env: Env): Promise<Response> {
  // Ejemplo de datos de eventos
  const eventos = [
    {
      id: 1,
      title: 'Campeonato Nacional de Asadores',
      date: '2025-11-15',
      location: 'Santiago, Chile',
      description: 'El evento más importante del año para asadores chilenos.',
      image: 'https://acachile.com/wp-content/uploads/2025/03/64694334-bbdc-4e97-b4a7-ef75e6bbe50d-500x375.jpg'
    },
    {
      id: 2,
      title: 'Fuego y Sabor Internacional',
      date: '2025-11-22',
      location: 'Valparaíso, Chile',
      description: 'Competencia internacional con participantes de toda América.',
      image: 'https://acachile.com/wp-content/uploads/2024/08/post-alemania-500x375.jpg'
    }
  ];

  return new Response(JSON.stringify(eventos), {
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders,
    },
  });
}

async function handleNoticias(request: Request, env: Env): Promise<Response> {
  // Ejemplo de datos de noticias
  const noticias = [
    {
      id: 1,
      title: 'Chile Brilla en Campeonato Internacional',
      date: '2024-09-15',
      excerpt: 'Equipo QUINTA PARRILLA logra tercer lugar en competencia internacional.',
      image: 'https://acachile.com/wp-content/uploads/2024/08/1697587321850-500x375.jpg'
    },
    {
      id: 2,
      title: 'ACA en el Mundial de Alemania',
      date: '2024-07-28',
      excerpt: 'Tres equipos chilenos compitieron en Stuttgart contra 106 equipos.',
      image: 'https://acachile.com/wp-content/uploads/2024/08/post-alemania-500x375.jpg'
    }
  ];

  return new Response(JSON.stringify(noticias), {
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders,
    },
  });
}