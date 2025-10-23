import type { PagesFunction, Env } from '../../types';

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { env } = context;

  // Only return a public API key placeholder; make sure env.GOOGLE_MAPS_API_KEY is set in Pages secrets
  const key = env.GOOGLE_MAPS_API_KEY || '';

  return new Response(JSON.stringify({ success: true, data: { googleMapsKey: key } }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
};
