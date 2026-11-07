import type { components } from './schema';

type ErrorBody = components['schemas']['ErrorBody'];
type ErrorName = components['schemas']['ErrorName'];
type ErrorItem = components['schemas']['ErrorItem'];

export class InboxjotError extends Error {
  override name: ErrorName;
  status: number;
  errors: ErrorItem[];
  requestId: string | null;
  headers: Headers;

  constructor(body: ErrorBody, headers: Headers) {
    super(body.message);

    this.name = body.name;
    this.status = body.status;
    this.errors = body.errors;
    this.requestId = body.request_id;
    this.headers = headers;
  }
}

export class InboxjotConnectionError extends Error {
  override name = 'InboxjotConnectionError';
}

export class WebhookVerificationError extends Error {
  override name = 'WebhookVerificationError';
}

export function readError(response: Response, text: string): InboxjotError {
  let body: Partial<ErrorBody> = {};
  try {
    body = JSON.parse(text);
  } catch {}

  const fallbackMessage =
    text || `Request failed with status ${response.status}`;
  const errorBody: ErrorBody = {
    name: body.name ?? 'unknown_error',
    status: response.status,
    message: body.message ?? fallbackMessage,
    errors: body.errors ?? [],
    request_id: body.request_id ?? response.headers.get('x-request-id'),
  };

  return new InboxjotError(errorBody, response.headers);
}
