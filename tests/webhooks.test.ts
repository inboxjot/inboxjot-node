import {
  afterEach,
  describe,
  expect,
  expectTypeOf,
  it,
  vi,
} from 'vite-plus/test';

import { Inboxjot, verifyWebhook, WebhookVerificationError } from '../src';
import type { components, WebhookEvent } from '../src';
import { createClient, json, mockFetch, readRoutes } from './fetch';

type Schemas = components['schemas'];

const SECRET = 'whsec_MfKQ9r8GKYqrTwjUPD8ILPZIo2LaLaSw';
const OTHER_SECRET = 'whsec_3kTmPqZ8vXw2RbN7cYhJ4dLsF9gA6eUu';
const ID = 'msg_p5jXN8AQM9LWM0D4loKWxJek';
const TIMESTAMP = 1_614_265_330;
const PAYLOAD = '{"test": 2432232314}';
const SIGNATURE = 'v1,g0hM9SsE+OTPJTGt/tmIKtSyZlE3uFJELVlNIOLJ1OE=';

function createHeaders(signature = SIGNATURE, timestamp = TIMESTAMP) {
  return {
    'webhook-id': ID,
    'webhook-timestamp': String(timestamp),
    'webhook-signature': signature,
  };
}

async function sign(
  secret: string,
  id: string,
  timestamp: number,
  payload: string
) {
  const secretText = atob(secret.replace(/^whsec_/, ''));
  const secretBytes = Uint8Array.from(secretText, (char) => char.charCodeAt(0));
  const key = await crypto.subtle.importKey(
    'raw',
    secretBytes,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const content = new TextEncoder().encode(`${id}.${timestamp}.${payload}`);
  const mac = await crypto.subtle.sign('HMAC', key, content);
  const macText = String.fromCharCode(...new Uint8Array(mac));

  return `v1,${btoa(macText)}`;
}

describe('Webhooks', () => {
  it('maps each method to its route', async () => {
    const fetch = mockFetch(...Array.from({ length: 5 }, () => json({})));
    const { webhooks } = createClient(fetch);

    await webhooks.list({ per_page: 10 });
    await webhooks.create({
      name: 'Prod',
      url: 'https://acme.dev/hook',
      events: ['email.sent'],
    });
    await webhooks.get('wh_1');
    await webhooks.update('wh_1', { status: 'disabled' });
    await webhooks.delete('wh_1');

    expect(readRoutes(fetch)).toEqual([
      'GET https://api.test/v1/webhooks?per_page=10',
      'POST https://api.test/v1/webhooks',
      'GET https://api.test/v1/webhooks/wh_1',
      'PATCH https://api.test/v1/webhooks/wh_1',
      'DELETE https://api.test/v1/webhooks/wh_1',
    ]);
  });

  it('takes its types from the spec', () => {
    const { webhooks } = createClient(mockFetch());

    expectTypeOf(webhooks.list).returns.resolves.toEqualTypeOf<
      Schemas['PublicEndpointPage']
    >();
    expectTypeOf(webhooks.create)
      .parameter(0)
      .toEqualTypeOf<Schemas['EndpointBody']>();
    expectTypeOf(webhooks.create).returns.resolves.toEqualTypeOf<
      Schemas['PublicCreatedWebhookEndpoint']
    >();
    expectTypeOf(webhooks.get).returns.resolves.toEqualTypeOf<
      Schemas['PublicEndpointDetail']
    >();
    expectTypeOf(webhooks.update)
      .parameter(1)
      .toEqualTypeOf<Schemas['EndpointChangesBody']>();
    expectTypeOf(webhooks.update).returns.resolves.toEqualTypeOf<
      Schemas['PublicWebhookEndpoint']
    >();
    expectTypeOf(webhooks.delete).returns.resolves.toEqualTypeOf<
      Schemas['StatusOk']
    >();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('verifies the Standard Webhooks test vector', async () => {
    vi.useFakeTimers({ now: TIMESTAMP * 1000 });

    const event = await verifyWebhook({
      payload: PAYLOAD,
      headers: createHeaders(),
      secret: SECRET,
    });

    expect(event).toEqual({ test: 2432232314 });
  });

  it('matches the signature the API produces', async () => {
    expect(await sign(SECRET, ID, TIMESTAMP, PAYLOAD)).toBe(SIGNATURE);
  });

  it('accepts a Headers object and several signatures', async () => {
    vi.useFakeTimers({ now: TIMESTAMP * 1000 });
    const headers = new Headers(
      createHeaders(`v1,bm90IGl0 v2,abc ${SIGNATURE}`)
    );

    const { webhooks } = new Inboxjot({ apiKey: 'ibx_test' });

    const event = await webhooks.verify({
      payload: PAYLOAD,
      headers,
      secret: SECRET,
    });

    expect(event).toEqual({ test: 2432232314 });
  });

  it('verifies a freshly signed payload', async () => {
    const now = Math.floor(Date.now() / 1000);
    const signature = await sign(OTHER_SECRET, 'evt_1', now, '{}');
    const headers = {
      'webhook-id': 'evt_1',
      'webhook-timestamp': String(now),
      'webhook-signature': signature,
    };

    await expect(
      verifyWebhook({ payload: '{}', headers, secret: OTHER_SECRET })
    ).resolves.toEqual({});
  });

  it('rejects a changed payload', async () => {
    vi.useFakeTimers({ now: TIMESTAMP * 1000 });

    const request = verifyWebhook({
      payload: '{"test": 1}',
      headers: createHeaders(),
      secret: SECRET,
    });

    await expect(request).rejects.toThrow('No matching signature found');
  });

  it('rejects a wrong secret', async () => {
    vi.useFakeTimers({ now: TIMESTAMP * 1000 });

    const request = verifyWebhook({
      payload: PAYLOAD,
      headers: createHeaders(),
      secret: OTHER_SECRET,
    });

    await expect(request).rejects.toBeInstanceOf(WebhookVerificationError);
  });

  it('rejects an old timestamp', async () => {
    vi.useFakeTimers({ now: (TIMESTAMP + 301) * 1000 });

    const request = verifyWebhook({
      payload: PAYLOAD,
      headers: createHeaders(),
      secret: SECRET,
    });

    await expect(request).rejects.toThrow('outside the tolerance');
  });

  it('rejects missing headers', async () => {
    const request = verifyWebhook({
      payload: PAYLOAD,
      headers: {},
      secret: SECRET,
    });

    await expect(request).rejects.toThrow('Missing webhook headers');
  });

  it('rejects a bad signature through webhooks.verify', async () => {
    vi.useFakeTimers({ now: TIMESTAMP * 1000 });
    const { webhooks } = new Inboxjot({ apiKey: 'ibx_test' });

    const request = webhooks.verify({
      payload: PAYLOAD,
      headers: createHeaders('v1,bm90IGl0'),
      secret: SECRET,
    });

    await expect(request).rejects.toThrow('No matching signature found');
  });

  it('narrows the event data by type', () => {
    const readDetail = (event: WebhookEvent) => {
      switch (event.type) {
        case 'email.bounced':
          expectTypeOf(event.data.bounce.type).toEqualTypeOf<
            'permanent' | 'transient' | 'undetermined'
          >();
          return event.data.bounce.message;

        case 'email.opened':
          expectTypeOf(event.data.actor).toEqualTypeOf<
            'human' | 'apple_mpp' | 'scanner' | 'unknown'
          >();
          return event.data.actor;

        case 'email.clicked':
          expectTypeOf(event.data.link).toEqualTypeOf<string | undefined>();
          return event.data.link;

        case 'email.complained':
          expectTypeOf(event.data.complaint.type).toEqualTypeOf<'abuse'>();
          return event.data.complaint.type;

        case 'email.failed':
        case 'email.rejected':
          return event.data.reason;

        case 'contact.created':
          expectTypeOf(event.data).not.toHaveProperty('email_id');
          return event.data.contact_id;

        case 'email.sent':
          expectTypeOf(event.data).not.toHaveProperty('bounce');
          return event.data.email_id;
      }
    };

    const failedEvent: WebhookEvent = {
      id: 'evt_1',
      created_at: '2026-10-17T00:00:00Z',
      type: 'email.failed',
      data: {
        email_id: 'em_1',
        to: ['a@b.c'],
        from: 'f@b.c',
        subject: 'S',
        reason: 'Bad',
      },
    };

    expect(readDetail(failedEvent)).toBe('Bad');
  });
});
