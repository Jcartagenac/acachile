var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// .wrangler/tmp/bundle-VR3wqL/strip-cf-connecting-ip-header.js
function stripCfConnectingIPHeader(input, init) {
  const request = new Request(input, init);
  request.headers.delete("CF-Connecting-IP");
  return request;
}
__name(stripCfConnectingIPHeader, "stripCfConnectingIPHeader");
globalThis.fetch = new Proxy(globalThis.fetch, {
  apply(target, thisArg, argArray) {
    return Reflect.apply(target, thisArg, [
      stripCfConnectingIPHeader.apply(null, argArray)
    ]);
  }
});

// src/index.ts
var corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization"
};
var src_default = {
  async fetch(request, env, ctx) {
    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: corsHeaders
      });
    }
    const url = new URL(request.url);
    try {
      switch (url.pathname) {
        case "/":
          return handleHome();
        case "/api/health":
          return handleHealth();
        case "/api/eventos":
          return handleEventos(request, env);
        case "/api/noticias":
          return handleNoticias(request, env);
        case "/api/auth/login":
          return handleLogin(request, env);
        case "/api/auth/register":
          return handleRegister(request, env);
        case "/api/auth/profile":
          return handleProfile(request, env);
        default:
          if (url.pathname.startsWith("/api/eventos/")) {
            return handleEventosById(request, env);
          }
          return new Response("Not Found", {
            status: 404,
            headers: corsHeaders
          });
      }
    } catch (error) {
      console.error("Worker error:", error);
      return new Response("Internal Server Error", {
        status: 500,
        headers: corsHeaders
      });
    }
  }
};
function handleHome() {
  return new Response(JSON.stringify({
    message: "ACA Chile Worker API",
    version: "1.0.0",
    endpoints: [
      "/api/health",
      "/api/eventos",
      "/api/noticias"
    ]
  }), {
    headers: {
      "Content-Type": "application/json",
      ...corsHeaders
    }
  });
}
__name(handleHome, "handleHome");
function handleHealth() {
  return new Response(JSON.stringify({
    status: "ok",
    timestamp: (/* @__PURE__ */ new Date()).toISOString(),
    service: "ACA Chile Worker"
  }), {
    headers: {
      "Content-Type": "application/json",
      ...corsHeaders
    }
  });
}
__name(handleHealth, "handleHealth");
async function handleEventos(request, env) {
  const url = new URL(request.url);
  const method = request.method;
  if (method === "GET") {
    const type = url.searchParams.get("type");
    const status = url.searchParams.get("status") || "published";
    const search = url.searchParams.get("search");
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = parseInt(url.searchParams.get("limit") || "12");
    let eventos = [
      {
        id: 1,
        title: "Campeonato Nacional de Asadores 2025",
        date: "2025-11-15",
        time: "09:00",
        location: "Parque O'Higgins, Santiago",
        description: "El evento m\xE1s importante del a\xF1o para asadores chilenos. Competencia por categor\xEDas con premiaci\xF3n especial y degustaci\xF3n para el p\xFAblico.",
        image: "https://acachile.com/wp-content/uploads/2025/03/64694334-bbdc-4e97-b4a7-ef75e6bbe50d-500x375.jpg",
        type: "campeonato",
        registrationOpen: true,
        maxParticipants: 50,
        currentParticipants: 32,
        price: 15e3,
        organizerId: 1,
        createdAt: "2024-10-01T10:00:00Z",
        updatedAt: "2024-10-14T15:30:00Z",
        status: "published",
        requirements: ["Parrilla propia", "Implementos de cocina", "Delantal"],
        tags: ["campeonato", "nacional", "asadores"],
        contactInfo: {
          email: "campeonato@acachile.com",
          phone: "+56912345678"
        }
      },
      {
        id: 2,
        title: "Taller: T\xE9cnicas de Ahumado",
        date: "2025-10-25",
        time: "14:00",
        location: "Escuela Culinaria ACA, Las Condes",
        description: "Aprende las mejores t\xE9cnicas de ahumado con el chef internacional Pablo Ib\xE1\xF1ez. Incluye degustaci\xF3n y certificado.",
        image: "https://acachile.com/wp-content/uploads/2025/06/post-_2025-12-500x375.png",
        type: "taller",
        registrationOpen: true,
        maxParticipants: 20,
        currentParticipants: 8,
        price: 45e3,
        organizerId: 1,
        createdAt: "2024-09-15T09:00:00Z",
        updatedAt: "2024-10-10T11:20:00Z",
        status: "published",
        requirements: ["Sin experiencia previa necesaria"],
        tags: ["taller", "ahumado", "t\xE9cnicas"],
        contactInfo: {
          email: "talleres@acachile.com",
          phone: "+56987654321"
        }
      },
      {
        id: 3,
        title: "Encuentro Regional Valpara\xEDso",
        date: "2025-12-08",
        time: "11:00",
        location: "Vi\xF1a del Mar, Quinta Regi\xF3n",
        description: "Encuentro gastron\xF3mico regional con asadores de la V Regi\xF3n. Actividades familiares y competencias amistosas.",
        image: "https://acachile.com/wp-content/uploads/2024/08/post-alemania-500x375.jpg",
        type: "encuentro",
        registrationOpen: true,
        maxParticipants: void 0,
        currentParticipants: 15,
        price: 0,
        organizerId: 2,
        createdAt: "2024-10-05T16:00:00Z",
        updatedAt: "2024-10-12T09:45:00Z",
        status: "published",
        requirements: ["Solo ganas de compartir"],
        tags: ["encuentro", "regional", "familia"],
        contactInfo: {
          email: "valparaiso@acachile.com"
        }
      },
      {
        id: 4,
        title: "Torneo de Costillares",
        date: "2025-11-30",
        time: "10:00",
        location: "Club de Campo Los Leones",
        description: "Torneo especializado en preparaci\xF3n de costillares. Modalidad equipos de 3 personas.",
        image: "https://acachile.com/wp-content/uploads/2024/08/1697587321850-500x375.jpg",
        type: "torneo",
        registrationOpen: false,
        maxParticipants: 30,
        currentParticipants: 30,
        price: 25e3,
        organizerId: 1,
        createdAt: "2024-09-20T12:00:00Z",
        updatedAt: "2024-10-01T14:15:00Z",
        status: "published",
        requirements: ["Equipo de 3 personas", "Costillar por equipo"],
        tags: ["torneo", "costillares", "equipos"],
        contactInfo: {
          email: "torneos@acachile.com",
          website: "https://torneos.acachile.com"
        }
      }
    ];
    if (type) {
      eventos = eventos.filter((evento) => evento.type === type);
    }
    if (status) {
      eventos = eventos.filter((evento) => evento.status === status);
    }
    if (search) {
      const searchLower = search.toLowerCase();
      eventos = eventos.filter(
        (evento) => evento.title.toLowerCase().includes(searchLower) || evento.description.toLowerCase().includes(searchLower) || evento.location.toLowerCase().includes(searchLower)
      );
    }
    const total = eventos.length;
    const pages = Math.ceil(total / limit);
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedEventos = eventos.slice(startIndex, endIndex);
    return new Response(JSON.stringify({
      success: true,
      data: paginatedEventos,
      pagination: {
        page,
        limit,
        total,
        pages
      }
    }), {
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders
      }
    });
  }
  if (method === "POST") {
    try {
      const body = await request.json();
      const nuevoEvento = {
        id: Date.now(),
        ...body,
        currentParticipants: 0,
        organizerId: 1,
        // TODO: Obtener del token
        createdAt: (/* @__PURE__ */ new Date()).toISOString(),
        updatedAt: (/* @__PURE__ */ new Date()).toISOString(),
        status: "published"
      };
      return new Response(JSON.stringify({
        success: true,
        data: nuevoEvento,
        message: "Evento creado exitosamente"
      }), {
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders
        }
      });
    } catch (error) {
      return new Response(JSON.stringify({
        success: false,
        error: "Error al crear evento"
      }), {
        status: 400,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders
        }
      });
    }
  }
  return new Response("Method not allowed", {
    status: 405,
    headers: corsHeaders
  });
}
__name(handleEventos, "handleEventos");
async function handleNoticias(request, env) {
  const noticias = [
    {
      id: 1,
      title: "Chile Brilla en Campeonato Internacional",
      date: "2024-09-15",
      excerpt: "Equipo QUINTA PARRILLA logra tercer lugar en competencia internacional.",
      image: "https://acachile.com/wp-content/uploads/2024/08/1697587321850-500x375.jpg"
    },
    {
      id: 2,
      title: "ACA en el Mundial de Alemania",
      date: "2024-07-28",
      excerpt: "Tres equipos chilenos compitieron en Stuttgart contra 106 equipos.",
      image: "https://acachile.com/wp-content/uploads/2024/08/post-alemania-500x375.jpg"
    }
  ];
  return new Response(JSON.stringify(noticias), {
    headers: {
      "Content-Type": "application/json",
      ...corsHeaders
    }
  });
}
__name(handleNoticias, "handleNoticias");
async function handleLogin(request, env) {
  if (request.method !== "POST") {
    return new Response("Method not allowed", {
      status: 405,
      headers: corsHeaders
    });
  }
  try {
    const body = await request.json();
    const { email, password } = body;
    if (!email || !password) {
      return new Response(JSON.stringify({
        success: false,
        error: "Email y contrase\xF1a son requeridos"
      }), {
        status: 400,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders
        }
      });
    }
    const demoUsers = [
      {
        id: 1,
        email: "admin@acachile.com",
        password: "123456",
        // En producción usar hash
        name: "Administrador ACA",
        membershipType: "vip",
        region: "Metropolitana",
        joinDate: "2024-01-01",
        active: true
      },
      {
        id: 2,
        email: "usuario@acachile.com",
        password: "123456",
        name: "Usuario Demo",
        membershipType: "basic",
        region: "Valpara\xEDso",
        joinDate: "2024-06-15",
        active: true
      }
    ];
    const user = demoUsers.find((u) => u.email === email && u.password === password);
    if (!user) {
      return new Response(JSON.stringify({
        success: false,
        error: "Credenciales inv\xE1lidas"
      }), {
        status: 401,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders
        }
      });
    }
    const token = btoa(JSON.stringify({
      userId: user.id,
      email: user.email,
      exp: Date.now() + 7 * 24 * 60 * 60 * 1e3
      // 7 días
    }));
    const { password: _, ...userResponse } = user;
    return new Response(JSON.stringify({
      success: true,
      data: {
        user: userResponse,
        token,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1e3).toISOString()
      }
    }), {
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders
      }
    });
  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      error: "Error interno del servidor"
    }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders
      }
    });
  }
}
__name(handleLogin, "handleLogin");
async function handleRegister(request, env) {
  if (request.method !== "POST") {
    return new Response("Method not allowed", {
      status: 405,
      headers: corsHeaders
    });
  }
  try {
    const body = await request.json();
    const { email, password, name, phone, region } = body;
    if (!email || !password || !name) {
      return new Response(JSON.stringify({
        success: false,
        error: "Email, contrase\xF1a y nombre son requeridos"
      }), {
        status: 400,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders
        }
      });
    }
    const newUser = {
      id: Date.now(),
      email,
      name,
      phone: phone || null,
      region: region || null,
      membershipType: "basic",
      joinDate: (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
      active: true
    };
    const token = btoa(JSON.stringify({
      userId: newUser.id,
      email: newUser.email,
      exp: Date.now() + 7 * 24 * 60 * 60 * 1e3
    }));
    return new Response(JSON.stringify({
      success: true,
      data: {
        user: newUser,
        token,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1e3).toISOString()
      },
      message: "Cuenta creada exitosamente"
    }), {
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders
      }
    });
  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      error: "Error interno del servidor"
    }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders
      }
    });
  }
}
__name(handleRegister, "handleRegister");
async function handleProfile(request, env) {
  if (request.method !== "GET") {
    return new Response("Method not allowed", {
      status: 405,
      headers: corsHeaders
    });
  }
  const authHeader = request.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return new Response(JSON.stringify({
      success: false,
      error: "Token de autorizaci\xF3n requerido"
    }), {
      status: 401,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders
      }
    });
  }
  return new Response(JSON.stringify({
    success: true,
    message: "Perfil de usuario (implementar)"
  }), {
    headers: {
      "Content-Type": "application/json",
      ...corsHeaders
    }
  });
}
__name(handleProfile, "handleProfile");
async function handleEventosById(request, env) {
  const url = new URL(request.url);
  const pathParts = url.pathname.split("/");
  const eventId = parseInt(pathParts[3]);
  if (isNaN(eventId)) {
    return new Response(JSON.stringify({
      success: false,
      error: "ID de evento inv\xE1lido"
    }), {
      status: 400,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders
      }
    });
  }
  if (request.method === "GET") {
    const evento = {
      id: eventId,
      title: "Campeonato Nacional de Asadores 2025",
      date: "2025-11-15",
      time: "09:00",
      location: "Parque O'Higgins, Santiago",
      description: "El evento m\xE1s importante del a\xF1o para asadores chilenos. Competencia por categor\xEDas con premiaci\xF3n especial y degustaci\xF3n para el p\xFAblico.\n\nEn este campeonato nacional participar\xE1n los mejores asadores de todas las regiones del pa\xEDs, compitiendo en diferentes categor\xEDas como mejor asado, mejor chorizo, y mejor acompa\xF1amiento.\n\nEl evento incluye:\n- Competencias oficiales por categor\xEDas\n- Degustaci\xF3n abierta al p\xFAblico\n- Actividades para toda la familia\n- Premiaci\xF3n con trofeos y premios en efectivo\n- M\xFAsica en vivo y entretenimiento",
      image: "https://acachile.com/wp-content/uploads/2025/03/64694334-bbdc-4e97-b4a7-ef75e6bbe50d-500x375.jpg",
      type: "campeonato",
      registrationOpen: true,
      maxParticipants: 50,
      currentParticipants: 32,
      price: 15e3,
      organizerId: 1,
      createdAt: "2024-10-01T10:00:00Z",
      updatedAt: "2024-10-14T15:30:00Z",
      status: "published",
      requirements: [
        "Parrilla propia (tama\xF1o m\xEDnimo 60x40cm)",
        "Implementos de cocina b\xE1sicos",
        "Delantal y gorro de cocinero",
        "Carne proporcionada por la organizaci\xF3n"
      ],
      tags: ["campeonato", "nacional", "asadores", "2025"],
      contactInfo: {
        email: "campeonato@acachile.com",
        phone: "+56912345678",
        website: "https://campeonato.acachile.com"
      }
    };
    return new Response(JSON.stringify({
      success: true,
      data: evento
    }), {
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders
      }
    });
  }
  if (request.method === "PUT") {
    try {
      const body = await request.json();
      const eventoActualizado = {
        id: eventId,
        ...body,
        updatedAt: (/* @__PURE__ */ new Date()).toISOString()
      };
      return new Response(JSON.stringify({
        success: true,
        data: eventoActualizado,
        message: "Evento actualizado exitosamente"
      }), {
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders
        }
      });
    } catch (error) {
      return new Response(JSON.stringify({
        success: false,
        error: "Error al actualizar evento"
      }), {
        status: 400,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders
        }
      });
    }
  }
  if (request.method === "DELETE") {
    return new Response(JSON.stringify({
      success: true,
      message: "Evento eliminado exitosamente"
    }), {
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders
      }
    });
  }
  return new Response("Method not allowed", {
    status: 405,
    headers: corsHeaders
  });
}
__name(handleEventosById, "handleEventosById");

