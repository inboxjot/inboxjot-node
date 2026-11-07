import { describe, expect, expectTypeOf, it } from 'vite-plus/test';

import type { components } from '../src';
import { createClient, json, mockFetch, readCall, readRoutes } from './fetch';

type Schemas = components['schemas'];

describe('Segments', () => {
  it('maps each method to its route', async () => {
    const fetch = mockFetch(...Array.from({ length: 8 }, () => json({})));
    const { segments } = createClient(fetch);

    await segments.list({ type: 'static' });
    await segments.create({ name: 'Beta', type: 'static' });
    await segments.get('seg_1');
    await segments.update('seg_1', { name: 'Alpha' });
    await segments.delete('seg_1');
    await segments.listMembers('seg_1', { query: 'riti' });
    await segments.addMembers('seg_1', { contact_ids: ['con_1'] });
    await segments.removeMembers('seg_1', { contact_ids: ['con_1'] });

    expect(readRoutes(fetch)).toEqual([
      'GET https://api.test/v1/segments?type=static',
      'POST https://api.test/v1/segments',
      'GET https://api.test/v1/segments/seg_1',
      'PATCH https://api.test/v1/segments/seg_1',
      'DELETE https://api.test/v1/segments/seg_1',
      'GET https://api.test/v1/segments/seg_1/members?query=riti',
      'POST https://api.test/v1/segments/seg_1/members',
      'DELETE https://api.test/v1/segments/seg_1/members',
    ]);
  });

  it('sends removeMembers as a DELETE with a json body', async () => {
    const fetch = mockFetch(json({ removed: 1 }));

    await createClient(fetch).segments.removeMembers('seg_1', {
      contact_ids: ['con_1'],
    });

    const { init } = readCall(fetch);
    expect(init.headers['Content-Type']).toBe('application/json');
    expect(JSON.parse(init.body as string)).toEqual({ contact_ids: ['con_1'] });
  });

  it('takes its types from the spec', () => {
    const { segments } = createClient(mockFetch());

    expectTypeOf(segments.list).returns.resolves.toEqualTypeOf<
      Schemas['PublicSegmentPage']
    >();
    expectTypeOf(segments.create)
      .parameter(0)
      .toEqualTypeOf<Schemas['SegmentInput']>();
    expectTypeOf(segments.update)
      .parameter(1)
      .toEqualTypeOf<Schemas['UpdateSegmentBody']>();
    expectTypeOf(segments.listMembers).returns.resolves.toEqualTypeOf<
      Schemas['SegmentMemberPage']
    >();
    expectTypeOf(segments.addMembers).returns.resolves.toEqualTypeOf<
      Schemas['Added']
    >();
    expectTypeOf(segments.removeMembers)
      .parameter(1)
      .toEqualTypeOf<Schemas['ContactIdsBody']>();
    expectTypeOf(segments.removeMembers).returns.resolves.toEqualTypeOf<
      Schemas['Removed']
    >();
  });
});
