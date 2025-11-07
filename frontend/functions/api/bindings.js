export async function onRequestGet(context) {
  const bindings = {
    DB: !!context.env.DB,
    ACA_KV: !!context.env.ACA_KV,
    IMAGES: !!context.env.IMAGES,
    JWT_SECRET: !!context.env.JWT_SECRET,
    RESEND_API_KEY: !!context.env.RESEND_API_KEY,
    CORS_ORIGIN: context.env.CORS_ORIGIN || 'not set',
    ENVIRONMENT: context.env.ENVIRONMENT || 'not set',
    FRONTEND_URL: context.env.FRONTEND_URL || 'not set',
    R2_PUBLIC_URL: context.env.R2_PUBLIC_URL || 'not set',
    FROM_EMAIL: context.env.FROM_EMAIL || 'not set',
    ADMIN_EMAIL: context.env.ADMIN_EMAIL || 'not set'
  };

  // Test database connection
  let dbTest = null;
  if (context.env.DB) {
    try {
      const result = await context.env.DB.prepare("SELECT name FROM sqlite_master WHERE type='table' LIMIT 5").all();
      dbTest = {
        connected: true,
        tables: result.results?.map(r => r.name) || []
      };
    } catch (error) {
      dbTest = {
        connected: false,
        error: error.message
      };
    }
  }

  // Test KV connection
  let kvTest = null;
  if (context.env.ACA_KV) {
    try {
      await context.env.ACA_KV.put('bindings-test', Date.now().toString(), { expirationTtl: 60 });
      const testValue = await context.env.ACA_KV.get('bindings-test');
      kvTest = {
        connected: true,
        canWrite: !!testValue
      };
    } catch (error) {
      kvTest = {
        connected: false,
        error: error.message
      };
    }
  }

  return new Response(JSON.stringify({
    message: 'Bindings Report',
    timestamp: new Date().toISOString(),
    bindings: bindings,
    tests: {
      database: dbTest,
      kv: kvTest
    }
  }, null, 2), {
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    }
  });
}