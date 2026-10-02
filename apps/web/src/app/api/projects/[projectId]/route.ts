import { getProject } from '@/features/projects/api/projects-adapter';
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ projectId: string }> },
) {
  const { projectId } = await params;
  if (!/^[a-zA-Z0-9-]{1,120}$/.test(projectId))
    return Response.json({ code: 'INVALID_PROJECT' }, { status: 400 });
  try {
    const project = await getProject(projectId);
    return Response.json(project ?? { code: 'PROJECT_NOT_FOUND' }, {
      status: project ? 200 : 404,
      headers: { 'cache-control': 'no-store' },
    });
  } catch {
    return Response.json(
      { code: 'PROJECT_UNAVAILABLE' },
      { status: 503, headers: { 'cache-control': 'no-store' } },
    );
  }
}
