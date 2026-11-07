import { vi } from 'vite-plus/test';

import { Inboxjot } from '../src';

export function mockFetch(...replies: (Response | Error)[]) {
  return vi.fn(async (_url: string | URL | Request, _init?: RequestInit) => {
    const reply = replies.shift();
    if (!reply) {
      throw new Error('No more replies');
    }
    if (reply instanceof Error) {
      throw reply;
    }

    return reply;
  });
}

export function json(
  body: unknown,
  status = 200,
  headers: Record<string, string> = {}
) {
  const init = {
    status,
    headers: { 'Content-Type': 'application/json', ...headers },
  };

  return new Response(JSON.stringify(body), init);
}

export function apiError(
  status: number,
  name: string,
  headers: Record<string, string> = {}
) {
  const body = {
    name,
    status,
    message: `${name} message`,
    errors: [],
    request_id: 'req_1',
  };

  return json(body, status, headers);
}

export function createClient(
  fetch: ReturnType<typeof mockFetch>,
  maxRetries = 2
) {
  return new Inboxjot({
    apiKey: 'ibx_test',
    baseUrl: 'https://api.test/',
    fetch,
    maxRetries,
  });
}

export function readCall(fetch: ReturnType<typeof mockFetch>, index = 0) {
  const [url, init] = fetch.mock.calls[index] ?? [];

  return {
    url,
    init: init as RequestInit & { headers: Record<string, string> },
  };
}

export function readRoutes(fetch: ReturnType<typeof mockFetch>) {
  return fetch.mock.calls.map(
    ([url, init]) => `${init?.method} ${url as string}`
  );
}
