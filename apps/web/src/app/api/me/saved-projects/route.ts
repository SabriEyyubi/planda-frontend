import {
  authenticatedApiRequest,
  privateJsonResponse,
} from '@/lib/api/authenticated-bff';

export async function GET() {
  const { response, error } =
    await authenticatedApiRequest('/me/saved-projects');
  if (error) return error;
  return privateJsonResponse(await response!.json(), {
    status: response!.status,
  });
}
