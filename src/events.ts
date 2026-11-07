import type { Inboxjot, RequestOptions } from './inboxjot';
import type { components } from './schema';

export type SendEventOptions = components['schemas']['EventBody'];
export type SendEventResponse = components['schemas']['TrackedResponse'];

export class Events {
  constructor(private readonly client: Inboxjot) {}

  send(
    body: SendEventOptions,
    options?: RequestOptions
  ): Promise<SendEventResponse> {
    return this.client.request('POST', '/v1/events', { ...options, body });
  }
}
