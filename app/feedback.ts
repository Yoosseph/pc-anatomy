/**
 * The feedback form's rules, without React, so the tests can reach them.
 *
 * `LIMITS` and `KINDS` mirror `api/contact.ts`. They are copied rather than
 * imported because the function is compiled on its own and the page should
 * not pull server code into its bundle; `tests/feedback.test.ts` fails if the
 * two copies drift apart.
 */

export const LIMITS = {
  name: 80,
  email: 254,
  messageMin: 10,
  messageMax: 5000,
  page: 500,
  selection: 200,
  language: 35,
} as const;

export const KINDS = ['issue', 'idea', 'other'] as const;
export type Kind = (typeof KINDS)[number];

export const KIND_LABELS: Record<Kind, string> = {
  issue: 'Issue or mistake',
  idea: 'Idea or request',
  other: 'Collaboration or something else',
};

/** What the visitor is typing. Kept while the dialog is closed. */
export type Draft = {
  kind: Kind;
  name: string;
  email: string;
  message: string;
  /** The honeypot. People never see it; bots fill it in. */
  website: string;
};

export const EMPTY_DRAFT: Draft = {
  kind: 'issue',
  name: '',
  email: '',
  message: '',
  website: '',
};

/** Sent with every message so a report says what the reader was looking at. */
export type Context = { page: string; selection: string; language: string };

export function payload(draft: Draft, context: Context) {
  return {
    kind: draft.kind,
    name: draft.name.trim().slice(0, LIMITS.name),
    email: draft.email.trim().slice(0, LIMITS.email),
    message: draft.message.trim(),
    website: draft.website,
    page: context.page.slice(0, LIMITS.page),
    selection: context.selection.slice(0, LIMITS.selection),
    language: context.language.slice(0, LIMITS.language),
  };
}

export type Outcome =
  | 'sent'
  | 'invalid'
  | 'rate_limited'
  | 'failed'
  | 'unavailable';

/**
 * What a response means to the reader.
 *
 * "Unavailable" covers every way the function can be missing: `vite dev` and
 * static previews answer 404 or 405, some hosts 501, a deployment without
 * the Resend settings 503, and a host that serves the app shell for every
 * path answers 200 with HTML. Only `{ ok: true }` counts as sent.
 */
export function outcomeOf(status: number, body: unknown): Outcome {
  if (status >= 200 && status < 300)
    return body &&
      typeof body === 'object' &&
      (body as { ok?: unknown }).ok === true
      ? 'sent'
      : 'unavailable';
  if (status === 400 || status === 413 || status === 415) return 'invalid';
  if (status === 429) return 'rate_limited';
  if ([404, 405, 501, 503].includes(status)) return 'unavailable';
  return 'failed';
}

/** Posts a message and says how it went. Never throws. */
export async function send(
  endpoint: string,
  body: ReturnType<typeof payload>,
  request: typeof fetch = fetch,
): Promise<Outcome> {
  let response: Response;
  try {
    response = await request(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch {
    return 'failed';
  }
  const json: unknown = await response.json().catch(() => null);
  return outcomeOf(response.status, json);
}
