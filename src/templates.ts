import type { Inboxjot, PageQuery, RequestOptions } from './inboxjot';
import type { components, paths } from './schema';

export type ListTemplatesOptions = PageQuery<
  NonNullable<paths['/v1/templates']['get']['parameters']['query']>
>;
export type TemplatePage = components['schemas']['PublicTemplatePage'];
export type CreateTemplateOptions =
  components['schemas']['CreateApiTemplateBody'];
export type Template = components['schemas']['PublicTemplate'];
export type UpdateTemplateOptions = components['schemas']['ApiTemplateBody'];
export type DeleteTemplateResponse = components['schemas']['StatusOk'];
export type ListTemplateVersionsOptions = PageQuery<
  NonNullable<
    paths['/v1/templates/{template_id}/versions']['get']['parameters']['query']
  >
>;
export type TemplateVersionPage = components['schemas']['DocumentVersionPage'];
export type TemplateVersion = components['schemas']['DocumentVersion'];
export type TemplateVersionDetail =
  components['schemas']['DocumentVersionDetail'];
export type CreateTemplateVersionOptions =
  components['schemas']['SaveVersionBody'];
export type UpdateTemplateVersionOptions =
  components['schemas']['NameVersionBody'];

export class Templates {
  constructor(private readonly client: Inboxjot) {}

  list(
    query?: ListTemplatesOptions,
    options?: RequestOptions
  ): Promise<TemplatePage> {
    return this.client.request('GET', '/v1/templates', { ...options, query });
  }

  create(
    body: CreateTemplateOptions,
    options?: RequestOptions
  ): Promise<Template> {
    return this.client.request('POST', '/v1/templates', { ...options, body });
  }

  get(templateId: string, options?: RequestOptions): Promise<Template> {
    const path = `/v1/templates/${encodeURIComponent(templateId)}`;

    return this.client.request('GET', path, options);
  }

  update(
    templateId: string,
    body: UpdateTemplateOptions,
    options?: RequestOptions
  ): Promise<Template> {
    const path = `/v1/templates/${encodeURIComponent(templateId)}`;

    return this.client.request('PATCH', path, { ...options, body });
  }

  delete(
    templateId: string,
    options?: RequestOptions
  ): Promise<DeleteTemplateResponse> {
    const path = `/v1/templates/${encodeURIComponent(templateId)}`;

    return this.client.request('DELETE', path, options);
  }

  publish(templateId: string, options?: RequestOptions): Promise<Template> {
    const path = `/v1/templates/${encodeURIComponent(templateId)}/publish`;

    return this.client.request('POST', path, options);
  }

  listVersions(
    templateId: string,
    query?: ListTemplateVersionsOptions,
    options?: RequestOptions
  ): Promise<TemplateVersionPage> {
    const path = `/v1/templates/${encodeURIComponent(templateId)}/versions`;

    return this.client.request('GET', path, { ...options, query });
  }

  createVersion(
    templateId: string,
    body: CreateTemplateVersionOptions,
    options?: RequestOptions
  ): Promise<TemplateVersion> {
    const path = `/v1/templates/${encodeURIComponent(templateId)}/versions`;

    return this.client.request('POST', path, { ...options, body });
  }

  getVersion(
    templateId: string,
    versionId: string,
    options?: RequestOptions
  ): Promise<TemplateVersionDetail> {
    const basePath = `/v1/templates/${encodeURIComponent(templateId)}`;
    const path = `${basePath}/versions/${encodeURIComponent(versionId)}`;

    return this.client.request('GET', path, options);
  }

  updateVersion(
    templateId: string,
    versionId: string,
    body: UpdateTemplateVersionOptions,
    options?: RequestOptions
  ): Promise<TemplateVersion> {
    const basePath = `/v1/templates/${encodeURIComponent(templateId)}`;
    const path = `${basePath}/versions/${encodeURIComponent(versionId)}`;

    return this.client.request('PATCH', path, { ...options, body });
  }

  restoreVersion(
    templateId: string,
    versionId: string,
    options?: RequestOptions
  ): Promise<Template> {
    const basePath = `/v1/templates/${encodeURIComponent(templateId)}`;
    const path = `${basePath}/versions/${encodeURIComponent(versionId)}/restore`;

    return this.client.request('POST', path, options);
  }
}
