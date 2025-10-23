import type { PagesFunction, Env } from '../../types';

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  const url = new URL(request.url);
  const placeId = url.searchParams.get('place_id') || '';

  if (!placeId) {
    return new Response(JSON.stringify({ success: false, error: 'place_id required' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }

  const key = env.GOOGLE_MAPS_API_KEY || '';
  if (!key) {
    console.warn('[PLACES DETAILS] No API key configured');
    return new Response(JSON.stringify({ success: false, error: 'No API key configured' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }

  try {
    const endpoint = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${encodeURIComponent(placeId)}&key=${encodeURIComponent(key)}&fields=formatted_address,geometry,name,place_id,adr_address`;
    const res = await fetch(endpoint);
    const json = await res.json();

    if (json.status !== 'OK') {
      return new Response(JSON.stringify({ success: false, status: json.status, error_message: json.error_message }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }

    const result = json.result || {};
    return new Response(JSON.stringify({ success: true, result }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (err) {
    console.error('[PLACES DETAILS] Error:', err);
    return new Response(JSON.stringify({ success: false, error: String(err) }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
};
