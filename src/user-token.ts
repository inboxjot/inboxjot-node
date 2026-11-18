export type Duration = `${number}${'s' | 'm' | 'h' | 'd'}`;

export type SignUserTokenOptions = {
  secret: string;
  email?: string;
  userId?: string;
  expiresIn?: Duration;
};

const MAX_EXPIRES_IN = 30 * 24 * 60 * 60;
const UNIT_SECONDS = { s: 1, m: 60, h: 60 * 60, d: 24 * 60 * 60 };

function toSeconds(duration: string) {
  const match = /^(\d+)([smhd])$/.exec(duration);
  if (!match) {
    return Number.NaN;
  }

  return Number(match[1]) * UNIT_SECONDS[match[2] as keyof typeof UNIT_SECONDS];
}

function toBase64Url(input: string | Uint8Array) {
  const bytes =
    typeof input === 'string' ? new TextEncoder().encode(input) : input;
  let text = '';
  for (const byte of bytes) {
    text += String.fromCharCode(byte);
  }

  return btoa(text).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export async function signUserToken(
  options: SignUserTokenOptions
): Promise<string> {
  const { secret, email, userId, expiresIn = '1h' } = options;
  const seconds = toSeconds(expiresIn);

  if (!email && !userId) {
    throw new Error('A user token needs an email or a userId.');
  }
  if (!(seconds > 0 && seconds <= MAX_EXPIRES_IN)) {
    throw new Error(
      "Set expiresIn to a duration such as '1h' or '30d', up to 30 days."
    );
  }

  const header = toBase64Url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payload = toBase64Url(
    JSON.stringify({
      ...(email ? { email } : {}),
      ...(userId ? { user_id: userId } : {}),
      exp: Math.floor(Date.now() / 1000) + seconds,
    })
  );
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
