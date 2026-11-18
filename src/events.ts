import type { Inboxjot, RequestOptions } from './inboxjot';
import type { components } from './schema';

export type SendEventOptions = components['schemas']['EventBody'];
export type SendEventResponse = components['schemas']['TrackedResponse'];
export type BatchEventOptions = components['schemas']['EventBody'][];
export type BatchEventResponse = components['schemas']['TrackedBatchResponse'];

export class Events {
  constructor(private readonly client: Inboxjot) {}

  send(
    body: SendEventOptions,
    options?: RequestOptions
  ): Promise<SendEventResponse> {
    return this.client.request('POST', '/v1/events', { ...options, body });
  }

  batch(
    body: BatchEventOptions,
    options?: RequestOptions
  ): Promise<BatchEventResponse> {
    return this.client.request('POST', '/v1/events/batch', {
      ...options,
      body,
    });
  }
}
