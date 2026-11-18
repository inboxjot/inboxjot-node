import { describe, expect, expectTypeOf, it } from 'vite-plus/test';

import type { components } from '../src';
import { createClient, json, mockFetch, readCall, readRoutes } from './fetch';

type Schemas = components['schemas'];

describe('Brands', () => {
  it('maps each method to its route', async () => {
    const fetch = mockFetch(...Array.from({ length: 5 }, () => json({})));
    const { brands } = createClient(fetch);

    await brands.list({ after: 'cur_1' });
    await brands.create({ name: 'Acme' }, { idempotencyKey: 'key-1' });
    await brands.get('br_1');
    await brands.update('br_1', { name: 'Acme News' });
    await brands.delete('br_1');

    expect(readRoutes(fetch)).toEqual([
      'GET https://api.test/v1/brands?after=cur_1',
      'POST https://api.test/v1/brands',
      'GET https://api.test/v1/brands/br_1',
      'PATCH https://api.test/v1/brands/br_1',
      'DELETE https://api.test/v1/brands/br_1',
    ]);
    expect(readCall(fetch, 1).init.headers['Idempotency-Key']).toBe('key-1');
  });

  it('takes its types from the spec', () => {
    const { brands } = createClient(mockFetch());

    expectTypeOf(brands.list).returns.resolves.toEqualTypeOf<
      Schemas['BrandPage']
    >();
    expectTypeOf(brands.create)
      .parameter(0)
      .toEqualTypeOf<Schemas['BrandBody']>();
    expectTypeOf(brands.get).returns.resolves.toEqualTypeOf<Schemas['Brand']>();
    expectTypeOf(brands.update)
      .parameter(1)
      .toEqualTypeOf<Schemas['BrandBody']>();
    expectTypeOf(brands.delete).returns.resolves.toEqualTypeOf<
      Schemas['StatusOk']
    >();
  });
});
