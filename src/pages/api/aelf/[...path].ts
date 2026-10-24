// Relais vers l'API AELF : elle n'envoie pas d'en-tête CORS, le navigateur ne peut donc pas l'appeler depuis bibliae.app.
// Seuls les chemins utilisés par le site passent (offices, messes, informations d'un jour, zone France).
import type { APIRoute } from 'astro';

export const prerender = false;

const PATH_RE = /^(messes|informations|lectures|laudes|tierce|sexte|none|vepres|complies)\/\d{4}-\d{2}-\d{2}\/france$/;

export const GET: APIRoute = async ({ params }) => {
  const path = params.path ?? '';
  if (!PATH_RE.test(path)) return new Response('Not found', { status: 404 });

  try {
    const r = await fetch(`https://api.aelf.org/v1/${path}`, { headers: { accept: 'application/json' } });
    if (!r.ok) return new Response(null, { status: r.status === 404 ? 404 : 502, headers: { 'Cache-Control': 'public, s-maxage=60' } });
    // Les textes d'un jour donné ne changent pas : longue mise en cache par le CDN
    return new Response(await r.text(), {
      headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=86400' },
    });
  } catch {
    return new Response(null, { status: 502, headers: { 'Cache-Control': 'public, s-maxage=60' } });
  }
};
