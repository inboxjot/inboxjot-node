import { describe, expect, expectTypeOf, it } from 'vite-plus/test';

import type { components } from '../src';
import { createClient, json, mockFetch, readRoutes } from './fetch';

type Schemas = components['schemas'];

describe('Templates', () => {
  it('maps each method to its route', async () => {
    const fetch = mockFetch(...Array.from({ length: 11 }, () => json({})));
    const { templates } = createClient(fetch);

    await templates.list({ query: 'welcome' });
    await templates.create({ name: 'Welcome' });
    await templates.get('tpl_1');
    await templates.update('tpl_1', { subject: 'Hi' });
    await templates.delete('tpl_1');
    await templates.publish('tpl_1');
    await templates.listVersions('tpl_1');
    await templates.createVersion('tpl_1', { name: 'v1' });
    await templates.getVersion('tpl_1', 'ver_1');
    await templates.updateVersion('tpl_1', 'ver_1', { name: 'v2' });
    await templates.restoreVersion('tpl_1', 'ver_1');

    expect(readRoutes(fetch)).toEqual([
      'GET https://api.test/v1/templates?query=welcome',
      'POST https://api.test/v1/templates',
      'GET https://api.test/v1/templates/tpl_1',
      'PATCH https://api.test/v1/templates/tpl_1',
      'DELETE https://api.test/v1/templates/tpl_1',
      'POST https://api.test/v1/templates/tpl_1/publish',
      'GET https://api.test/v1/templates/tpl_1/versions',
      'POST https://api.test/v1/templates/tpl_1/versions',
      'GET https://api.test/v1/templates/tpl_1/versions/ver_1',
      'PATCH https://api.test/v1/templates/tpl_1/versions/ver_1',
      'POST https://api.test/v1/templates/tpl_1/versions/ver_1/restore',
    ]);
  });

  it('takes its types from the spec', () => {
    const { templates } = createClient(mockFetch());

    expectTypeOf(templates.list).returns.resolves.toEqualTypeOf<
      Schemas['PublicTemplatePage']
    >();
    expectTypeOf(templates.create)
      .parameter(0)
      .toEqualTypeOf<Schemas['CreateApiTemplateBody']>();
    expectTypeOf(templates.update)
      .parameter(1)
      .toEqualTypeOf<Schemas['ApiTemplateBody']>();
    expectTypeOf(templates.publish).returns.resolves.toEqualTypeOf<
      Schemas['PublicTemplate']
    >();
    expectTypeOf(templates.createVersion)
      .parameter(1)
      .toEqualTypeOf<Schemas['SaveVersionBody']>();
    expectTypeOf(templates.restoreVersion).returns.resolves.toEqualTypeOf<
      Schemas['PublicTemplate']
    >();
  });
});
