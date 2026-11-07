import { describe, expect, expectTypeOf, it } from 'vite-plus/test';

import type { components } from '../src';
import { createClient, json, mockFetch, readCall, readRoutes } from './fetch';

type Schemas = components['schemas'];

describe('Campaigns', () => {
  it('maps each method to its route', async () => {
    const fetch = mockFetch(...Array.from({ length: 14 }, () => json({})));
    const { campaigns } = createClient(fetch);

    await campaigns.list({ status: 'draft', per_page: 10 });
    await campaigns.create({ name: 'October' });
    await campaigns.get('cmp_1');
    await campaigns.update('cmp_1', { subject: 'Hi' });
    await campaigns.delete('cmp_1');
    await campaigns.send('cmp_1');
    await campaigns.send('cmp_1', { scheduled_at: '2026-10-20T09:00:00Z' });
    await campaigns.cancel('cmp_1');
    await campaigns.sendTest('cmp_1', { to: ['a@acme.dev'] });
    await campaigns.listVersions('cmp_1', { filter: 'saved' });
    await campaigns.createVersion('cmp_1', { name: 'v1' });
    await campaigns.getVersion('cmp_1', 'ver 1');
    await campaigns.updateVersion('cmp_1', 'ver_1', { name: null });
    await campaigns.restoreVersion('cmp_1', 'ver_1');

    expect(readRoutes(fetch)).toEqual([
      'GET https://api.test/v1/campaigns?status=draft&per_page=10',
      'POST https://api.test/v1/campaigns',
      'GET https://api.test/v1/campaigns/cmp_1',
      'PATCH https://api.test/v1/campaigns/cmp_1',
      'DELETE https://api.test/v1/campaigns/cmp_1',
      'POST https://api.test/v1/campaigns/cmp_1/send',
      'POST https://api.test/v1/campaigns/cmp_1/send',
      'POST https://api.test/v1/campaigns/cmp_1/cancel',
      'POST https://api.test/v1/campaigns/cmp_1/test',
      'GET https://api.test/v1/campaigns/cmp_1/versions?filter=saved',
      'POST https://api.test/v1/campaigns/cmp_1/versions',
      'GET https://api.test/v1/campaigns/cmp_1/versions/ver%201',
      'PATCH https://api.test/v1/campaigns/cmp_1/versions/ver_1',
      'POST https://api.test/v1/campaigns/cmp_1/versions/ver_1/restore',
    ]);
    expect(readCall(fetch, 5).init.body).toBe('{}');
  });

  it('takes its types from the spec', () => {
    const { campaigns } = createClient(mockFetch());

    expectTypeOf(campaigns.list).returns.resolves.toEqualTypeOf<
      Schemas['CampaignPage']
    >();
    expectTypeOf(campaigns.create)
      .parameter(0)
      .toEqualTypeOf<Schemas['ApiCampaignBody']>();
    expectTypeOf(campaigns.get).returns.resolves.toEqualTypeOf<
      Schemas['PublicCampaignDetail']
    >();
    expectTypeOf(campaigns.delete).returns.resolves.toEqualTypeOf<
      Schemas['StatusOk']
    >();
    expectTypeOf(campaigns.send)
      .parameter(1)
      .toEqualTypeOf<Schemas['SendBody'] | undefined>();
    expectTypeOf(campaigns.sendTest).returns.resolves.toEqualTypeOf<
      Schemas['QueuedIds']
    >();
    expectTypeOf(campaigns.listVersions).returns.resolves.toEqualTypeOf<
      Schemas['DocumentVersionPage']
    >();
    expectTypeOf(campaigns.getVersion).returns.resolves.toEqualTypeOf<
      Schemas['DocumentVersionDetail']
    >();
    expectTypeOf(campaigns.updateVersion)
      .parameter(2)
      .toEqualTypeOf<Schemas['NameVersionBody']>();
    expectTypeOf(campaigns.restoreVersion).returns.resolves.toEqualTypeOf<
      Schemas['PublicCampaignDetail']
    >();
  });
});
