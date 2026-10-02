export type ApiErrorCode =
  | 'VALIDATION_ERROR'
  | 'UNAUTHENTICATED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'LEAD_CONSENT_VERSION_MISMATCH'
  | 'IDEMPOTENCY_KEY_REUSED'
  | 'RATE_LIMITED'
  | 'AUTH_REFRESH_COORDINATION_UNAVAILABLE'
  | 'SERVER_ERROR'
  | 'NETWORK_ERROR';

export class ApiError extends Error {
  constructor(
    public readonly code: ApiErrorCode,
    public readonly status?: number,
    public readonly requestId?: string,
  ) {
    super(code);
    this.name = 'ApiError';
  }
}

export function normalizeApiError(
  status?: number,
  requestId?: string,
  backendCode?: unknown,
) {
  if (
    status === 409 &&
    (backendCode === 'LEAD_CONSENT_VERSION_MISMATCH' ||
      backendCode === 'IDEMPOTENCY_KEY_REUSED')
  )
    return new ApiError(backendCode, status, requestId);
  const byStatus: Partial<Record<number, ApiErrorCode>> = {
    400: 'VALIDATION_ERROR',
    401: 'UNAUTHENTICATED',
    403: 'FORBIDDEN',
    404: 'NOT_FOUND',
    409: 'CONFLICT',
    429: 'RATE_LIMITED',
  };
  return new ApiError(
    (status && byStatus[status]) || (status ? 'SERVER_ERROR' : 'NETWORK_ERROR'),
    status,
    requestId,
  );
}
