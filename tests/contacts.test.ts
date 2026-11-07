import { describe, expect, expectTypeOf, it } from 'vite-plus/test';

import type { components } from '../src';
import { createClient, json, mockFetch, readCall, readRoutes } from './fetch';

type Schemas = components['schemas'];

describe('Contacts', () => {
  it('maps each method to its route', async () => {
    const replies = Array.from({ length: 6 }, () => json({}));
    const fetch = mockFetch(...replies);
    const inboxjot = createClient(fetch);

    await inboxjot.contacts.list({ status: 'subscribed', segment_id: 'sg_1' });
    await inboxjot.contacts.create({
      email: 'jane@acme.dev',
      first_name: 'Jane',
    });
    await inboxjot.contacts.get('ct_1');
    await inboxjot.contacts.update('ct_1', {
      last_name: 'Doe',
      topics: [{ id: 'tp_1', status: 'unsubscribed' }],
    });
    await inboxjot.contacts.delete('ct_1');
    await inboxjot.contacts.erase(
      { email: 'jane@acme.dev' },
      { idempotencyKey: 'key-1' }
    );

    expect(readRoutes(fetch)).toEqual([
      'GET https://api.test/v1/contacts?status=subscribed&segment_id=sg_1',
      'POST https://api.test/v1/contacts',
      'GET https://api.test/v1/contacts/ct_1',
      'PATCH https://api.test/v1/contacts/ct_1',
      'DELETE https://api.test/v1/contacts/ct_1',
      'POST https://api.test/v1/contacts/erase',
    ]);
    expect(readCall(fetch, 5).init.headers['Idempotency-Key']).toBe('key-1');
    expect(readCall(fetch, 5).init.body).toBe(
      JSON.stringify({ email: 'jane@acme.dev' })
    );
  });

  it('takes its types from the spec', () => {
    const { contacts } = createClient(mockFetch());

    expectTypeOf(contacts.list).returns.resolves.toEqualTypeOf<
      Schemas['ContactListPage']
    >();
    expectTypeOf(contacts.create).returns.resolves.toEqualTypeOf<
      Schemas['SavedContact']
    >();
    expectTypeOf(contacts.update)
      .parameter(1)
      .toEqualTypeOf<Schemas['UpdateContactBody']>();
    expectTypeOf(contacts.delete).returns.resolves.toEqualTypeOf<
      Schemas['StatusOk']
    >();
    expectTypeOf(contacts.erase)
      .parameter(0)
      .toEqualTypeOf<Schemas['EraseContactBody']>();
    expectTypeOf(contacts.erase).returns.resolves.toEqualTypeOf<
      Schemas['ErasureQueued']
    >();
  });
});
