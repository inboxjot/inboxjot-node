import type { Inboxjot, PageQuery, RequestOptions } from './inboxjot';
import type { components, paths } from './schema';

export type ListCampaignsOptions = PageQuery<
  NonNullable<paths['/v1/campaigns']['get']['parameters']['query']>
>;
export type CampaignPage = components['schemas']['CampaignPage'];
export type CreateCampaignOptions = components['schemas']['ApiCampaignBody'];
export type Campaign = components['schemas']['PublicCampaignDetail'];
export type UpdateCampaignOptions = components['schemas']['ApiCampaignBody'];
export type DeleteCampaignResponse = components['schemas']['StatusOk'];
export type SendCampaignOptions = components['schemas']['SendBody'];
export type SendCampaignTestOptions = components['schemas']['CampaignTestBody'];
export type SendCampaignTestResponse = components['schemas']['QueuedIds'];
export type ListCampaignVersionsOptions = PageQuery<
  NonNullable<
    paths['/v1/campaigns/{campaign_id}/versions']['get']['parameters']['query']
  >
>;
export type CampaignVersionPage = components['schemas']['DocumentVersionPage'];
export type CampaignVersion = components['schemas']['DocumentVersion'];
export type CampaignVersionDetail =
  components['schemas']['DocumentVersionDetail'];
export type CreateCampaignVersionOptions =
  components['schemas']['SaveVersionBody'];
export type UpdateCampaignVersionOptions =
  components['schemas']['NameVersionBody'];

export class Campaigns {
  constructor(private readonly client: Inboxjot) {}

  list(
    query?: ListCampaignsOptions,
    options?: RequestOptions
  ): Promise<CampaignPage> {
    return this.client.request('GET', '/v1/campaigns', { ...options, query });
  }

  create(
    body: CreateCampaignOptions,
    options?: RequestOptions
  ): Promise<Campaign> {
    return this.client.request('POST', '/v1/campaigns', { ...options, body });
  }

  get(campaignId: string, options?: RequestOptions): Promise<Campaign> {
    const path = `/v1/campaigns/${encodeURIComponent(campaignId)}`;

    return this.client.request('GET', path, options);
  }

  update(
    campaignId: string,
    body: UpdateCampaignOptions,
    options?: RequestOptions
  ): Promise<Campaign> {
    const path = `/v1/campaigns/${encodeURIComponent(campaignId)}`;

    return this.client.request('PATCH', path, { ...options, body });
  }

  delete(
    campaignId: string,
    options?: RequestOptions
  ): Promise<DeleteCampaignResponse> {
    const path = `/v1/campaigns/${encodeURIComponent(campaignId)}`;

    return this.client.request('DELETE', path, options);
  }

  send(
    campaignId: string,
    body: SendCampaignOptions = {},
    options?: RequestOptions
  ): Promise<Campaign> {
    const path = `/v1/campaigns/${encodeURIComponent(campaignId)}/send`;

    return this.client.request('POST', path, { ...options, body });
  }

  cancel(campaignId: string, options?: RequestOptions): Promise<Campaign> {
    const path = `/v1/campaigns/${encodeURIComponent(campaignId)}/cancel`;

    return this.client.request('POST', path, options);
  }

  sendTest(
    campaignId: string,
    body: SendCampaignTestOptions,
    options?: RequestOptions
  ): Promise<SendCampaignTestResponse> {
    const path = `/v1/campaigns/${encodeURIComponent(campaignId)}/test`;

    return this.client.request('POST', path, { ...options, body });
  }

  listVersions(
    campaignId: string,
    query?: ListCampaignVersionsOptions,
    options?: RequestOptions
  ): Promise<CampaignVersionPage> {
    const path = `/v1/campaigns/${encodeURIComponent(campaignId)}/versions`;

    return this.client.request('GET', path, { ...options, query });
  }

  createVersion(
    campaignId: string,
    body: CreateCampaignVersionOptions,
    options?: RequestOptions
  ): Promise<CampaignVersion> {
    const path = `/v1/campaigns/${encodeURIComponent(campaignId)}/versions`;

    return this.client.request('POST', path, { ...options, body });
  }

  getVersion(
    campaignId: string,
    versionId: string,
    options?: RequestOptions
  ): Promise<CampaignVersionDetail> {
    const basePath = `/v1/campaigns/${encodeURIComponent(campaignId)}`;
    const path = `${basePath}/versions/${encodeURIComponent(versionId)}`;

    return this.client.request('GET', path, options);
  }

  updateVersion(
    campaignId: string,
    versionId: string,
    body: UpdateCampaignVersionOptions,
    options?: RequestOptions
  ): Promise<CampaignVersion> {
    const basePath = `/v1/campaigns/${encodeURIComponent(campaignId)}`;
    const path = `${basePath}/versions/${encodeURIComponent(versionId)}`;

    return this.client.request('PATCH', path, { ...options, body });
  }

  restoreVersion(
    campaignId: string,
    versionId: string,
    options?: RequestOptions
  ): Promise<Campaign> {
    const basePath = `/v1/campaigns/${encodeURIComponent(campaignId)}`;
    const path = `${basePath}/versions/${encodeURIComponent(versionId)}/restore`;

    return this.client.request('POST', path, options);
  }
}
