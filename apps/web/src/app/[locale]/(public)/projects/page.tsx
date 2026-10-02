import { CatalogListing } from '@/features/catalog/components/catalog-listing';
import type { SearchParamValue } from '@/features/projects/model/project-query';

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, SearchParamValue>>;
}) {
  return <CatalogListing searchParams={await searchParams} />;
}
