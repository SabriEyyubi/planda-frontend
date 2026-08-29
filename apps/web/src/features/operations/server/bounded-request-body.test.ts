import { describe, expect, it } from 'vitest';
import {
  InvalidJsonBodyError,
  readJsonRequestWithinLimit,
  readRequestBodyWithinLimit,
  RequestBodyTooLargeError,
} from './bounded-request-body';

describe('readRequestBodyWithinLimit', () => {
  it('rejects a declared body larger than the limit without reading it', async () => {
    const request = new Request('http://localhost/upload', {
      method: 'POST',
      headers: { 'content-length': '11' },
      body: 'small',
    });

    await expect(
      readRequestBodyWithinLimit(request, 10),
    ).rejects.toBeInstanceOf(RequestBodyTooLargeError);
    expect(request.bodyUsed).toBe(false);
  });

  it('stops a chunked body as soon as it crosses the limit', async () => {
    const body = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(new Uint8Array(6));
        controller.enqueue(new Uint8Array(6));
        controller.close();
      },
    });
    const request = new Request('http://localhost/upload', {
      method: 'POST',
      body,
      duplex: 'half',
    } as RequestInit & { duplex: 'half' });

    await expect(
      readRequestBodyWithinLimit(request, 10),
    ).rejects.toBeInstanceOf(RequestBodyTooLargeError);
  });

  it('returns a body that is within the limit', async () => {
    const request = new Request('http://localhost/upload', {
      method: 'POST',
      body: 'planda',
    });

    const body = await readRequestBodyWithinLimit(request, 10);
    expect(new TextDecoder().decode(body)).toBe('planda');
  });

  it('parses bounded JSON and rejects malformed JSON', async () => {
    await expect(
      readJsonRequestWithinLimit(
        new Request('http://localhost/body', {
          method: 'POST',
          body: '{"ok":true}',
        }),
        100,
      ),
    ).resolves.toEqual({ ok: true });
    await expect(
      readJsonRequestWithinLimit(
        new Request('http://localhost/body', {
          method: 'POST',
          body: '{broken',
        }),
        100,
      ),
    ).rejects.toBeInstanceOf(InvalidJsonBodyError);
  });
});
