import { describe, expect, expectTypeOf, it } from 'vite-plus/test';

import type { components } from '../src';
import { createClient, json, mockFetch, readCall, readRoutes } from './fetch';

type Schemas = components['schemas'];

describe('Emails', () => {
  it('sends an email with auth, json body and idempotency key', async () => {
    const fetch = mockFetch(json({ id: 'em_1' }, 202));
    const email = {
      from: 'Acme <hi@acme.dev>',
      to: 'jane@acme.dev',
      subject: 'Hi',
      html: '<p>Hi</p>',
    };

    const result = await createClient(fetch).emails.send(email, {
      idempotencyKey: 'key-1',
    });
    expect(result).toEqual({ id: 'em_1' });

    const { url, init } = readCall(fetch);
    expect(url).toBe('https://api.test/v1/emails');
    expect(init.method).toBe('POST');
    expect(init.headers.Authorization).toBe('Bearer ibx_test');
    expect(init.headers['Content-Type']).toBe('application/json');
    expect(init.headers['Idempotency-Key']).toBe('key-1');
    expect(JSON.parse(init.body as string)).toEqual(email);
  });

  it('maps each method to its route', async () => {
    const replies = Array.from({ length: 7 }, () => json({}));
    const fetch = mockFetch(...replies);
    const inboxjot = createClient(fetch);

    await inboxjot.emails.list();
    await inboxjot.emails.batch([
      { from: 'a@acme.dev', to: ['b@acme.dev'], subject: 'S', text: 'T' },
    ]);
    await inboxjot.emails.get('em_1');
    await inboxjot.emails.update('em_1', {
      scheduled_at: '2026-10-20T09:00:00Z',
    });
    await inboxjot.emails.cancel('em_1');
    await inboxjot.emails.listAttachments('em_1');
    await inboxjot.emails.getAttachment('em_1', 'att 1');

    expect(readRoutes(fetch)).toEqual([
      'GET https://api.test/v1/emails',
      'POST https://api.test/v1/emails/batch',
      'GET https://api.test/v1/emails/em_1',
      'PATCH https://api.test/v1/emails/em_1',
      'POST https://api.test/v1/emails/em_1/cancel',
      'GET https://api.test/v1/emails/em_1/attachments',
      'GET https://api.test/v1/emails/em_1/attachments/att%201',
    ]);
  });

  it('sends list filters as query params and skips unset ones', async () => {
    const fetch = mockFetch(
      json({ data: [], next_cursor: null, prev_cursor: null })
    );
    await createClient(fetch).emails.list({
      source: 'api',
      direction: 'desc',
      per_page: 10,
      after: undefined,
    });

    const { url } = readCall(fetch);
    expect(url).toBe(
      'https://api.test/v1/emails?source=api&direction=desc&per_page=10'
    );
  });

  it('sends no body on reads', async () => {
    const fetch = mockFetch(json({}));
    await createClient(fetch).emails.getAttachment('em_1', 'att_1');

    const { init } = readCall(fetch);
    expect(init.body).toBeUndefined();
    expect(init.headers['Content-Type']).toBeUndefined();
    expect(init.headers['Idempotency-Key']).toBeUndefined();
  });

  it('takes its types from the spec', () => {
    const { emails } = createClient(mockFetch());

    expectTypeOf(emails.list).returns.resolves.toEqualTypeOf<
      Schemas['EmailPage']
    >();
    expectTypeOf(emails.get).returns.resolves.toEqualTypeOf<
      Schemas['ApiEmail']
    >();
    expectTypeOf(emails.send)
      .parameter(0)
      .toEqualTypeOf<Schemas['SendEmailBody']>();
    expectTypeOf(emails.update)
      .parameter(1)
      .toEqualTypeOf<Schemas['RescheduleBody']>();
    expectTypeOf(emails.listAttachments).returns.resolves.toEqualTypeOf<
      Schemas['AttachmentList']
    >();
  });
});
