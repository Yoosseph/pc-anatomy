import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  buildEmail,
  createLimiter,
  escapeHtml,
  handle,
  KINDS as SERVER_KINDS,
  LIMITS as SERVER_LIMITS,
  MAX_BODY_BYTES,
  sender,
  validate,
  type Deps,
  type Feedback,
} from '../api/contact.ts';
import {
  EMPTY_DRAFT,
  KINDS as CLIENT_KINDS,
  KIND_LABELS,
  LIMITS as CLIENT_LIMITS,
  outcomeOf,
  payload,
  send,
} from '../app/feedback.ts';

// The feedback function is the one piece of the project that runs on a
// server and the one piece that touches a secret. Resend is replaced by a
// fake fetch, so nothing here sends mail.

const GOOD = {
  kind: 'issue',
  name: 'Ada',
  email: 'ada@example.com',
  message: 'The GB202 has 192 SMs, not 190.',
  page: 'https://pc-anatomy.com/gpu',
  selection: 'GB202',
  language: 'en',
};

type Call = { url: string; init: RequestInit; body: Record<string, unknown> };

function deps(overrides: Partial<Deps> = {}, status = 200) {
  const calls: Call[] = [];
  const fake = (async (url: string, init: RequestInit) => {
    calls.push({ url, init, body: JSON.parse(init.body as string) });
    return new Response(JSON.stringify({ id: 'x' }), { status });
  }) as typeof fetch;
  const d: Deps = {
    env: { RESEND_API_KEY: 're_test', CONTACT_TO_EMAIL: 'owner@example.com' },
    fetch: fake,
    now: () => 0,
    allow: () => true,
    ...overrides,
  };
  return { d, calls };
}

function post(
  body: unknown,
  headers: Record<string, string> = {},
  method = 'POST',
) {
  const init: RequestInit = {
    method,
    headers: {
      host: 'pc-anatomy.com',
      origin: 'https://pc-anatomy.com',
      'content-type': 'application/json',
      'x-forwarded-for': '10.0.0.1',
      ...headers,
    },
  };
  if (method !== 'GET')
    init.body = typeof body === 'string' ? body : JSON.stringify(body);
  return new Request('https://pc-anatomy.com/api/contact', init);
}

/* ------------------------------------------------------------ validation */

await test('validate accepts a complete message and cleans it', () => {
  const r = validate({
    ...GOOD,
    name: '  Ada\nLovelace ',
    message: 'a\r\nbcdefghij',
  });
  assert.ok(r.ok);
  assert.equal(r.value.name, 'Ada Lovelace');
  assert.equal(r.value.message, 'a\nbcdefghij');
});

await test('validate allows name and email to be left out', () => {
  const r = validate({ kind: 'idea', message: 'A longer message here' });
  assert.ok(r.ok);
  assert.equal(r.value.name, '');
  assert.equal(r.value.email, '');
});

await test('validate names every bad field', () => {
  const r = validate({
    kind: 'complaint',
    name: 'x'.repeat(SERVER_LIMITS.name + 1),
    email: 'not-an-address',
    message: 'short',
  });
  assert.equal(r.ok, false);
  assert.deepEqual(!r.ok && r.fields, ['kind', 'name', 'email', 'message']);
});

await test('validate enforces the message length at both ends', () => {
  const at = (n: number) => validate({ ...GOOD, message: 'm'.repeat(n) }).ok;
  assert.equal(at(SERVER_LIMITS.messageMin - 1), false);
  assert.equal(at(SERVER_LIMITS.messageMin), true);
  assert.equal(at(SERVER_LIMITS.messageMax), true);
  assert.equal(at(SERVER_LIMITS.messageMax + 1), false);
});

await test('validate drops bad context instead of refusing the message', () => {
  const r = validate({
    ...GOOD,
    page: 'javascript:alert(1)',
    selection: 's'.repeat(500),
  });
  assert.ok(r.ok);
  assert.equal(r.value.page, '');
  assert.equal(r.value.selection.length, SERVER_LIMITS.selection);
});

await test('validate refuses something that is not an object', () => {
  for (const body of [null, 'text', 3, ['a']])
    assert.equal(validate(body).ok, false);
});

/* ----------------------------------------------------------------- email */

const feedback = (over: Partial<Feedback> = {}): Feedback => ({
  kind: 'issue',
  name: 'Ada',
  email: 'ada@example.com',
  message: 'The GB202 has 192 SMs, not 190.',
  page: 'https://pc-anatomy.com/gpu',
  selection: 'GB202',
  language: 'en',
  ...over,
});

