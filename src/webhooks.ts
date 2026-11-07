import { WebhookVerificationError } from './errors';
import type { Inboxjot, PageQuery, RequestOptions } from './inboxjot';
import type { components, paths } from './schema';

export type WebhookEvent = components['schemas']['WebhookPayload'];
export type WebhookEventType = WebhookEvent['type'];
export type EmailEventData = components['schemas']['EmailEventData'];
export type ContactEventData = components['schemas']['ContactEventData'];
export type WebhookHeaders =
  | Headers
  | Record<string, string | string[] | undefined>;
export type VerifyWebhookOptions = {
  payload: string;
  headers: WebhookHeaders;
  secret: string;
};
export type ListWebhooksOptions = PageQuery<
  NonNullable<paths['/v1/webhooks']['get']['parameters']['query']>
>;
export type WebhookPage = components['schemas']['PublicEndpointPage'];
export type CreateWebhookOptions = components['schemas']['EndpointBody'];
export type CreateWebhookResponse =
  components['schemas']['PublicCreatedWebhookEndpoint'];
export type Webhook = components['schemas']['PublicEndpointDetail'];
export type UpdateWebhookOptions = components['schemas']['EndpointChangesBody'];
export type UpdateWebhookResponse =
  components['schemas']['PublicWebhookEndpoint'];
export type DeleteWebhookResponse = components['schemas']['StatusOk'];

const TOLERANCE_SECONDS = 300;

export class Webhooks {
  constructor(private readonly client: Inboxjot) {}

  list(
    query?: ListWebhooksOptions,
    options?: RequestOptions
  ): Promise<WebhookPage> {
    return this.client.request('GET', '/v1/webhooks', { ...options, query });
  }

  create(
    body: CreateWebhookOptions,
    options?: RequestOptions
  ): Promise<CreateWebhookResponse> {
    return this.client.request('POST', '/v1/webhooks', { ...options, body });
  }

  get(endpointId: string, options?: RequestOptions): Promise<Webhook> {
    const path = `/v1/webhooks/${encodeURIComponent(endpointId)}`;

    return this.client.request('GET', path, options);
  }

  update(
    endpointId: string,
    body: UpdateWebhookOptions,
    options?: RequestOptions
  ): Promise<UpdateWebhookResponse> {
    const path = `/v1/webhooks/${encodeURIComponent(endpointId)}`;

    return this.client.request('PATCH', path, { ...options, body });
  }

  delete(
    endpointId: string,
    options?: RequestOptions
  ): Promise<DeleteWebhookResponse> {
    const path = `/v1/webhooks/${encodeURIComponent(endpointId)}`;

    return this.client.request('DELETE', path, options);
  }

  verify(options: VerifyWebhookOptions): Promise<WebhookEvent> {
    return verifyWebhook(options);
  }
}

export async function verifyWebhook(
  options: VerifyWebhookOptions
): Promise<WebhookEvent> {
  const { payload, headers, secret } = options;
  const id = readHeader(headers, 'webhook-id');
  const timestamp = readHeader(headers, 'webhook-timestamp');
  const signatures = readHeader(headers, 'webhook-signature');
  if (!id || !timestamp || !signatures) {
    throw new WebhookVerificationError('Missing webhook headers');
  }

  const seconds = Number(timestamp);
  if (!Number.isInteger(seconds)) {
    throw new WebhookVerificationError('Invalid webhook timestamp');
  }

  const nowSeconds = Date.now() / 1000;
  if (Math.abs(nowSeconds - seconds) > TOLERANCE_SECONDS) {
    throw new WebhookVerificationError(
      'Webhook timestamp is outside the tolerance'
    );
  }

  const secretBytes = decodeBase64(secret.replace(/^whsec_/, ''));
  if (!secretBytes) {
    throw new WebhookVerificationError('Invalid webhook secret');
  }

  const key = await crypto.subtle.importKey(
    'raw',
    secretBytes,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['verify']
  );
  const content = new TextEncoder().encode(`${id}.${timestamp}.${payload}`);

  for (const signature of signatures.split(' ')) {
    const [version, value] = signature.split(',');
    if (version !== 'v1' || !value) {
      continue;
    }

    const bytes = decodeBase64(value);
    if (!bytes) {
      continue;
    }

    const isValid = await crypto.subtle.verify('HMAC', key, bytes, content);
    if (isValid) {
      return JSON.parse(payload);
    }
  }

  throw new WebhookVerificationError('No matching signature found');
}

function readHeader(headers: WebhookHeaders, name: string): string | undefined {
  if (headers instanceof Headers) {
    return headers.get(name) ?? undefined;
  }

  const key = Object.keys(headers).find(
    (headerName) => headerName.toLowerCase() === name
  );
  if (key === undefined) {
    return undefined;
  }

  const value = headers[key];

  return Array.isArray(value) ? value[0] : value;
}

function decodeBase64(text: string): Uint8Array<ArrayBuffer> | undefined {
  try {
    return Uint8Array.from(atob(text), (char) => char.charCodeAt(0));
  } catch {
    return undefined;
  }
}
