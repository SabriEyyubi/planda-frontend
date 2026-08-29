export const PRIVATE_CACHE_CONTROL = 'private, no-store';

export function applyPrivateNoStore<T extends Response>(response: T): T {
  response.headers.set('cache-control', PRIVATE_CACHE_CONTROL);
  return response;
}
