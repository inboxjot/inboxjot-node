import type { Inboxjot, PageQuery, RequestOptions } from './inboxjot';
import type { components, paths } from './schema';

export type ListDomainsOptions = PageQuery<
  NonNullable<paths['/v1/domains']['get']['parameters']['query']>
>;
export type DomainPage = components['schemas']['DomainPage'];
export type CreateDomainOptions = components['schemas']['CreateDomainBody'];
export type Domain = components['schemas']['PublicDomainDetail'];
export type DeleteDomainResponse = components['schemas']['StatusOk'];

export class Domains {
  constructor(private readonly client: Inboxjot) {}

  list(
    query?: ListDomainsOptions,
    options?: RequestOptions
  ): Promise<DomainPage> {
    return this.client.request('GET', '/v1/domains', { ...options, query });
  }

  create(body: CreateDomainOptions, options?: RequestOptions): Promise<Domain> {
    return this.client.request('POST', '/v1/domains', { ...options, body });
  }

  get(domainId: string, options?: RequestOptions): Promise<Domain> {
    const path = `/v1/domains/${encodeURIComponent(domainId)}`;

    return this.client.request('GET', path, options);
  }

  delete(
    domainId: string,
    options?: RequestOptions
  ): Promise<DeleteDomainResponse> {
    const path = `/v1/domains/${encodeURIComponent(domainId)}`;

    return this.client.request('DELETE', path, options);
  }

  verify(domainId: string, options?: RequestOptions): Promise<Domain> {
    const path = `/v1/domains/${encodeURIComponent(domainId)}/verify`;

    return this.client.request('POST', path, options);
  }
}
