import { describe, expect, expectTypeOf, it } from 'vite-plus/test';

import type { components } from '../src';
import { createClient, json, mockFetch, readRoutes } from './fetch';

describe('Events', () => {
  it('maps send to its route', async () => {
    const fetch = mockFetch(json({}));
    const event = {
      name: 'signed_up',
      email: 'jane@acme.dev',
      data: { plan: 'pro' },
    };

    await createClient(fetch).events.send(event);

    expect(readRoutes(fetch)).toEqual(['POST https://api.test/v1/events']);
  });

  it('takes the body type from the spec', () => {
    const { events } = createClient(mockFetch());

    expectTypeOf(events.send)
      .parameter(0)
      .toEqualTypeOf<components['schemas']['EventBody']>();
  });
});
