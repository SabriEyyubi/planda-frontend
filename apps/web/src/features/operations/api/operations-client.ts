export type OperationError = Error & {
  status?: number;
  requestId?: string;
  code?: string;
};

export async function operationsRequest<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const bodyIsFormData = init?.body instanceof FormData;
  const response = await fetch(`/api/operations${path}`, {
    cache: 'no-store',
    ...init,
    headers:
      init?.body && !bodyIsFormData
        ? { 'content-type': 'application/json', ...init.headers }
        : init?.headers,
  });
  if (!response.ok) {
    if (redirectAfterUnauthorized(response)) {
      throw Object.assign(new Error('AUTH_REQUIRED'), { status: 401 });
    }
    const body = (await response.json().catch(() => null)) as {
      code?: string;
      requestId?: string;
    } | null;
    const error = new Error(body?.code ?? 'OPERATION_FAILED') as OperationError;
    error.status = response.status;
    error.code = body?.code;
    error.requestId =
      body?.requestId ?? response.headers.get('x-request-id') ?? undefined;
    throw error;
  }
  return response.status === 204
    ? (undefined as T)
    : ((await response.json()) as T);
}

export function listItems<T>(value: T[] | { items: T[] }) {
  return Array.isArray(value) ? value : value.items;
}
import { redirectAfterUnauthorized } from '@/lib/auth/login-redirect';
