export async function onRequestGet(context) {
  let databaseStatus = false;
  let kvStatus = false;

  try {
    // Test D1 Database connection
    if (context.env.DB) {
      const result = await context.env.DB.prepare("SELECT 1 as test").first();
      databaseStatus = result && result.test === 1;
    }
  } catch (error) {
    console.error('Database test failed:', error);
  }

  try {
    // Test KV connection
    if (context.env.ACA_KV) {
      await context.env.ACA_KV.put('health-check', Date.now().toString(), { expirationTtl: 60 });
      const testValue = await context.env.ACA_KV.get('health-check');
      kvStatus = testValue !== null;
    }
  } catch (error) {
    console.error('KV test failed:', error);
  }

  const isHealthy = databaseStatus && kvStatus;

  return new Response(JSON.stringify({
    success: isHealthy,
    message: isHealthy ? 'API is healthy' : 'API has issues',
    data: {
      timestamp: new Date().toISOString(),
      environment: context.env.ENVIRONMENT || 'unknown',
      database: databaseStatus,
      kv: kvStatus
    }
  }), {
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    }
  });
}