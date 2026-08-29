import type { NextRequest } from 'next/server';
import {
  authenticatedApiRequest,
  privateEmptyResponse,
  privateJsonResponse,
} from '@/lib/api/authenticated-bff';
import { isSameOriginRequest } from '@/lib/auth/csrf';

async function mutate(
  request: NextRequest,
  projectId: string,
  method: 'PUT' | 'DELETE',
) {
  if (!isSameOriginRequest(request.headers))
    return privateJsonResponse({ code: 'CSRF_REJECTED' }, { status: 403 });
  const { response, error } = await authenticatedApiRequest(
    `/me/saved-projects/${encodeURIComponent(projectId)}`,
    { method },
  );
  if (error) return error;
  return privateEmptyResponse({ status: response!.status });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> },
) {
  return mutate(request, (await params).projectId, 'PUT');
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> },
) {
  return mutate(request, (await params).projectId, 'DELETE');
}
