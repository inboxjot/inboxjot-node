import { describe, expect, expectTypeOf, it } from 'vite-plus/test';

import type { components } from '../src';
import { createClient, json, mockFetch, readRoutes } from './fetch';

type Schemas = components['schemas'];

describe('Topics', () => {
  it('maps each method to its route', async () => {
    const fetch = mockFetch(...Array.from({ length: 5 }, () => json({})));
    const { topics } = createClient(fetch);

    await topics.list({ after: 'cur_1' });
    await topics.create({ name: 'News' });
    await topics.get('top_1');
    await topics.update('top_1', { description: null });
    await topics.delete('top_1');

    expect(readRoutes(fetch)).toEqual([
      'GET https://api.test/v1/topics?after=cur_1',
      'POST https://api.test/v1/topics',
      'GET https://api.test/v1/topics/top_1',
      'PATCH https://api.test/v1/topics/top_1',
      'DELETE https://api.test/v1/topics/top_1',
    ]);
  });

  it('takes its types from the spec', () => {
    const { topics } = createClient(mockFetch());

    expectTypeOf(topics.list).returns.resolves.toEqualTypeOf<
      Schemas['PublicTopicPage']
    >();
    expectTypeOf(topics.create)
      .parameter(0)
      .toEqualTypeOf<Schemas['CreateTopicBody']>();
    expectTypeOf(topics.get).returns.resolves.toEqualTypeOf<
      Schemas['PublicTopic']
    >();
    expectTypeOf(topics.update)
      .parameter(1)
      .toEqualTypeOf<Schemas['TopicInput']>();
    expectTypeOf(topics.delete).returns.resolves.toEqualTypeOf<
      Schemas['StatusOk']
    >();
  });
});
