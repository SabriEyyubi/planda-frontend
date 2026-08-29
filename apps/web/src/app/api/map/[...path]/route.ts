import type { NextRequest } from 'next/server';

const MAP_ORIGIN = 'https://tiles.openfreemap.org';
const ALLOWED_SEGMENT = /^[a-zA-Z0-9_.@{}% ,+-]+$/;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const path = (await params).path;
  if (
    path.length === 0 ||
    path.some(
      (segment) =>
        !segment ||
        segment === '.' ||
        segment === '..' ||
        segment.length > 200 ||
        !ALLOWED_SEGMENT.test(segment),
    )
  )
    return Response.json({ code: 'INVALID_MAP_RESOURCE' }, { status: 400 });
  const upstreamPath = path.map(encodeURIComponent).join('/');
  try {
    const upstream = await fetch(`${MAP_ORIGIN}/${upstreamPath}`, {
      headers: { accept: request.headers.get('accept') ?? '*/*' },
      signal: AbortSignal.timeout(12_000),
      next: { revalidate: 86_400 },
    });
    if (!upstream.ok)
      return Response.json(
        { code: 'MAP_RESOURCE_UNAVAILABLE' },
        { status: upstream.status },
      );
    const contentType =
      upstream.headers.get('content-type') ?? 'application/octet-stream';
    const headers = {
      'content-type': contentType,
      'cache-control': 'public, max-age=86400, stale-while-revalidate=604800',
    };
    if (contentType.includes('json')) {
      const body = (await upstream.text()).replaceAll(MAP_ORIGIN, '/api/map');
      return new Response(body, { headers });
    }
    return new Response(upstream.body, { headers });
  } catch {
    return Response.json({ code: 'MAP_RESOURCE_UNAVAILABLE' }, { status: 503 });
  }
}
