import { describe, expect, expectTypeOf, it } from 'vite-plus/test';

import type { components } from '../src';
import { createClient, json, mockFetch, readRoutes } from './fetch';

type Schemas = components['schemas'];

describe('Domains', () => {
  it('maps each method to its route', async () => {
    const fetch = mockFetch(...Array.from({ length: 5 }, () => json({})));
    const { domains } = createClient(fetch);

    await domains.list({ per_page: 5 });
    await domains.create({ name: 'acme.dev' });
    await domains.get('dom_1');
    await domains.delete('dom_1');
    await domains.verify('dom_1');

    expect(readRoutes(fetch)).toEqual([
      'GET https://api.test/v1/domains?per_page=5',
      'POST https://api.test/v1/domains',
      'GET https://api.test/v1/domains/dom_1',
      'DELETE https://api.test/v1/domains/dom_1',
      'POST https://api.test/v1/domains/dom_1/verify',
    ]);
  });

  it('takes its types from the spec', () => {
    const { domains } = createClient(mockFetch());

    expectTypeOf(domains.list).returns.resolves.toEqualTypeOf<
      Schemas['DomainPage']
    >();
    expectTypeOf(domains.create)
      .parameter(0)
      .toEqualTypeOf<Schemas['CreateDomainBody']>();
    expectTypeOf(domains.get).returns.resolves.toEqualTypeOf<
      Schemas['PublicDomainDetail']
    >();
    expectTypeOf(domains.delete).returns.resolves.toEqualTypeOf<
      Schemas['StatusOk']
    >();
    expectTypeOf(domains.verify).returns.resolves.toEqualTypeOf<
      Schemas['PublicDomainDetail']
    >();
  });
});
