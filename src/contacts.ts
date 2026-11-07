import type { Inboxjot, PageQuery, RequestOptions } from './inboxjot';
import type { components, paths } from './schema';

export type ListContactsOptions = PageQuery<
  NonNullable<paths['/v1/contacts']['get']['parameters']['query']>
>;
export type ContactPage = components['schemas']['ContactListPage'];
export type CreateContactOptions = components['schemas']['CreateContactInput'];
export type CreateContactResponse = components['schemas']['SavedContact'];
export type Contact = components['schemas']['PublicContactWithTopics'];
export type UpdateContactOptions = components['schemas']['UpdateContactBody'];
export type DeleteContactResponse = components['schemas']['StatusOk'];
export type EraseContactOptions = components['schemas']['EraseContactBody'];
export type EraseContactResponse = components['schemas']['ErasureQueued'];

export class Contacts {
  constructor(private readonly client: Inboxjot) {}

  list(
    query?: ListContactsOptions,
    options?: RequestOptions
  ): Promise<ContactPage> {
    return this.client.request('GET', '/v1/contacts', { ...options, query });
  }

  create(
    body: CreateContactOptions,
    options?: RequestOptions
  ): Promise<CreateContactResponse> {
    return this.client.request('POST', '/v1/contacts', { ...options, body });
  }

  get(contactIdOrEmail: string, options?: RequestOptions): Promise<Contact> {
    const path = `/v1/contacts/${encodeURIComponent(contactIdOrEmail)}`;

    return this.client.request('GET', path, options);
  }

  update(
    contactIdOrEmail: string,
    body: UpdateContactOptions,
    options?: RequestOptions
  ): Promise<Contact> {
    const path = `/v1/contacts/${encodeURIComponent(contactIdOrEmail)}`;

    return this.client.request('PATCH', path, { ...options, body });
  }

  delete(
    contactIdOrEmail: string,
    options?: RequestOptions
  ): Promise<DeleteContactResponse> {
    const path = `/v1/contacts/${encodeURIComponent(contactIdOrEmail)}`;

    return this.client.request('DELETE', path, options);
  }

  erase(
    body: EraseContactOptions,
    options?: RequestOptions
  ): Promise<EraseContactResponse> {
    return this.client.request('POST', '/v1/contacts/erase', {
      ...options,
      body,
    });
  }
}
