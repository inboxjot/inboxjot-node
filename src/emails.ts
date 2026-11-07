import type { Inboxjot, PageQuery, RequestOptions } from './inboxjot';
import type { components, paths } from './schema';

export type ListEmailsOptions = PageQuery<
  NonNullable<paths['/v1/emails']['get']['parameters']['query']>
>;
export type EmailPage = components['schemas']['EmailPage'];
export type SendEmailOptions = components['schemas']['SendEmailBody'];
export type BatchEmailOptions = components['schemas']['BatchEmailBody'][];
export type SendEmailResponse = components['schemas']['QueuedId'];
export type BatchEmailResponse = components['schemas']['BatchResponse'];
export type Email = components['schemas']['ApiEmail'];
export type UpdateEmailOptions = components['schemas']['RescheduleBody'];
export type UpdateEmailResponse = components['schemas']['RescheduledEmail'];
export type CancelEmailResponse = components['schemas']['CanceledEmail'];
export type Attachment = components['schemas']['AttachmentResponse'];
export type AttachmentList = components['schemas']['AttachmentList'];

export class Emails {
  constructor(private readonly client: Inboxjot) {}

  list(
    query?: ListEmailsOptions,
    options?: RequestOptions
  ): Promise<EmailPage> {
    return this.client.request('GET', '/v1/emails', { ...options, query });
  }

  send(
    body: SendEmailOptions,
    options?: RequestOptions
  ): Promise<SendEmailResponse> {
    return this.client.request('POST', '/v1/emails', { ...options, body });
  }

  batch(
    body: BatchEmailOptions,
    options?: RequestOptions
  ): Promise<BatchEmailResponse> {
    return this.client.request('POST', '/v1/emails/batch', {
      ...options,
      body,
    });
  }

  get(emailId: string, options?: RequestOptions): Promise<Email> {
    const path = `/v1/emails/${encodeURIComponent(emailId)}`;

    return this.client.request('GET', path, options);
  }

  update(
    emailId: string,
    body: UpdateEmailOptions,
    options?: RequestOptions
  ): Promise<UpdateEmailResponse> {
    const path = `/v1/emails/${encodeURIComponent(emailId)}`;

    return this.client.request('PATCH', path, { ...options, body });
  }

  cancel(
    emailId: string,
    options?: RequestOptions
  ): Promise<CancelEmailResponse> {
    const path = `/v1/emails/${encodeURIComponent(emailId)}/cancel`;

    return this.client.request('POST', path, options);
  }

  listAttachments(
    emailId: string,
    options?: RequestOptions
  ): Promise<AttachmentList> {
    const path = `/v1/emails/${encodeURIComponent(emailId)}/attachments`;

    return this.client.request('GET', path, options);
  }

  getAttachment(
    emailId: string,
    attachmentId: string,
    options?: RequestOptions
  ): Promise<Attachment> {
    const emailPath = `/v1/emails/${encodeURIComponent(emailId)}`;
    const path = `${emailPath}/attachments/${encodeURIComponent(attachmentId)}`;

    return this.client.request('GET', path, options);
  }
}
