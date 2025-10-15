// Endpoint temporal para resetear noticias con datos de ACA Chile (SIN autenticación)
// POST /api/noticias/reset - Resetear noticias con datos actualizados

export async function onRequest(context) {
  const { request, env } = context;
  const method = request.method;

  const corsHeaders = {
    'Access-Control-Allow-Origin': env.CORS_ORIGIN || '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  // Manejar preflight requests
  if (method === 'OPTIONS') {
    return new Response(null, { 
      status: 204, 
      headers: corsHeaders 
    });
  }

  if (method !== 'POST') {
    return new Response(JSON.stringify({
      success: false,
      error: 'Método no permitido'
    }), {
      status: 405,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    });
  }

  try {
    // Limpiar cache primero
    await env.ACA_KV.delete('noticias:all');
    
    // Inicializar datos directamente sin autenticación
    await resetNoticiasData(env);

    return new Response(JSON.stringify({
      success: true,
      message: 'Noticias de ACA Chile inicializadas exitosamente',
      count: 5,
      timestamp: new Date().toISOString()
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    });

  } catch (error) {
    console.error('Error in noticias/reset endpoint:', error);
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

// Función para resetear noticias con datos de ACA Chile
async function resetNoticiasData(env) {
  try {
    const now = new Date();
    
    // Noticias actualizadas de la Asociación Chilena de Asadores
    const noticiasACA = [
      {
        id: 1,
        title: "Chile participará en el Mundial de Barbacoa 2024 en Texas",
        excerpt: "Delegación de asadores chilenos representará al país en la competencia mundial más importante del sector.",
        content: "La Asociación Chilena de Asadores confirmó la participación de una selecta delegación en el Campeonato Mundial de Barbacoa que se realizará en Austin, Texas. Los representantes nacionales competirán en las categorías de costillas, pecho y cerdo, llevando las técnicas tradicionales chilenas a nivel internacional. El equipo está conformado por los ganadores de los últimos tres campeonatos nacionales.",
        image: "/api/images?path=noticias/mundial-barbacoa-2024.jpg",
        category: "competencias",
        author: "Equipo ACA Chile",
        publishedAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(), // -2 días
        status: "published",
        tags: ["mundial", "texas", "competencia", "internacional"],
        views: 1250,
        featured: true
      },
      {
        id: 2,
        title: "Nuevo Curso Básico de Asado con Certificación Oficial",
        excerpt: "ACA Chile lanza programa de certificación para asadores principiantes con instructores calificados.",
        content: "La asociación presentó su nuevo programa educativo dirigido a personas que desean aprender las técnicas fundamentales del asado chileno. El curso incluye módulos teóricos y prácticos, desde selección de carnes hasta manejo del fuego. Al finalizar, los participantes reciben una certificación oficial reconocida por la Federación Internacional de Asadores. Las inscripciones están abiertas para el primer grupo que comenzará en noviembre.",
        image: "/api/images?path=noticias/curso-basico-asado.jpg",
        category: "educacion",
        author: "Departamento Académico ACA",
        publishedAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString(), // -5 días
        status: "published",
        tags: ["curso", "certificacion", "principiantes", "educacion"],
        views: 890,
        featured: false
      },
      {
        id: 3,
        title: "Éxito total en el Campeonato Regional de Asadores de la Zona Sur",
        excerpt: "Más de 200 participantes en la competencia que coronó a los mejores asadores de las regiones VIII a XII.",
        content: "El Campeonato Regional Zona Sur superó todas las expectativas con la participación de asadores de Biobío, Araucanía, Los Ríos, Los Lagos, Aysén y Magallanes. El evento se realizó en Temuco y contó con jurados internacionales. El ganador absoluto fue Juan Carlos Navarro de Puerto Montt, quien se clasificó automáticamente para el Campeonato Nacional. La organización destacó el nivel técnico mostrado por los competidores.",
        image: "/api/images?path=noticias/campeonato-regional-asadores.jpg",
        category: "competencias",
        author: "Comité Regional Sur",
        publishedAt: new Date(now.getTime() - 8 * 24 * 60 * 60 * 1000).toISOString(), // -8 días
        status: "published",
        tags: ["regional", "sur", "campeonato", "temuco"],
        views: 645,
        featured: false
      },
      {
        id: 4,
        title: "Inauguración del Centro de Excelencia en Asado de Valparaíso",
        excerpt: "Nueva sede regional cuenta con instalaciones de última generación para la formación de asadores profesionales.",
        content: "ACA Chile inauguró oficialmente su Centro de Excelencia en la región de Valparaíso, una moderna instalación equipada con 20 parrillas profesionales, laboratorio de carnes y aulas multimedia. El centro ofrecerá cursos especializados, talleres para chefs profesionales y programas de perfeccionamiento para instructores. La inversión de 800 millones de pesos convierte a esta sede en la más avanzada tecnológicamente del país.",
        image: "/api/images?path=noticias/centro-excelencia-valparaiso.jpg",
        category: "institucional",
        author: "Dirección Nacional ACA",
        publishedAt: new Date(now.getTime() - 12 * 24 * 60 * 60 * 1000).toISOString(), // -12 días
        status: "published",
        tags: ["valparaiso", "centro", "excelencia", "inauguracion"],
        views: 1100,
        featured: true
      },
      {
        id: 5,
        title: "Masterclass Exclusiva: Secretos del Asado Patagónico con Chef Raúl Maldonado",
        excerpt: "El reconocido chef patagónico compartirá técnicas ancestrales en una clase magistral única.",
        content: "El chef Raúl Maldonado, tres veces ganador del Campeonato Patagónico de Cordero al Palo, dictará una masterclass exclusiva sobre las técnicas tradicionales del asado en la región austral. La clase cubrirá el manejo del cordero entero, marinados con hierbas nativas, control del fuego en condiciones de viento patagónico y presentación gourmet. Solo 15 cupos disponibles para esta experiencia única que incluye degustación de 5 preparaciones.",
        image: "/api/images?path=noticias/masterclass-patagonico.jpg",
        category: "educacion",
        author: "Chef Raúl Maldonado",
        publishedAt: new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000).toISOString(), // -15 días
        status: "published",
        tags: ["masterclass", "patagonia", "cordero", "chef"],
        views: 780,
        featured: false
      }
    ];

    // Guardar cada noticia individualmente
    for (const noticia of noticiasACA) {
      await env.ACA_KV.put(`noticia:${noticia.id}`, JSON.stringify(noticia));
    }

    // Guardar índice de noticias
    const noticiasIndex = noticiasACA.map(n => ({ id: n.id, title: n.title, publishedAt: n.publishedAt, category: n.category }));
    await env.ACA_KV.put('noticias:index', JSON.stringify(noticiasIndex));

    // ¡IMPORTANTE! Guardar todas las noticias para el endpoint GET
    await env.ACA_KV.put('noticias:all', JSON.stringify(noticiasACA));

    console.log(`Successfully reset ${noticiasACA.length} noticias with ACA Chile data`);
    
    return {
      success: true,
      count: noticiasACA.length,
      noticias: noticiasACA.map(n => ({ id: n.id, title: n.title, image: n.image }))
    };

  } catch (error) {
    console.error('Error resetting noticias data:', error);
    throw error;
  }
}