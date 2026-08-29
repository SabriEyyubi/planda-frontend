export type SearchParamValue = string | string[] | undefined;

export const projectQueryKeys = [
  'q',
  'provinceId',
  'districtId',
  'minPrice',
  'maxPrice',
  'roomType',
  'deliveryBefore',
  'maxDownPaymentPercent',
  'maxMonthlyPayment',
  'status',
  'minNetArea',
  'amenities',
  'bounds',
  'sort',
  'cursor',
  'limit',
] as const;

export type ProjectQueryKey = (typeof projectQueryKeys)[number];
export type ProjectSearchParams = Partial<Record<ProjectQueryKey, string>>;
export type ProjectSort =
  'NEWEST' | 'PRICE_ASC' | 'PRICE_DESC' | 'DELIVERY_ASC';

const legacyProjectSort: Record<string, ProjectSort> = {
  recommended: 'NEWEST',
  freshness_desc: 'NEWEST',
  price_asc: 'PRICE_ASC',
  price_desc: 'PRICE_DESC',
  delivery_asc: 'DELIVERY_ASC',
};

export function normalizeProjectSort(value: string): ProjectSort | undefined {
  if (
    value === 'NEWEST' ||
    value === 'PRICE_ASC' ||
    value === 'PRICE_DESC' ||
    value === 'DELIVERY_ASC'
  ) {
    return value;
  }
  return legacyProjectSort[value.toLowerCase()];
}

export function normalizeProjectSearchParams(
  source: Record<string, SearchParamValue>,
): ProjectSearchParams {
  const normalized: ProjectSearchParams = {};
  for (const key of projectQueryKeys) {
    const raw = source[key];
    const value = Array.isArray(raw) ? raw[0] : raw;
    if (!value?.trim()) continue;
    const trimmed = value.trim();
    if (key === 'sort') {
      const sort = normalizeProjectSort(trimmed);
      if (sort) normalized.sort = sort;
      continue;
    }
    normalized[key] = trimmed;
  }
  return normalized;
}

export function serializeProjectSearchParams(source: ProjectSearchParams) {
  const query = new URLSearchParams();
  for (const key of projectQueryKeys) {
    const value =
      key === 'sort' && source.sort
        ? normalizeProjectSort(source.sort)
        : source[key];
    if (value) query.set(key, value);
  }
  return query.toString();
}
