export function assertRelativeApiPath(path: string) {
  if (!path.startsWith('/') || path.startsWith('//')) {
    throw new TypeError('API path must be an absolute-path reference.');
  }
  return path;
}
