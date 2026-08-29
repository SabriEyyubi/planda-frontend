import { getProjects } from '@/features/projects/api/projects-adapter';
import { MapDiscovery } from '@/features/projects/components/map-discovery';
import {
  normalizeProjectSearchParams,
  serializeProjectSearchParams,
  type SearchParamValue,
} from '@/features/projects/model/project-query';

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, SearchParamValue>>;
}) {
  const filters = normalizeProjectSearchParams(await searchParams);
  const { items } = await getProjects(serializeProjectSearchParams(filters));
  return (
    <main id="main-content" tabIndex={-1} className="map-page">
      <MapDiscovery projects={items} filters={filters} />
    </main>
  );
}
