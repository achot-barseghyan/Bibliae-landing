// Formulaire de contact : seule route rendue côté serveur (fonction Vercel).
// Reçoit le message, le valide et l'envoie à CONTACT_EMAIL via l'API Resend.
import type { APIRoute } from 'astro';
import { RESEND_API_KEY, CONTACT_FROM } from 'astro:env/server';
import { CONTACT_EMAIL } from '../../config';

export const prerender = false;

const TOPICS: Record<string, string> = {
  q: 'Une question',
  err: 'Signaler une erreur',
  idea: 'Une suggestion',
  par: 'Ma paroisse',
  press: 'Presse et partenariat',
};
const EMAIL_RE = /^\S+@\S+\.\S+$/;
const MAX = 2000;

type Result = { ok: true } | { ok: false; error: 'email' | 'short' | 'invalid' | 'server' };

export const POST: APIRoute = async ({ request, url }) => {
  const isJson = !!request.headers.get('content-type')?.includes('application/json');
  let lang: 'fr' | 'en' = 'fr';

  // Sans JS, le navigateur poste le formulaire : on le renvoie vers la page de contact
  const reply = (res: Result, status = 200) => {
    if (isJson) return Response.json(res, { status });
    const back = new URL(lang === 'en' ? '/en/contact' : '/contact', url);
    back.hash = res.ok ? 'envoye' : 'erreur'; // affiché par :target sur la page
    return Response.redirect(back, 303);
  };

  let fields: Record<string, unknown> = {};
  try {
    fields = isJson ? await request.json() : Object.fromEntries(await request.formData());
  } catch {
    return reply({ ok: false, error: 'invalid' }, 400);
  }
  const str = (k: string) => (typeof fields[k] === 'string' ? (fields[k] as string).trim() : '');
  if (str('lang') === 'en') lang = 'en';

  // Requêtes venant d'un autre site
  const origin = request.headers.get('origin');
  if (origin && new URL(origin).host !== url.host) return reply({ ok: false, error: 'invalid' }, 403);

  // Pot de miel : champ caché que seuls les robots remplissent. On fait comme si tout allait bien.
  if (str('site')) return reply({ ok: true });

  const topic = TOPICS[str('objet')] ?? TOPICS.q;
  const name = str('nom').slice(0, 100);
  const email = str('courriel');
  const message = str('message');

  if (!EMAIL_RE.test(email) || email.length > 254) return reply({ ok: false, error: 'email' }, 422);
  if (message.length < 10) return reply({ ok: false, error: 'short' }, 422);
  if (message.length > MAX) return reply({ ok: false, error: 'invalid' }, 422);

  if (!RESEND_API_KEY) {
    console.error('[contact] RESEND_API_KEY manquante');
    return reply({ ok: false, error: 'server' }, 500);
  }

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: CONTACT_FROM,
      to: [CONTACT_EMAIL],
      reply_to: email,
      subject: `[Bibliae] ${topic}${lang === 'en' ? ' (EN)' : ''}`,
      text: `${message}\n\n— ${name || 'Sans nom'} · ${email}\nPage : ${lang === 'en' ? '/en/contact' : '/contact'}`,
    }),
  }).catch((e) => {
    console.error('[contact] Resend injoignable', e);
    return null;
  });

  if (!res?.ok) {
    if (res) console.error('[contact] Resend', res.status, await res.text());
    return reply({ ok: false, error: 'server' }, 502);
  }
  return reply({ ok: true });
};
