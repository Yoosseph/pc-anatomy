/**
 * The feedback form's server half, and the only code in the project that runs
 * on a server. Vercel deploys any file in `api/` as a function; everything
 * else is static.
 *
 * The repository is public, so nothing private is written here. The Resend
 * key and the inbox the messages go to are read from environment variables
 * set in the Vercel project (see "Feedback form" in the README). A fork or a
 * preview without them answers 503 `not_configured`, and the form points the
 * reader at GitHub issues instead.
 *
 * Self-contained on purpose: Vercel compiles this file on its own, without
 * the `@/` alias, so it imports nothing from the rest of the project.
 * `app/feedback.ts` keeps its own copy of `LIMITS` and `KINDS`, and
 * `tests/feedback.test.ts` checks that the two agree.
 */

/** Field limits, in characters. */
export const LIMITS = {
  name: 80,
  email: 254,
  messageMin: 10,
  messageMax: 5000,
  page: 500,
  selection: 200,
  language: 35,
} as const;

/** What the message is about. The form offers these as radio buttons. */
export const KINDS = ['issue', 'idea', 'other'] as const;
export type Kind = (typeof KINDS)[number];

const KIND_LABEL: Record<Kind, string> = {
  issue: 'Issue',
  idea: 'Idea',
  other: 'Message',
};

/** Bodies above this are refused before they are parsed. */
export const MAX_BODY_BYTES = 20_000;
const SITE = 'PC Anatomy';
const DEFAULT_FROM = `${SITE} <onboarding@resend.dev>`;
const RESEND_URL = 'https://api.resend.com/emails';

export type Feedback = {
  kind: Kind;
  name: string;
  email: string;
  message: string;
  page: string;
  selection: string;
  language: string;
};

export type Env = {
  RESEND_API_KEY?: string;
  CONTACT_TO_EMAIL?: string;
  CONTACT_FROM_EMAIL?: string;
};

/* ---------------------------------------------------------------- limiter */

/**
 * A best-effort brake, not a guarantee: the list lives in one function
 * instance and is gone when that instance is recycled. It stops a script from
 * emptying the Resend quota in a minute, which is all it is for.
 */
export function createLimiter(max = 5, windowMs = 10 * 60_000) {
  const recent = new Map<string, number[]>();
  return (key: string, now: number): boolean => {
    const times = (recent.get(key) ?? []).filter((t) => now - t < windowMs);
    if (times.length >= max) {
      recent.set(key, times);
      return false;
    }
    times.push(now);
    recent.set(key, times);
    // A flood of distinct addresses should not grow the map without bound.
    if (recent.size > 5000) recent.clear();
    return true;
  };
}

/* ------------------------------------------------------------- validation */

