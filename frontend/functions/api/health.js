export async function onRequestGet(context) {
  return new Response(JSON.stringify({
    success: true,
    message: 'API is healthy',
    data: {
      timestamp: new Date().toISOString(),
      environment: context.env.ENVIRONMENT || 'unknown'
    }
  }), {
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    }
  });
}