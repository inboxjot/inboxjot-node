import { Campaigns } from './campaigns';
import { Contacts } from './contacts';
import { Domains } from './domains';
import { Emails } from './emails';
import { InboxjotConnectionError, InboxjotError, readError } from './errors';
import { Events } from './events';
import { Images } from './images';
import { Segments } from './segments';
import { Templates } from './templates';
import { Topics } from './topics';
import { Webhooks } from './webhooks';

export type InboxjotOptions = {
  apiKey?: string;
  baseUrl?: string;
  fetch?: typeof fetch;
  timeout?: number;
  maxRetries?: number;
};

export type RequestOptions = {
  idempotencyKey?: string;
  timeout?: number;
  maxRetries?: number;
  signal?: AbortSignal;
};

export type PageQuery<T> = {
  [K in keyof T]: K extends 'after' | 'before' ? T[K] | null : T[K];
};

type Method = 'GET' | 'POST' | 'PATCH' | 'DELETE';
type Query = Record<string, string | number | boolean | null | undefined>;

const VERSION = '0.1.0';

export class Inboxjot {
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly fetch: typeof fetch;
  private readonly timeout: number;
  private readonly maxRetries: number;

  readonly emails = new Emails(this);
  readonly contacts = new Contacts(this);
  readonly events = new Events(this);
  readonly campaigns = new Campaigns(this);
  readonly templates = new Templates(this);
  readonly domains = new Domains(this);
  readonly images = new Images(this);
  readonly segments = new Segments(this);
  readonly topics = new Topics(this);
  readonly webhooks = new Webhooks(this);

  constructor(options: InboxjotOptions = {}) {
    const runtime = globalThis as {
      process?: { env?: Record<string, string | undefined> };
    };
    const key = options.apiKey ?? runtime.process?.env?.INBOXJOT_API_KEY;
    if (!key) {
      throw new Error(
        'Missing API key. Pass apiKey to new Inboxjot() or set INBOXJOT_API_KEY.'
      );
    }

    const baseUrl = options.baseUrl ?? 'https://api.inboxjot.com';

    this.apiKey = key;
    this.baseUrl = baseUrl.replace(/\/+$/, '');
    this.fetch = (options.fetch ?? globalThis.fetch).bind(globalThis);
    this.timeout = options.timeout ?? 60_000;
    this.maxRetries = options.maxRetries ?? 2;
  }

  async request<T>(
    method: Method,
    path: string,
    options: RequestOptions & { body?: unknown; query?: Query } = {}
  ): Promise<T> {
    const hasBody = options.body !== undefined;
    const hasIdempotencyKey = options.idempotencyKey !== undefined;

    const headers: Record<string, string> = {
      Accept: 'application/json',
      Authorization: `Bearer ${this.apiKey}`,
      'User-Agent': `inboxjot-node/${VERSION}`,
    };
    if (hasBody) {
      headers['Content-Type'] = 'application/json';
    }
    if (options.idempotencyKey !== undefined) {
      headers['Idempotency-Key'] = options.idempotencyKey;
    }

    const query = Object.entries(options.query ?? {}).filter(
      ([, value]) => value != null
    );
    const search = new URLSearchParams(
      query.map(([key, value]) => [key, String(value)])
    );
    const url = this.baseUrl + path + (query.length ? `?${search}` : '');
    const body = hasBody ? JSON.stringify(options.body) : undefined;
    const timeout = options.timeout ?? this.timeout;
    const maxRetries = options.maxRetries ?? this.maxRetries;
    const isReadMethod = method === 'GET' || method === 'DELETE';
    const isSafe = isReadMethod || hasIdempotencyKey;

    for (let attempt = 0; ; attempt++) {
      options.signal?.throwIfAborted();

      const controller = new AbortController();
      const abort = () => controller.abort(options.signal?.reason);
      const timer = setTimeout(() => controller.abort(), timeout);
      options.signal?.addEventListener('abort', abort);

      const init: RequestInit = {
        method,
        headers,
        body,
        signal: controller.signal,
      };
      const result = await this.fetch(url, init)
        .then(async (response) => ({ response, text: await response.text() }))
        .catch((cause: unknown) => {
          if (options.signal?.aborted) {
            throw cause;
          }

          const message = controller.signal.aborted
            ? `Request timed out after ${timeout}ms`
            : 'Connection error';

          return new InboxjotConnectionError(message, { cause });
        })
        .finally(() => {
          clearTimeout(timer);
          options.signal?.removeEventListener('abort', abort);
        });

      const isConnectionError = result instanceof InboxjotConnectionError;
      if (!isConnectionError && result.response.ok) {
        return JSON.parse(result.text) as T;
      }

      const error = isConnectionError
        ? result
        : readError(result.response, result.text);

      let isRetryable = isSafe;
      if (error instanceof InboxjotError) {
        const isRateLimited = error.status === 429;
        const isConcurrent = error.name === 'concurrent_idempotent_requests';
        const isServerError = error.status >= 500;
        isRetryable =
          isRateLimited || isConcurrent || (isServerError && isSafe);
      }
      if (attempt >= maxRetries || !isRetryable) {
        throw error;
      }

      const retryAfterHeader =
        error instanceof InboxjotError
          ? error.headers.get('retry-after')
          : null;
      const retryAfter = Number(retryAfterHeader ?? NaN);
      if (retryAfter > 60) {
        throw error;
      }

      const hasRetryAfter = retryAfter >= 0;

      const backoff = Math.min(500 * 2 ** attempt, 8000);
      const jitter = 1 - Math.random() * 0.25;
      const delay = hasRetryAfter ? retryAfter * 1000 : backoff * jitter;

      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  /** @internal */
  async put(
    url: string,
    body: Uint8Array<ArrayBuffer>,
    contentType: string,
    options: RequestOptions = {}
  ) {
    options.signal?.throwIfAborted();

    const timeout = options.timeout ?? this.timeout;
    const controller = new AbortController();
    const abort = () => controller.abort(options.signal?.reason);
    const timer = setTimeout(() => controller.abort(), timeout);
    options.signal?.addEventListener('abort', abort);

    const headers = { 'Content-Type': contentType };
    const init: RequestInit = {
      method: 'PUT',
      headers,
      body,
      signal: controller.signal,
    };
    const result = await this.fetch(url, init)
      .then(async (response) => ({ response, text: await response.text() }))
      .catch((cause: unknown) => {
        if (options.signal?.aborted) {
          throw cause;
        }

        const message = controller.signal.aborted
          ? `Upload timed out after ${timeout}ms`
          : 'Connection error during upload';

        throw new InboxjotConnectionError(message, { cause });
      })
      .finally(() => {
        clearTimeout(timer);
        options.signal?.removeEventListener('abort', abort);
      });

    if (!result.response.ok) {
      const error = readError(result.response, result.text);
      error.message = `The image upload failed with status ${result.response.status}`;
      throw error;
    }
  }
}
