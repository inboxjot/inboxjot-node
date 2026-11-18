export type SignUserTokenOptions = {
  secret: string;
  email?: string;
  userId?: string;
  expiresIn?: number;
};

const MAX_EXPIRES_IN = 30 * 24 * 60 * 60;

function toBase64Url(bytes: Uint8Array) {
  let text = '';
  for (const byte of bytes) {
    text += String.fromCharCode(byte);
  }

  return btoa(text).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function encodeJson(value: unknown) {
  return toBase64Url(new TextEncoder().encode(JSON.stringify(value)));
}

export async function signUserToken(
  options: SignUserTokenOptions
): Promise<string> {
  const { secret, email, userId, expiresIn = 24 * 60 * 60 } = options;

  if (!email && !userId) {
    throw new Error('A user token needs an email or a userId.');
  }
  if (expiresIn <= 0 || expiresIn > MAX_EXPIRES_IN) {
    throw new Error('A user token can last at most 30 days.');
  }

  const header = encodeJson({ alg: 'HS256', typ: 'JWT' });
  const payload = encodeJson({
    ...(email ? { email } : {}),
    ...(userId ? { user_id: userId } : {}),
    exp: Math.floor(Date.now() / 1000) + expiresIn,
  });
  const input = `${header}.${payload}`;

  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign(
    'HMAC',
    key,
    new TextEncoder().encode(input)
  );

  return `${input}.${toBase64Url(new Uint8Array(signature))}`;
}
