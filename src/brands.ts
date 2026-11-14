import type { Inboxjot, PageQuery, RequestOptions } from './inboxjot';
import type { components, paths } from './schema';

export type ListBrandsOptions = PageQuery<
  NonNullable<paths['/v1/brands']['get']['parameters']['query']>
>;
export type BrandPage = components['schemas']['BrandPage'];
export type CreateBrandOptions = components['schemas']['BrandBody'];
export type Brand = components['schemas']['Brand'];
export type UpdateBrandOptions = components['schemas']['BrandBody'];
export type DeleteBrandResponse = components['schemas']['StatusOk'];

export class Brands {
  constructor(private readonly client: Inboxjot) {}

  list(
    query?: ListBrandsOptions,
    options?: RequestOptions
  ): Promise<BrandPage> {
    return this.client.request('GET', '/v1/brands', { ...options, query });
  }

  create(body: CreateBrandOptions, options?: RequestOptions): Promise<Brand> {
    return this.client.request('POST', '/v1/brands', { ...options, body });
  }

  get(brandId: string, options?: RequestOptions): Promise<Brand> {
    const path = `/v1/brands/${encodeURIComponent(brandId)}`;

    return this.client.request('GET', path, options);
  }

  update(
    brandId: string,
    body: UpdateBrandOptions,
    options?: RequestOptions
  ): Promise<Brand> {
    const path = `/v1/brands/${encodeURIComponent(brandId)}`;

    return this.client.request('PATCH', path, { ...options, body });
  }

  delete(
    brandId: string,
    options?: RequestOptions
  ): Promise<DeleteBrandResponse> {
    const path = `/v1/brands/${encodeURIComponent(brandId)}`;

    return this.client.request('DELETE', path, options);
  }
}