// ../node_modules/wrangler/templates/middleware/middleware-ensure-req-body-drained.ts
var drainBody = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } finally {
    try {
      if (request.body !== null && !request.bodyUsed) {
        const reader = request.body.getReader();
        while (!(await reader.read()).done) {
        }
      }
    } catch (e) {
      console.error("Failed to drain the unused request body.", e);
    }
  }
}, "drainBody");
var middleware_ensure_req_body_drained_default = drainBody;

// ../node_modules/wrangler/templates/middleware/middleware-miniflare3-json-error.ts
function reduceError(e) {
  return {
    name: e?.name,
    message: e?.message ?? String(e),
    stack: e?.stack,
    cause: e?.cause === void 0 ? void 0 : reduceError(e.cause)
  };
}
__name(reduceError, "reduceError");
var jsonError = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } catch (e) {
    const error = reduceError(e);
    return Response.json(error, {
      status: 500,
      headers: { "MF-Experimental-Error-Stack": "true" }
    });
  }
}, "jsonError");
var middleware_miniflare3_json_error_default = jsonError;

// .wrangler/tmp/bundle-VR3wqL/middleware-insertion-facade.js
var __INTERNAL_WRANGLER_MIDDLEWARE__ = [
  middleware_ensure_req_body_drained_default,
  middleware_miniflare3_json_error_default
];
var middleware_insertion_facade_default = src_default;

