export function safeReturnTo(value: string | null | undefined, fallback = '/') {
  if (!value || !value.startsWith('/') || value.startsWith('//'))
    return fallback;
  try {
    const url = new URL(value, 'http://internal');
    return url.origin === 'http://internal'
      ? `${url.pathname}${url.search}${url.hash}`
      : fallback;
  } catch {
    return fallback;
  }
}
