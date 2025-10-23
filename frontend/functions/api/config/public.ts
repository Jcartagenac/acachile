import type { PagesFunction, Env } from '../../types';

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { env } = context;
  // Check presence of the key without exposing it
  const key = env.GOOGLE_MAPS_API_KEY;
  try {
    if (key) {
      console.log('[CONFIG/PUBLIC] GOOGLE_MAPS_API_KEY present, length:', String(key).length);
    } else {
      console.log('[CONFIG/PUBLIC] GOOGLE_MAPS_API_KEY missing or empty');
    }
  } catch (e) {
    console.log('[CONFIG/PUBLIC] Error accessing GOOGLE_MAPS_API_KEY');
  }

  return new Response(JSON.stringify({ success: true, data: { hasGoogleMapsKey: !!key } }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
};
