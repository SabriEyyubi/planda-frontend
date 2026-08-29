type AuthCookieOptions = {
  httpOnly: true;
  secure: boolean;
  sameSite: 'lax';
  path: '/';
  maxAge: number;
};

export function getAuthCookieNames(environment = process.env.NODE_ENV) {
  const prefix = environment === 'production' ? '__Host-' : '';
  return {
    access: `${prefix}planda-access`,
    refresh: `${prefix}planda-refresh`,
  } as const;
}

export function authCookieOptions(
  maxAge: number,
  environment = process.env.NODE_ENV,
): AuthCookieOptions {
  return {
    httpOnly: true,
    secure: environment === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge,
  };
}