await test('buildEmail labels the message for a shared Resend account', () => {
  const e = buildEmail(feedback(), { to: 'owner@example.com' });
  assert.equal(e.from, 'PC Anatomy <onboarding@resend.dev>');
  assert.deepEqual(e.to, ['owner@example.com']);
  assert.equal(
    e.subject,
    '[PC Anatomy] Issue from Ada: The GB202 has 192 SMs, not 190.',
  );
  assert.deepEqual(e.tags, [
    { name: 'source', value: 'pc-anatomy' },
    { name: 'kind', value: 'issue' },
  ]);
  assert.equal(e.reply_to, 'ada@example.com');
  for (const part of [
    'Type: Issue',
    'Page: https://pc-anatomy.com/gpu',
    'Selection: GB202',
    'Language: en',
  ])
    assert.ok(e.text.includes(part), part);
  assert.ok(e.text.endsWith('The GB202 has 192 SMs, not 190.'));
  assert.ok(e.html.includes('<table'));
});

await test('buildEmail keeps the subject to one line and 60 characters of message', () => {
  const e = buildEmail(
    feedback({
      kind: 'idea',
      name: '',
      email: '',
      message: 'line one\nline two ' + 'x'.repeat(100),
    }),
    { to: 'o@example.com' },
  );
  assert.ok(!/[\r\n]/.test(e.subject));
  assert.ok(
    e.subject.startsWith('[PC Anatomy] Idea from anonymous: line one line two'),
  );
  assert.equal(e.subject.split(': ').slice(1).join(': ').length, 60);
  assert.equal(e.reply_to, undefined);
});

await test('buildEmail escapes everything a visitor typed in the HTML part', () => {
  const e = buildEmail(
    feedback({
      name: '<b>Eve</b>',
      message: '<script>alert("x")</script> & more',
    }),
    { to: 'o@example.com' },
  );
  assert.ok(!e.html.includes('<script>'));
  assert.ok(!e.html.includes('<b>Eve'));
  assert.ok(
    e.html.includes(
      '&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt; &amp; more',
    ),
  );
  assert.equal(escapeHtml(`'`), '&#39;');
});

await test('sender wraps a bare address and keeps a full one', () => {
  assert.equal(sender(undefined), 'PC Anatomy <onboarding@resend.dev>');
  assert.equal(sender(' '), 'PC Anatomy <onboarding@resend.dev>');
  assert.equal(
    sender('feedback@pc-anatomy.com'),
    'PC Anatomy <feedback@pc-anatomy.com>',
  );
  assert.equal(sender('Site <a@b.com>'), 'Site <a@b.com>');
});

/* --------------------------------------------------------------- handler */

await test('handle sends a valid message through Resend', async () => {
  const { d, calls } = deps({
    env: {
      RESEND_API_KEY: 're_test',
      CONTACT_TO_EMAIL: 'owner@example.com',
      CONTACT_FROM_EMAIL: 'feedback@pc-anatomy.com',
    },
  });
  const res = await handle(post(GOOD), d);
  assert.equal(res.status, 200);
  assert.deepEqual(await res.json(), { ok: true });
  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, 'https://api.resend.com/emails');
  assert.equal(
    new Headers(calls[0].init.headers).get('authorization'),
    'Bearer re_test',
  );
  assert.equal(calls[0].body.from, 'PC Anatomy <feedback@pc-anatomy.com>');
  assert.deepEqual(calls[0].body.to, ['owner@example.com']);
});

await test('handle answers 405 to anything but POST', async () => {
  const { d } = deps();
  assert.equal((await handle(post(null, {}, 'GET'), d)).status, 405);
});

await test('handle answers 503 not_configured without the key or the inbox', async () => {
  for (const env of [
    { CONTACT_TO_EMAIL: 'o@example.com' },
    { RESEND_API_KEY: 're' },
    {},
  ]) {
    const { d, calls } = deps({ env });
    const res = await handle(post(GOOD), d);
    assert.equal(res.status, 503);
    assert.deepEqual(await res.json(), { error: 'not_configured' });
    assert.equal(calls.length, 0);
  }
});

await test('handle answers 403 to another origin or none', async () => {
  const { d, calls } = deps();
  assert.equal(
    (await handle(post(GOOD, { origin: 'https://evil.example' }), d)).status,
    403,
  );
  assert.equal((await handle(post(GOOD, { origin: 'null' }), d)).status, 403);
  const none = post(GOOD);
  none.headers.delete('origin');
  assert.equal((await handle(none, d)).status, 403);
  assert.equal(calls.length, 0);
});

await test('handle trusts X-Forwarded-Host behind a proxy', async () => {
  const { d } = deps();
  const res = await handle(
    post(GOOD, { host: 'internal:3000', 'x-forwarded-host': 'pc-anatomy.com' }),
    d,
  );
  assert.equal(res.status, 200);
});

await test('handle answers 415 to anything but JSON', async () => {
  const { d } = deps();
  const res = await handle(
    post('kind=issue', { 'content-type': 'application/x-www-form-urlencoded' }),
    d,
  );
  assert.equal(res.status, 415);
});

await test('handle answers 413 to a body over the limit', async () => {
  const { d, calls } = deps();
  const big = JSON.stringify({ ...GOOD, message: 'x'.repeat(MAX_BODY_BYTES) });
  assert.equal((await handle(post(big), d)).status, 413);
  assert.equal(calls.length, 0);
});

