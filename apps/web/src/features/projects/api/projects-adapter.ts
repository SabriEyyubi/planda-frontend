import 'server-only';
import type { components } from '@planda/api-contract';
import { serverApiRequest } from '@/lib/api/server';
import { ApiError } from '@/lib/api/errors';
import { detailFixtureFor, projectFixtures } from '../model/fixtures';
import type { ProjectDetail, ProjectListResponse } from '../model/project';

type ApiProjectDetail = components['schemas']['ProjectDetailResponseDto'];
type ApiProjectList = components['schemas']['ProjectListResponseDto'];

export function usesProjectFixtures() {
  return process.env.USE_MOCK_DATA === 'true';
}

export async function getProjects(search = ''): Promise<ProjectListResponse> {
  if (usesProjectFixtures()) {
    const query = new URLSearchParams(search);
    const provinceId = query.get('provinceId');
    const developerOrganizationId = query.get('developerOrganizationId');
    const items = projectFixtures.filter(
      (project) =>
        (!provinceId || project.province.id === provinceId) &&
        (!developerOrganizationId ||
          project.developerOrganizationId === developerOrganizationId),
    );
    return {
      items,
      pageInfo: { hasNextPage: false, nextCursor: null },
    };
  }
  const response = await serverApiRequest(
    `/projects${search ? `?${search}` : ''}`,
    {
      next: { revalidate: 60 },
    },
  );
  const result = (await response.json()) as ApiProjectList;
  return result;
}

export async function getProject(slug: string): Promise<ProjectDetail | null> {
  if (usesProjectFixtures()) return detailFixtureFor(slug) ?? null;
  try {
    const response = await serverApiRequest(
      `/projects/${encodeURIComponent(slug)}`,
      {
        cache: 'no-store',
      },
    );
    const result = (await response.json()) as ApiProjectDetail;
    return result;
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  }
}
