import {
  afterEach,
  beforeEach,
  describe,
  expect,
  expectTypeOf,
  it,
  vi,
} from 'vite-plus/test';

import packageJson from '../package.json';
import { Inboxjot, InboxjotConnectionError, InboxjotError } from '../src';
import type { components } from '../src';
import { apiError, createClient, json, mockFetch, readCall } from './fetch';

describe('Inboxjot', () => {
  it('does not wait for a Retry-After over 60 seconds', async () => {
    const fetch = mockFetch(
      apiError(429, 'rate_limit_exceeded', { 'Retry-After': '3600' })
    );

    await expect(createClient(fetch).emails.get('em_1')).rejects.toBeInstanceOf(
      InboxjotError
    );
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('reads the API key from INBOXJOT_API_KEY', async () => {
    vi.stubEnv('INBOXJOT_API_KEY', 'ibx_env');
    const fetch = mockFetch(json({}));

    await new Inboxjot({ fetch }).emails.get('em_1');

    const { url, init } = readCall(fetch);
    expect(init.headers.Authorization).toBe('Bearer ibx_env');
    expect(url).toBe('https://api.inboxjot.com/v1/emails/em_1');

    vi.unstubAllEnvs();
  });

  it('reads the API key from INBOXJOT_API_KEY with no options', async () => {
    vi.stubEnv('INBOXJOT_API_KEY', 'ibx_env');
    const fetch = mockFetch(json({}));
    vi.stubGlobal('fetch', fetch);

    await new Inboxjot().emails.get('em_1');

    expect(readCall(fetch).init.headers.Authorization).toBe('Bearer ibx_env');

    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it('leaves a null cursor out of the query', async () => {
    const fetch = mockFetch(json({}), json({}));
    const inboxjot = createClient(fetch);

    await inboxjot.contacts.list({ after: null, per_page: 10 });
    await inboxjot.emails.list({ before: null });

    expect(readCall(fetch, 0).url).toBe(
      'https://api.test/v1/contacts?per_page=10'
    );
    expect(readCall(fetch, 1).url).toBe('https://api.test/v1/emails');
  });

  it('sends the package version in the user agent', async () => {
    const fetch = mockFetch(json({}));

    await createClient(fetch).emails.get('em_1');

    const userAgent = readCall(fetch).init.headers['User-Agent'];
    expect(userAgent).toBe(`inboxjot-node/${packageJson.version}`);
  });

  it('does not call a custom fetch with the client as this', async () => {
    const fetch = vi.fn(async () => json({}));

    await new Inboxjot({ apiKey: 'ibx_test', fetch }).emails.get('em_1');

    expect(fetch.mock.contexts[0]).toBe(globalThis);
  });

  it('throws without an API key', () => {
    vi.stubEnv('INBOXJOT_API_KEY', '');

    expect(() => new Inboxjot()).toThrow('Missing API key');

    vi.unstubAllEnvs();
  });
});

describe('errors', () => {
  it('maps the error body to InboxjotError', async () => {
    const body = {
      name: 'validation_error',
      status: 400,
      message: 'Invalid address',
      errors: [{ message: 'Invalid address', location: 'to' }],
      request_id: 'req_9',
    };
    const fetch = mockFetch(json(body, 400));

    const error = await createClient(fetch)
      .emails.send({ to: 'x' })
      .catch((error) => error);

    expect(error).toBeInstanceOf(InboxjotError);
    const { request_id, ...fields } = body;
    expect(error).toMatchObject({ ...fields, requestId: request_id });
  });

  it('maps a body that is not json', async () => {
    const reply = new Response('Bad Gateway', {
      status: 502,
      headers: { 'x-request-id': 'req_2' },
    });
    const fetch = mockFetch(reply);

    const error = await createClient(fetch, 0)
      .emails.get('em_1')
      .catch((error) => error);

    expect(error).toMatchObject({
      name: 'unknown_error',
      status: 502,
      message: 'Bad Gateway',
      requestId: 'req_2',
    });
  });

  it('does not retry client errors', async () => {
    const fetch = mockFetch(apiError(404, 'not_found'));

    const request = createClient(fetch).emails.get('em_1');

    await expect(request).rejects.toMatchObject({ name: 'not_found' });
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('types the error name from the spec', () => {
    expectTypeOf<InboxjotError['name']>().toEqualTypeOf<
      components['schemas']['ErrorName']
    >();
  });
});

describe('retries', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  async function settle<T>(promise: Promise<T>) {
    const result = promise.then(
      (value) => ({ value }),
      (error: unknown) => ({ error })
    );

    await vi.runAllTimersAsync();

    return result;
  }

  it('retries a 409 concurrent request after Retry-After with the same key', async () => {
    const fetch = mockFetch(
      apiError(409, 'concurrent_idempotent_requests', { 'Retry-After': '1' }),
      json({ id: 'em_1' }, 202)
    );
    const started = Date.now();

    const request = createClient(fetch).emails.send(
      { to: 'a@acme.dev' },
      { idempotencyKey: 'k' }
    );
    const result = await settle(request);

    expect(result).toEqual({ value: { id: 'em_1' } });
    expect(Date.now() - started).toBe(1000);
    expect(readCall(fetch, 1).init.headers['Idempotency-Key']).toBe('k');
  });

  it('retries 429 even without a key', async () => {
    const fetch = mockFetch(
      apiError(429, 'rate_limit_exceeded', { 'Retry-After': '2' }),
      json({ id: 'em_1' }, 202)
    );

    const result = await settle(
      createClient(fetch).emails.send({ to: 'a@acme.dev' })
    );

    expect(result).toEqual({ value: { id: 'em_1' } });
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it('retries 5xx and network errors on reads', async () => {
    const fetch = mockFetch(
      apiError(500, 'unknown_error'),
      new TypeError('fetch failed'),
      json({ id: 'em_1' })
    );

    const result = await settle(createClient(fetch).emails.get('em_1'));

    expect(result).toEqual({ value: { id: 'em_1' } });
    expect(fetch).toHaveBeenCalledTimes(3);
  });

  it('does not retry 5xx or network errors on writes without a key', async () => {
    const serverFetch = mockFetch(apiError(500, 'unknown_error'));
    const server = await settle(
      createClient(serverFetch).emails.send({ to: 'a@acme.dev' })
    );

    expect(server).toMatchObject({ error: { status: 500 } });
    expect(serverFetch).toHaveBeenCalledTimes(1);

    const networkFetch = mockFetch(new TypeError('fetch failed'));
    const event = { name: 'a', email: 'a@acme.dev' };
    const network = await settle(createClient(networkFetch).events.send(event));

    expect((network as { error: unknown }).error).toBeInstanceOf(
      InboxjotConnectionError
    );
    expect(networkFetch).toHaveBeenCalledTimes(1);
  });

  it('retries writes that carry a key', async () => {
    const fetch = mockFetch(
      new TypeError('fetch failed'),
      apiError(503, 'unknown_error'),
      json({ id: 'em_1' })
    );

    const request = createClient(fetch).emails.cancel('em_1', {
      idempotencyKey: 'k',
    });
    const result = await settle(request);

    expect(result).toEqual({ value: { id: 'em_1' } });
    expect(fetch).toHaveBeenCalledTimes(3);
  });

  it('stops after maxRetries', async () => {
    const fetch = mockFetch(
      apiError(500, 'unknown_error'),
      apiError(500, 'unknown_error'),
      apiError(500, 'unknown_error')
    );

    const result = await settle(createClient(fetch, 1).emails.get('em_1'));

    expect(result).toMatchObject({ error: { status: 500 } });
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it('times out a slow request', async () => {
    const fetch = vi.fn((_url: string | URL | Request, init?: RequestInit) => {
      return new Promise<Response>((_, reject) => {
        init?.signal?.addEventListener('abort', () =>
          reject(new Error('aborted'))
        );
      });
    });
    const inboxjot = new Inboxjot({
      apiKey: 'ibx_test',
      fetch,
      timeout: 100,
      maxRetries: 0,
    });

    const result = await settle(inboxjot.emails.get('em_1'));
    const { error } = result as { error: Error };

    expect(error).toBeInstanceOf(InboxjotConnectionError);
    expect(error.message).toBe('Request timed out after 100ms');
  });

  it('times out a response body that stalls', async () => {
    const fetch = vi.fn(
      async (_url: string | URL | Request, init?: RequestInit) => {
        const body = new ReadableStream({
          start(controller) {
            init?.signal?.addEventListener('abort', () =>
              controller.error(new Error('aborted'))
            );
          },
        });

        return new Response(body);
      }
    );
    const inboxjot = new Inboxjot({
      apiKey: 'ibx_test',
      fetch,
      timeout: 100,
      maxRetries: 0,
    });

    const result = await settle(inboxjot.emails.get('em_1'));
    const { error } = result as { error: Error };

    expect(error).toBeInstanceOf(InboxjotConnectionError);
    expect(error.message).toBe('Request timed out after 100ms');
  });

  it('retries a read when the response body drops', async () => {
    const dropped = new ReadableStream({
      start(controller) {
        controller.error(new TypeError('terminated'));
      },
    });
    const fetch = mockFetch(new Response(dropped), json({ id: 'em_1' }));

    const result = await settle(createClient(fetch).emails.get('em_1'));

    expect(result).toEqual({ value: { id: 'em_1' } });
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it('stops when the caller aborts', async () => {
    const controller = new AbortController();
    const fetch = vi.fn((_url: string | URL | Request, init?: RequestInit) => {
      return new Promise<Response>((_, reject) => {
        init?.signal?.addEventListener('abort', () =>
          reject(init.signal?.reason)
        );
      });
    });
    const inboxjot = new Inboxjot({ apiKey: 'ibx_test', fetch });

    const promise = inboxjot.emails.get('em_1', { signal: controller.signal });
    controller.abort(new Error('stop'));

    const result = await settle(promise);
    const { error } = result as { error: Error };

    expect(error.message).toBe('stop');
    expect(fetch).toHaveBeenCalledTimes(1);
  });
});
