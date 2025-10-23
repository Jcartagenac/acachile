import type { PagesFunction, Env } from '../../types';

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  const url = new URL(request.url);
  const input = url.searchParams.get('input') || '';

  if (!input || input.trim().length < 1) {
    return new Response(JSON.stringify({ success: true, predictions: [] }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  }

  const key = env.GOOGLE_MAPS_API_KEY || '';
  if (!key) {
    console.warn('[PLACES AUTOCOMPLETE] No API key configured');
    return new Response(JSON.stringify({ success: true, predictions: [] }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  }

  try {
    const encoded = encodeURIComponent(input);
    const endpoint = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encoded}&key=${encodeURIComponent(key)}&components=country:CL&types=address&language=es`;

    const res = await fetch(endpoint);
    const json = await res.json();

    // Forward predictions as-is for the frontend to consume
    return new Response(JSON.stringify({ success: true, predictions: json.predictions || [], status: json.status, error_message: json.error_message }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err) {
    console.error('[PLACES AUTOCOMPLETE] Error:', err);
    return new Response(JSON.stringify({ success: false, error: String(err) }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
};
