import type { Inboxjot, PageQuery, RequestOptions } from './inboxjot';
import type { components, paths } from './schema';

export type ListSegmentsOptions = PageQuery<
  NonNullable<paths['/v1/segments']['get']['parameters']['query']>
>;
export type SegmentPage = components['schemas']['PublicSegmentPage'];
export type CreateSegmentOptions = components['schemas']['SegmentInput'];
export type Segment = components['schemas']['PublicSegment'];
export type UpdateSegmentOptions = components['schemas']['UpdateSegmentBody'];
export type DeleteSegmentResponse = components['schemas']['StatusOk'];
export type ListSegmentMembersOptions = PageQuery<
  NonNullable<
    paths['/v1/segments/{segment_id}/members']['get']['parameters']['query']
  >
>;
export type SegmentMemberPage = components['schemas']['SegmentMemberPage'];
export type SegmentMembersOptions = components['schemas']['ContactIdsBody'];
export type AddSegmentMembersResponse = components['schemas']['Added'];
export type RemoveSegmentMembersResponse = components['schemas']['Removed'];

export class Segments {
  constructor(private readonly client: Inboxjot) {}

  list(
    query?: ListSegmentsOptions,
    options?: RequestOptions
  ): Promise<SegmentPage> {
    return this.client.request('GET', '/v1/segments', { ...options, query });
  }

  create(
    body: CreateSegmentOptions,
    options?: RequestOptions
  ): Promise<Segment> {
    return this.client.request('POST', '/v1/segments', { ...options, body });
  }

  get(segmentId: string, options?: RequestOptions): Promise<Segment> {
    const path = `/v1/segments/${encodeURIComponent(segmentId)}`;

    return this.client.request('GET', path, options);
  }

  update(
    segmentId: string,
    body: UpdateSegmentOptions,
    options?: RequestOptions
  ): Promise<Segment> {
    const path = `/v1/segments/${encodeURIComponent(segmentId)}`;

    return this.client.request('PATCH', path, { ...options, body });
  }

  delete(
    segmentId: string,
    options?: RequestOptions
  ): Promise<DeleteSegmentResponse> {
    const path = `/v1/segments/${encodeURIComponent(segmentId)}`;

    return this.client.request('DELETE', path, options);
  }

  listMembers(
    segmentId: string,
    query?: ListSegmentMembersOptions,
    options?: RequestOptions
  ): Promise<SegmentMemberPage> {
    const path = `/v1/segments/${encodeURIComponent(segmentId)}/members`;

    return this.client.request('GET', path, { ...options, query });
  }

  addMembers(
    segmentId: string,
    body: SegmentMembersOptions,
    options?: RequestOptions
  ): Promise<AddSegmentMembersResponse> {
    const path = `/v1/segments/${encodeURIComponent(segmentId)}/members`;

    return this.client.request('POST', path, { ...options, body });
  }

  removeMembers(
    segmentId: string,
    body: SegmentMembersOptions,
    options?: RequestOptions
  ): Promise<RemoveSegmentMembersResponse> {
    const path = `/v1/segments/${encodeURIComponent(segmentId)}/members`;

    return this.client.request('DELETE', path, { ...options, body });
  }
}
