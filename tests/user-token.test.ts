import { describe, expect, it } from 'vite-plus/test';

import { signUserToken } from '../src';

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
});
