import 'server-only';
import { ApiError } from '@/lib/api/errors';
import { serverApiRequest } from '@/lib/api/server';
import { projectFixtures } from '@/features/projects/model/fixtures';
import { usesProjectFixtures } from '@/features/projects/api/projects-adapter';

export type CityCatalogItem = {
  id: string;
  code: string;
  name: string;
  slug: string;
  publishedProjectCount: number;
  startingPrice: string | null;
  currency: string | null;
};
export type DeveloperCatalogItem = {
  id: string;
  name: string;
  slug: string;
  verifiedAt: string | null;
  about: string | null;
  logoUrl: string | null;
  publishedProjectCount: number;
  startingPrice: string | null;
  currency: string | null;
};

export async function getCities(): Promise<CityCatalogItem[]> {
  if (usesProjectFixtures()) return [fixtureCity];
  const response = await serverApiRequest('/locations/cities', {
    next: { revalidate: 300 },
  });
  return (await response.json()) as CityCatalogItem[];
}

export async function getCity(slug: string): Promise<CityCatalogItem | null> {
  if (usesProjectFixtures())
    return slug === fixtureCity.slug ? fixtureCity : null;
  return requestDetail<CityCatalogItem>(
    `/locations/cities/${encodeURIComponent(slug)}`,
  );
}

export async function getDevelopers(): Promise<DeveloperCatalogItem[]> {
  if (usesProjectFixtures()) return fixtureDevelopers;
  const response = await serverApiRequest('/developers', {
    next: { revalidate: 300 },
  });
  return (await response.json()) as DeveloperCatalogItem[];
}

export async function getDeveloper(
  slug: string,
): Promise<DeveloperCatalogItem | null> {
  if (usesProjectFixtures())
    return fixtureDevelopers.find((item) => item.slug === slug) ?? null;
  return requestDetail<DeveloperCatalogItem>(
    `/developers/${encodeURIComponent(slug)}`,
  );
}

async function requestDetail<T>(path: string): Promise<T | null> {
  try {
    const response = await serverApiRequest(path, {
      next: { revalidate: 300 },
    });
    return (await response.json()) as T;
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  }
}

const fixtureCity: CityCatalogItem = {
  id: projectFixtures[0]!.province.id,
  code: projectFixtures[0]!.province.code,
  name: projectFixtures[0]!.province.name,
  slug: projectFixtures[0]!.province.slug,
  publishedProjectCount: projectFixtures.length,
  startingPrice: String(
    Math.min(...projectFixtures.map((item) => Number(item.startingPrice))),
  ),
  currency: 'TRY',
};
const fixtureDevelopers: DeveloperCatalogItem[] = projectFixtures.map(
  (project, index) => ({
    id: `fixture-developer-${index}`,
    name: project.developerName,
    slug: project.developerName.toLocaleLowerCase('tr').replaceAll(' ', '-'),
    verifiedAt: project.developerVerified ? '2026-01-01T00:00:00.000Z' : null,
    about: null,
    logoUrl: null,
    publishedProjectCount: 1,
    startingPrice: project.startingPrice,
    currency: project.currency,
  }),
);
