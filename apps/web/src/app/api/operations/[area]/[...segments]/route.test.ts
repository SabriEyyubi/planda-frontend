import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const mocks = vi.hoisted(() => ({ authenticatedApiRequest: vi.fn() }));
vi.mock('@/lib/api/authenticated-bff', () => ({
  authenticatedApiRequest: mocks.authenticatedApiRequest,
  privateJsonResponse: (body: unknown, init?: ResponseInit) =>
    Response.json(body, init),
  privateEmptyResponse: (init?: ResponseInit) => new Response(null, init),
}));

import { POST } from './route';

const context = {
  params: Promise.resolve({
    area: 'developer',
    segments: ['projects', '10000000-0000-4000-8000-000000000001', 'media'],
  }),
};

describe('/api/operations media forwarding', () => {
  beforeEach(() => vi.clearAllMocks());

  it('authenticates before consuming a multipart body', async () => {
    const request = multipartRequest('image-bytes');
    mocks.authenticatedApiRequest.mockResolvedValueOnce({
      response: null,
      error: Response.json({ code: 'UNAUTHENTICATED' }, { status: 401 }),
    });

    const response = await POST(request, context);

    expect(response.status).toBe(401);
    expect(request.bodyUsed).toBe(false);
    expect(mocks.authenticatedApiRequest).toHaveBeenCalledWith('/me/profile');
  });

  it('authenticates before consuming a JSON body', async () => {
    const request = jsonRequest('{"version":1}');
    mocks.authenticatedApiRequest.mockResolvedValueOnce({
      response: null,
      error: Response.json({ code: 'UNAUTHENTICATED' }, { status: 401 }),
    });

    const response = await POST(request, context);

    expect(response.status).toBe(401);
    expect(request.bodyUsed).toBe(false);
    expect(mocks.authenticatedApiRequest).toHaveBeenCalledWith('/me/profile');
  });

  it('rejects an oversized declared body before consuming it', async () => {
    const request = multipartRequest('image-bytes', {
      'content-length': String(11 * 1024 * 1024),
    });
    mocks.authenticatedApiRequest.mockResolvedValueOnce({
      response: new Response('{}'),
      error: null,
    });

    const response = await POST(request, context);

    expect(response.status).toBe(413);
    await expect(response.json()).resolves.toEqual({
      code: 'PAYLOAD_TOO_LARGE',
    });
    expect(request.bodyUsed).toBe(false);
    expect(mocks.authenticatedApiRequest).toHaveBeenCalledTimes(1);
  });

  it('forwards a bounded multipart body after authentication', async () => {
    const request = multipartRequest('image-bytes');
    mocks.authenticatedApiRequest
      .mockResolvedValueOnce({ response: new Response('{}'), error: null })
      .mockResolvedValueOnce({
        response: Response.json({ id: 'media-id' }, { status: 201 }),
        error: null,
      });

    const response = await POST(request, context);

    expect(response.status).toBe(201);
    expect(mocks.authenticatedApiRequest).toHaveBeenNthCalledWith(
      2,
      '/developer/projects/10000000-0000-4000-8000-000000000001/media',
      expect.objectContaining({
        method: 'POST',
        body: expect.any(ArrayBuffer),
      }),
    );
  });
});

function multipartRequest(
  body: string,
  extraHeaders: Record<string, string> = {},
) {
  return new NextRequest(
    'http://localhost/api/operations/developer/project/media',
    {
      method: 'POST',
      headers: {
        host: 'localhost',
        origin: 'http://localhost',
        'content-type': 'multipart/form-data; boundary=planda',
        ...extraHeaders,
      },
      body,
    },
  );
}

function jsonRequest(body: string) {
  return new NextRequest(
    'http://localhost/api/operations/developer/project/media',
    {
      method: 'POST',
      headers: {
        host: 'localhost',
        origin: 'http://localhost',
        'content-type': 'application/json',
      },
      body,
    },
  );
}
