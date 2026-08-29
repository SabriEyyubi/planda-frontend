export class RequestBodyTooLargeError extends Error {
  constructor() {
    super('REQUEST_BODY_TOO_LARGE');
  }
}

export class InvalidJsonBodyError extends Error {
  constructor() {
    super('INVALID_JSON');
  }
}

export async function readRequestBodyWithinLimit(
  request: Request,
  maxBytes: number,
): Promise<ArrayBuffer> {
  const contentLength = request.headers.get('content-length');
  if (contentLength) {
    const declaredBytes = Number(contentLength);
    if (
      !Number.isSafeInteger(declaredBytes) ||
      declaredBytes < 0 ||
      declaredBytes > maxBytes
    ) {
      throw new RequestBodyTooLargeError();
    }
  }

  if (!request.body) return new ArrayBuffer(0);
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let totalBytes = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      totalBytes += value.byteLength;
      if (totalBytes > maxBytes) throw new RequestBodyTooLargeError();
      chunks.push(value);
    }
  } catch (error) {
    await reader.cancel().catch(() => undefined);
    throw error;
  }

  const body = new Uint8Array(totalBytes);
  let offset = 0;
  for (const chunk of chunks) {
    body.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return body.buffer;
}

export async function readJsonRequestWithinLimit(
  request: Request,
  maxBytes: number,
): Promise<unknown> {
  const body = await readRequestBodyWithinLimit(request, maxBytes);
  try {
    return JSON.parse(new TextDecoder().decode(body)) as unknown;
  } catch {
    throw new InvalidJsonBodyError();
  }
}