const EMAIL = /^[^\s@<>,;"]+@[^\s@<>,;"]+\.[^\s@<>,;"]+$/;

function text(source: Record<string, unknown>, key: string): string {
  const value = source[key];
  return typeof value === 'string' ? value.trim() : '';
}

/** One line, with no control characters: safe for a header or a table cell. */
function oneLine(value: string): string {
  // oxlint-disable-next-line no-control-regex
  return value.replace(/[\u0000-\u001f\u007f]+/g, ' ').trim();
}

export type Validation =
  | { ok: true; value: Feedback }
  | { ok: false; fields: string[] };

/** Checks a parsed body and returns the cleaned message, or the bad fields. */
export function validate(body: unknown): Validation {
  if (!body || typeof body !== 'object' || Array.isArray(body))
    return { ok: false, fields: ['body'] };
  const source = body as Record<string, unknown>;
  const fields: string[] = [];

  const kind = text(source, 'kind') as Kind;
  if (!KINDS.includes(kind)) fields.push('kind');

  const name = oneLine(text(source, 'name'));
  if (name.length > LIMITS.name) fields.push('name');

  const email = text(source, 'email');
  if (email && (email.length > LIMITS.email || !EMAIL.test(email)))
    fields.push('email');

  // Line endings are normalised first so "\r\n" counts as one character, the
  // way the textarea's `maxLength` counts it.
  const message = text(source, 'message').replace(/\r\n?/g, '\n');
  if (message.length < LIMITS.messageMin || message.length > LIMITS.messageMax)
    fields.push('message');

  // Context is a courtesy: a bad value is dropped rather than refused.
  let page = oneLine(text(source, 'page'));
  if (!/^https?:\/\//i.test(page) || page.length > LIMITS.page) page = '';
  const selection = oneLine(text(source, 'selection')).slice(
    0,
    LIMITS.selection,
  );
  const language = oneLine(text(source, 'language')).slice(0, LIMITS.language);

  if (fields.length) return { ok: false, fields };
  return {
    ok: true,
    value: { kind, name, email, message, page, selection, language },
  };
}

/* ------------------------------------------------------------------ email */

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** `feedback@x.com` becomes `PC Anatomy <feedback@x.com>`; a full
    `Name <address>` is used as given. */
export function sender(from: string | undefined): string {
  const value = from?.trim();
  if (!value) return DEFAULT_FROM;
  return value.includes('<') ? value : `${SITE} <${value}>`;
}

export type Email = {
  from: string;
  to: string[];
  subject: string;
  text: string;
  html: string;
  reply_to?: string;
  tags: { name: string; value: string }[];
};

export function buildEmail(
  feedback: Feedback,
  config: { to: string; from?: string },
): Email {
  const label = KIND_LABEL[feedback.kind];
  const who = feedback.name || 'anonymous';
  const preview = oneLine(feedback.message).slice(0, 60);
  const subject = oneLine(`[${SITE}] ${label} from ${who}: ${preview}`);

  const rows: [string, string][] = [
    ['Type', label],
    ['Name', feedback.name || '—'],
    ['Email', feedback.email || '— (no reply address)'],
    ['Page', feedback.page || '—'],
    ['Selection', feedback.selection || '—'],
    ['Language', feedback.language || '—'],
  ];

  const plain = [
    ...rows.map(([k, v]) => `${k}: ${v}`),
    '',
    feedback.message,
  ].join('\n');

  const cell = 'padding:4px 12px 4px 0;vertical-align:top;';
  const html =
    `<table style="border-collapse:collapse;font:14px/1.5 sans-serif;">` +
    rows
      .map(
        ([k, v]) =>
          `<tr><th align="left" style="${cell}color:#666;font-weight:600;">${escapeHtml(k)}</th>` +
          `<td style="${cell}">${escapeHtml(v)}</td></tr>`,
      )
      .join('') +
    `</table>` +
    `<div style="margin-top:16px;font:14px/1.6 sans-serif;white-space:pre-wrap;">${escapeHtml(feedback.message)}</div>`;

  const email: Email = {
    from: sender(config.from),
    to: [config.to],
    subject,
    text: plain,
    html,
    tags: [
      { name: 'source', value: 'pc-anatomy' },
      { name: 'kind', value: feedback.kind },
    ],
  };
  if (feedback.email) email.reply_to = feedback.email;
  return email;
}

/* ---------------------------------------------------------------- handler */

export type Deps = {
  env: Env;
  fetch: typeof fetch;
  now: () => number;
  allow: (key: string, now: number) => boolean;
};

function reply(status: number, body: Record<string, unknown>): Response {
  return Response.json(body, {
    status,
    headers: { 'Cache-Control': 'no-store' },
  });
}

/** The request came from a page on this site, not from another origin. */
function sameOrigin(request: Request): boolean {
  const origin = request.headers.get('origin');
  if (!origin) return false;
  let originHost: string;
  try {
    originHost = new URL(origin).host;
  } catch {
    return false;
  }
  const hosts = [
    request.headers.get('x-forwarded-host'),
    request.headers.get('host'),
  ]
    .flatMap((h) => (h ? h.split(',') : []))
    .map((h) => h.trim().toLowerCase())
    .filter(Boolean);
  return hosts.includes(originHost.toLowerCase());
}

function clientIp(request: Request): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    request.headers.get('x-real-ip') ||
    'unknown'
  );
}

export async function handle(request: Request, deps: Deps): Promise<Response> {
  if (request.method !== 'POST')
    return new Response(null, { status: 405, headers: { Allow: 'POST' } });

  const key = deps.env.RESEND_API_KEY?.trim();
  const to = deps.env.CONTACT_TO_EMAIL?.trim();
  if (!key || !to) return reply(503, { error: 'not_configured' });

  if (!sameOrigin(request)) return reply(403, { error: 'forbidden' });

  const type = request.headers.get('content-type') ?? '';
  if (!/^application\/json\b/i.test(type))
    return reply(415, { error: 'unsupported_media_type' });

  const declared = Number(request.headers.get('content-length'));
  if (declared > MAX_BODY_BYTES) return reply(413, { error: 'too_large' });
  const raw = await request.text();
  if (new TextEncoder().encode(raw).length > MAX_BODY_BYTES)
    return reply(413, { error: 'too_large' });

  let body: unknown;
  try {
    body = JSON.parse(raw);
  } catch {
    return reply(400, { error: 'invalid', fields: ['body'] });
  }

  // Hidden from people, filled in by form-stuffing bots. Answer as if it
  // worked so the bot has nothing to adapt to.
  if (
    body &&
    typeof body === 'object' &&
    text(body as Record<string, unknown>, 'website')
  )
    return reply(200, { ok: true });

  const checked = validate(body);
  if (!checked.ok)
    return reply(400, { error: 'invalid', fields: checked.fields });

  if (!deps.allow(clientIp(request), deps.now()))
    return reply(429, { error: 'rate_limited' });

  const email = buildEmail(checked.value, {
    to,
    from: deps.env.CONTACT_FROM_EMAIL,
  });

  let sent: Response;
  try {
    sent = await deps.fetch(RESEND_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(email),
    });
  } catch (error) {
    console.error('contact: could not reach Resend', error);
    return reply(502, { error: 'send_failed' });
  }
  if (!sent.ok) {
    // These two lines are how a failed send is debugged: Resend says exactly
    // why (an unverified domain, a revoked key, a recipient it will not use).
    console.error(
      'contact: Resend refused the message',
      sent.status,
      await sent.text().catch(() => ''),
    );
    return reply(502, { error: 'send_failed' });
  }
  return reply(200, { ok: true });
}

/* One limiter per function instance, shared by every request it serves. */
const allow = createLimiter();

/** Vercel's entry point for `POST /api/contact`. */
export async function POST(request: Request): Promise<Response> {
  return handle(request, {
    env: process.env as Env,
    fetch: (input, init) => fetch(input, init),
    now: Date.now,
    allow,
  });
}
