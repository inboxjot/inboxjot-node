import type { Inboxjot, PageQuery, RequestOptions } from './inboxjot';
import type { components, paths } from './schema';

export type ListImagesOptions = PageQuery<
  NonNullable<paths['/v1/images']['get']['parameters']['query']>
>;
export type ImagePage = components['schemas']['ImagePage'];
export type Image = components['schemas']['Image'];
export type DeleteImageResponse = components['schemas']['StatusOk'];
export type UploadImageOptions = {
  file: Blob | ArrayBuffer | Uint8Array;
  file_name?: string;
};

type ImageContentType = components['schemas']['UploadUrlBody']['content_type'];
type ImageUploadTarget = components['schemas']['ImageUploadTarget'];

export class Images {
  constructor(private readonly client: Inboxjot) {}

  list(
    query?: ListImagesOptions,
    options?: RequestOptions
  ): Promise<ImagePage> {
    return this.client.request('GET', '/v1/images', { ...options, query });
  }

  async upload(
    image: UploadImageOptions,
    requestOptions: Omit<RequestOptions, 'idempotencyKey'> = {}
  ): Promise<Image> {
    const { file } = image;
    const fileName =
      image.file_name ??
      (file instanceof Blob && 'name' in file ? String(file.name) : undefined);
    const bytes =
      file instanceof Blob
        ? new Uint8Array(await file.arrayBuffer())
        : new Uint8Array(file);
    const contentType = getImageContentType(bytes);

    const target = await this.client.request<ImageUploadTarget>(
      'POST',
      '/v1/images/presign',
      {
        ...requestOptions,
        body: { content_type: contentType, size: bytes.byteLength },
      }
    );
    await this.client.put(
      target.upload_url,
      bytes,
      contentType,
      requestOptions
    );

    return this.client.request('POST', '/v1/images', {
      ...requestOptions,
      body: { key: target.key, file_name: fileName },
    });
  }

  get(imageId: string, options?: RequestOptions): Promise<Image> {
    const path = `/v1/images/${encodeURIComponent(imageId)}`;

    return this.client.request('GET', path, options);
  }

  delete(
    imageId: string,
    options?: RequestOptions
  ): Promise<DeleteImageResponse> {
    const path = `/v1/images/${encodeURIComponent(imageId)}`;

    return this.client.request('DELETE', path, options);
  }
}

function getImageContentType(bytes: Uint8Array): ImageContentType {
  const startsWith = (...prefix: number[]) =>
    prefix.every((byte, i) => bytes[i] === byte);
  if (startsWith(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a)) {
    return 'image/png';
  }
  if (startsWith(0xff, 0xd8, 0xff)) {
    return 'image/jpeg';
  }
  if (startsWith(0x47, 0x49, 0x46, 0x38)) {
    return 'image/gif';
  }

  throw new TypeError('The image must be a PNG, JPEG or GIF file');
}
