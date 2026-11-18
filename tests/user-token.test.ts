import { describe, expect, it } from 'vite-plus/test';

import { Inboxjot, signUserToken } from '../src';
import { json, mockFetch, readCall } from './fetch';

describe('signUserToken', () => {
  it('signs an HS256 token with the user and an expiry', async () => {
    const token = await signUserToken({
      secret: 'ibxts_secret',
      userId: 'usr_1',
      expiresIn: 60,
    });

    const [header, payload, signature] = token.split('.');
    const fromBase64Url = (text: string) =>
      Uint8Array.from(
        atob(text.replace(/-/g, '+').replace(/_/g, '/')),
        (character) => character.charCodeAt(0)
      );
    const key = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode('ibxts_secret'),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );
    const isValid = await crypto.subtle.verify(
      'HMAC',
      key,
      fromBase64Url(signature!),
      new TextEncoder().encode(`${header}.${payload}`)
    );
    const claims = JSON.parse(
      new TextDecoder().decode(fromBase64Url(payload!))
    );

    expect(isValid).toBe(true);
    expect(claims.user_id).toBe('usr_1');
    expect(claims.exp - Math.floor(Date.now() / 1000)).toBeLessThanOrEqual(60);
  });

  it('refuses a token without a user or over 30 days', async () => {
    await expect(signUserToken({ secret: 's' })).rejects.toThrow();
    await expect(
      signUserToken({ secret: 's', userId: 'u', expiresIn: 31 * 86_400 })
    ).rejects.toThrow();
  });

  it('sends the user token with every request', async () => {
    const fetch = mockFetch(json({ contact_id: 'con_1' }));
    const client = new Inboxjot({
      apiKey: 'ibx_tracking',
      baseUrl: 'https://api.test',
      fetch,
      userToken: 'ut_1',
    });

    await client.events.send({ name: 'page.viewed' });

    expect(readCall(fetch).init.headers['X-Inboxjot-User-Token']).toBe('ut_1');
  });
});