await test('handle answers 400 with the bad fields', async () => {
  const { d, calls } = deps();
  const bad = await handle(post({ ...GOOD, message: 'short' }), d);
  assert.equal(bad.status, 400);
  assert.deepEqual(await bad.json(), { error: 'invalid', fields: ['message'] });
  assert.equal((await handle(post('{not json'), d)).status, 400);
  assert.equal(calls.length, 0);
});

await test('handle pretends to send when the honeypot is filled', async () => {
  const { d, calls } = deps();
  const res = await handle(
    post({ ...GOOD, website: 'http://spam.example' }),
    d,
  );
  assert.equal(res.status, 200);
  assert.deepEqual(await res.json(), { ok: true });
  assert.equal(calls.length, 0);
});

await test('handle answers 429 when the address has sent too many', async () => {
  const { d, calls } = deps({ allow: createLimiter(2, 60_000) });
  assert.equal((await handle(post(GOOD), d)).status, 200);
  assert.equal((await handle(post(GOOD), d)).status, 200);
  const third = await handle(post(GOOD), d);
  assert.equal(third.status, 429);
  assert.deepEqual(await third.json(), { error: 'rate_limited' });
  assert.equal(calls.length, 2);
  // Another address is not held back.
  assert.equal(
    (await handle(post(GOOD, { 'x-forwarded-for': '10.0.0.2' }), d)).status,
    200,
  );
});

await test('handle answers 502 and logs Resend’s reason when the send fails', async () => {
  const logged: unknown[][] = [];
  const original = console.error;
  console.error = (...args: unknown[]) => logged.push(args);
  try {
    const { d } = deps({}, 403);
    const res = await handle(post(GOOD), d);
    assert.equal(res.status, 502);
    assert.deepEqual(await res.json(), { error: 'send_failed' });
    assert.equal(logged[0][1], 403);
    assert.match(String(logged[0][2]), /"id"/);

    const offline = deps({
      fetch: (async () => {
        throw new Error('offline');
      }) as typeof fetch,
    }).d;
    assert.equal((await handle(post(GOOD), offline)).status, 502);
  } finally {
    console.error = original;
  }
});

/* --------------------------------------------------------------- limiter */

await test('the limiter lets a burst through, then waits out the window', () => {
  const allow = createLimiter(5, 10 * 60_000);
  for (let i = 0; i < 5; i++) assert.equal(allow('a', i), true);
  assert.equal(allow('a', 10), false);
  assert.equal(allow('b', 10), true);
  assert.equal(allow('a', 10 * 60_000 + 5), true);
});

/* ---------------------------------------------------------------- client */

await test('client and server agree on limits and kinds', () => {
  assert.deepEqual(CLIENT_LIMITS, SERVER_LIMITS);
  assert.deepEqual(CLIENT_KINDS, SERVER_KINDS);
});

await test('every kind has a label, and none is empty', () => {
  for (const kind of CLIENT_KINDS) assert.ok(KIND_LABELS[kind]?.trim());
});

await test('outcomeOf maps every response the form can meet', () => {
  assert.equal(outcomeOf(200, { ok: true }), 'sent');
  // A static host answering every path with the app shell.
  assert.equal(outcomeOf(200, null), 'unavailable');
  assert.equal(outcomeOf(200, { ok: 'yes' }), 'unavailable');
  for (const s of [400, 413, 415]) assert.equal(outcomeOf(s, {}), 'invalid');
  assert.equal(outcomeOf(429, {}), 'rate_limited');
  for (const s of [404, 405, 501, 503])
    assert.equal(outcomeOf(s, null), 'unavailable');
  for (const s of [403, 500, 502]) assert.equal(outcomeOf(s, {}), 'failed');
});

await test('send reports a network error as failed and HTML as unavailable', async () => {
  const body = payload(
    { ...EMPTY_DRAFT, message: 'hello there world' },
    { page: '', selection: '', language: 'en' },
  );
  const offline = (async () => {
    throw new TypeError('offline');
  }) as typeof fetch;
  assert.equal(await send('/api/contact', body, offline), 'failed');
  const shell = (async () =>
    new Response('<!doctype html>', { status: 200 })) as typeof fetch;
  assert.equal(await send('/api/contact', body, shell), 'unavailable');
});

await test('a payload built by the form passes the server’s validation', () => {
  const body = payload(
    {
      ...EMPTY_DRAFT,
      kind: 'idea',
      name: ' Ada ',
      email: 'ada@example.com',
      message: '  Please add a sound card.  ',
    },
    {
      page: 'https://pc-anatomy.com/',
      selection: 'Desktop PC',
      language: 'en',
    },
  );
  assert.equal(body.name, 'Ada');
  assert.equal(body.message, 'Please add a sound card.');
  assert.ok(validate(body).ok);
});
