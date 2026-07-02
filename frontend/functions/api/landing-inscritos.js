const COUNTER_KEY = 'landing:inscripciones:clicks';

export async function onRequest(context) {
  const { request, env } = context;

  try {
    if (request.method === 'GET') {
      return await handleGet(env);
    }

    if (request.method === 'POST') {
      return await handlePost(env);
    }

    return jsonResponse({
      success: false,
      error: `Método ${request.method} no permitido`,
    }, 405);
  } catch (error) {
    console.error('[landing-inscritos] unexpected error', error);
    return jsonResponse({
      success: false,
      error: 'No se pudo procesar el contador',
    }, 500);
  }
}

async function handleGet(env) {
  const rawCount = await env.ACA_KV.get(COUNTER_KEY);
  const count = Number.parseInt(rawCount || '0', 10) || 0;

  return jsonResponse({
    success: true,
    count,
  });
}

async function handlePost(env) {
  const rawCount = await env.ACA_KV.get(COUNTER_KEY);
  const currentCount = Number.parseInt(rawCount || '0', 10) || 0;
  const nextCount = currentCount + 1;

  await env.ACA_KV.put(COUNTER_KEY, String(nextCount));

  return jsonResponse({
    success: true,
    count: nextCount,
  });
}

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
    },
  });
}
