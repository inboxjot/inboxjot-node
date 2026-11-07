import { describe, expect, expectTypeOf, it } from 'vite-plus/test';

import { InboxjotError } from '../src';
import type { components } from '../src';
import { createClient, json, mockFetch, readCall, readRoutes } from './fetch';

type Schemas = components['schemas'];

const PNG = new Uint8Array([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 1, 2,
]);
const target = {
  upload_url: 'https://r2.test/put?sig=1',
  key: 'image-uploads/ws_a/1',
};

describe('Images', () => {
  it('maps each method to its route', async () => {
    const fetch = mockFetch(...Array.from({ length: 3 }, () => json({})));
    const { images } = createClient(fetch);

    await images.list({ type: 'png' });
    await images.get('img_1');
    await images.delete('img_1');

    expect(readRoutes(fetch)).toEqual([
      'GET https://api.test/v1/images?type=png',
      'GET https://api.test/v1/images/img_1',
      'DELETE https://api.test/v1/images/img_1',
    ]);
  });

  it('uploads the file and adds the image', async () => {
    const fetch = mockFetch(
      json(target),
      new Response(null, { status: 200 }),
      json({ id: 'img_1' }, 201)
    );
    const { images } = createClient(fetch);

    const image = await images.upload({
      file: new Blob([PNG]),
      file_name: 'logo.png',
    });

    expect(image).toEqual({ id: 'img_1' });
    expect(readRoutes(fetch)).toEqual([
      'POST https://api.test/v1/images/presign',
      'PUT https://r2.test/put?sig=1',
      'POST https://api.test/v1/images',
    ]);
    expect(JSON.parse(readCall(fetch, 0).init.body as string)).toEqual({
      content_type: 'image/png',
      size: 10,
    });

    const put = readCall(fetch, 1).init;
    expect(put.headers).toEqual({ 'Content-Type': 'image/png' });
    expect(put.body).toEqual(PNG);

    expect(JSON.parse(readCall(fetch, 2).init.body as string)).toEqual({
      key: target.key,
      file_name: 'logo.png',
    });
  });

  it('takes the name of a File', async () => {
    const fetch = mockFetch(json(target), new Response(null), json({}));
    await createClient(fetch).images.upload({
      file: new File([PNG], 'hero.png'),
    });

    expect(JSON.parse(readCall(fetch, 2).init.body as string)).toEqual({
      key: target.key,
      file_name: 'hero.png',
    });
  });

  it('detects jpeg and gif', async () => {
    for (const [bytes, type] of [
      [[0xff, 0xd8, 0xff, 0xe0], 'image/jpeg'],
      [[0x47, 0x49, 0x46, 0x38, 0x39, 0x61], 'image/gif'],
    ] as const) {
      const fetch = mockFetch(json(target), new Response(null), json({}));
      await createClient(fetch).images.upload({ file: new Uint8Array(bytes) });

      expect(
        JSON.parse(readCall(fetch, 0).init.body as string).content_type
      ).toBe(type);
    }
  });

  it('refuses a file that is not an image before any request', async () => {
    const fetch = mockFetch();

    await expect(
      createClient(fetch).images.upload({ file: new Uint8Array([1, 2, 3]) })
    ).rejects.toThrow(TypeError);
    expect(fetch).not.toHaveBeenCalled();
  });

  it('throws when storage rejects the upload', async () => {
    const fetch = mockFetch(
      json(target),
      new Response('<Error>SignatureDoesNotMatch</Error>', { status: 403 })
    );

    const error = await createClient(fetch)
      .images.upload({ file: PNG })
      .catch((error: unknown) => error);

    expect(error).toBeInstanceOf(InboxjotError);
    expect((error as InboxjotError).status).toBe(403);
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it('takes its types from the spec', () => {
    const { images } = createClient(mockFetch());

    expectTypeOf(images.list).returns.resolves.toEqualTypeOf<
      Schemas['ImagePage']
    >();
    expectTypeOf(images.upload).returns.resolves.toEqualTypeOf<
      Schemas['Image']
    >();
    expectTypeOf(images.get).returns.resolves.toEqualTypeOf<Schemas['Image']>();
    expectTypeOf(images).not.toHaveProperty('create');
    expectTypeOf(images).not.toHaveProperty('createUploadUrl');
  });
});
