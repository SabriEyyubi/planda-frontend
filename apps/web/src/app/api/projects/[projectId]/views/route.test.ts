import { describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
vi.mock('server-only', () => ({}));
import { POST } from './route';

describe('/api/projects/:projectId/views', () => {
  it('rejects an oversized declared JSON body without consuming it', async () => {
    const request = new NextRequest(
      'http://localhost/api/projects/project-id/views',
      {
        method: 'POST',
        headers: {
          host: 'localhost',
          origin: 'http://localhost',
          'content-type': 'application/json',
          'content-length': String(8 * 1024),
        },
        body: '{"sessionId":"small"}',
      },
    );

    const response = await POST(request, {
      params: Promise.resolve({ projectId: 'project-id' }),
    });

    expect(response.status).toBe(413);
    expect(request.bodyUsed).toBe(false);
    await expect(response.json()).resolves.toEqual({
      code: 'PAYLOAD_TOO_LARGE',
    });
  });
});
