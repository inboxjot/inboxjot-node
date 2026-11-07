import type { Inboxjot, PageQuery, RequestOptions } from './inboxjot';
import type { components, paths } from './schema';

export type ListTopicsOptions = PageQuery<
  NonNullable<paths['/v1/topics']['get']['parameters']['query']>
>;
export type TopicPage = components['schemas']['PublicTopicPage'];
export type CreateTopicOptions = components['schemas']['CreateTopicBody'];
export type Topic = components['schemas']['PublicTopic'];
export type UpdateTopicOptions = components['schemas']['TopicInput'];
export type DeleteTopicResponse = components['schemas']['StatusOk'];

export class Topics {
  constructor(private readonly client: Inboxjot) {}

  list(
    query?: ListTopicsOptions,
    options?: RequestOptions
  ): Promise<TopicPage> {
    return this.client.request('GET', '/v1/topics', { ...options, query });
  }

  create(body: CreateTopicOptions, options?: RequestOptions): Promise<Topic> {
    return this.client.request('POST', '/v1/topics', { ...options, body });
  }

  get(topicId: string, options?: RequestOptions): Promise<Topic> {
    const path = `/v1/topics/${encodeURIComponent(topicId)}`;

    return this.client.request('GET', path, options);
  }

  update(
    topicId: string,
    body: UpdateTopicOptions,
    options?: RequestOptions
  ): Promise<Topic> {
    const path = `/v1/topics/${encodeURIComponent(topicId)}`;

    return this.client.request('PATCH', path, { ...options, body });
  }

  delete(
    topicId: string,
    options?: RequestOptions
  ): Promise<DeleteTopicResponse> {
    const path = `/v1/topics/${encodeURIComponent(topicId)}`;

    return this.client.request('DELETE', path, options);
  }
}