// ../node_modules/wrangler/templates/middleware/common.ts
var __facade_middleware__ = [];
function __facade_register__(...args) {
  __facade_middleware__.push(...args.flat());
}
__name(__facade_register__, "__facade_register__");
function __facade_invokeChain__(request, env, ctx, dispatch, middlewareChain) {
  const [head, ...tail] = middlewareChain;
  const middlewareCtx = {
    dispatch,
    next(newRequest, newEnv) {
      return __facade_invokeChain__(newRequest, newEnv, ctx, dispatch, tail);
    }
  };
  return head(request, env, ctx, middlewareCtx);
}
__name(__facade_invokeChain__, "__facade_invokeChain__");
function __facade_invoke__(request, env, ctx, dispatch, finalMiddleware) {
  return __facade_invokeChain__(request, env, ctx, dispatch, [
    ...__facade_middleware__,
    finalMiddleware
  ]);
}
__name(__facade_invoke__, "__facade_invoke__");

// .wrangler/tmp/bundle-VR3wqL/middleware-loader.entry.ts
var __Facade_ScheduledController__ = class {
  constructor(scheduledTime, cron, noRetry) {
    this.scheduledTime = scheduledTime;
    this.cron = cron;
    this.#noRetry = noRetry;
  }
  #noRetry;
  noRetry() {
    if (!(this instanceof __Facade_ScheduledController__)) {
      throw new TypeError("Illegal invocation");
    }
    this.#noRetry();
  }
};
__name(__Facade_ScheduledController__, "__Facade_ScheduledController__");
function wrapExportedHandler(worker) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return worker;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  const fetchDispatcher = /* @__PURE__ */ __name(function(request, env, ctx) {
    if (worker.fetch === void 0) {
      throw new Error("Handler does not export a fetch() function.");
    }
    return worker.fetch(request, env, ctx);
  }, "fetchDispatcher");
  return {
    ...worker,
    fetch(request, env, ctx) {
      const dispatcher = /* @__PURE__ */ __name(function(type, init) {
        if (type === "scheduled" && worker.scheduled !== void 0) {
          const controller = new __Facade_ScheduledController__(
            Date.now(),
            init.cron ?? "",
            () => {
            }
          );
          return worker.scheduled(controller, env, ctx);
        }
      }, "dispatcher");
      return __facade_invoke__(request, env, ctx, dispatcher, fetchDispatcher);
    }
  };
}
__name(wrapExportedHandler, "wrapExportedHandler");
function wrapWorkerEntrypoint(klass) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return klass;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  return class extends klass {
    #fetchDispatcher = (request, env, ctx) => {
      this.env = env;
      this.ctx = ctx;
      if (super.fetch === void 0) {
        throw new Error("Entrypoint class does not define a fetch() function.");
      }
      return super.fetch(request);
    };
    #dispatcher = (type, init) => {
      if (type === "scheduled" && super.scheduled !== void 0) {
        const controller = new __Facade_ScheduledController__(
          Date.now(),
          init.cron ?? "",
          () => {
          }
        );
        return super.scheduled(controller);
      }
    };
    fetch(request) {
      return __facade_invoke__(
        request,
        this.env,
        this.ctx,
        this.#dispatcher,
        this.#fetchDispatcher
      );
    }
  };
}
__name(wrapWorkerEntrypoint, "wrapWorkerEntrypoint");
var WRAPPED_ENTRY;
if (typeof middleware_insertion_facade_default === "object") {
  WRAPPED_ENTRY = wrapExportedHandler(middleware_insertion_facade_default);
} else if (typeof middleware_insertion_facade_default === "function") {
  WRAPPED_ENTRY = wrapWorkerEntrypoint(middleware_insertion_facade_default);
}
var middleware_loader_entry_default = WRAPPED_ENTRY;
export {
  __INTERNAL_WRANGLER_MIDDLEWARE__,
  middleware_loader_entry_default as default
};
//# sourceMappingURL=index.js.map
