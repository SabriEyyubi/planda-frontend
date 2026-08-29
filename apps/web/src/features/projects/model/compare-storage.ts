export const COMPARE_STORAGE_KEY = 'planda.compare-projects.v1';
export const MAX_COMPARE_PROJECTS = 4;

export function normalizeCompareIds(ids: readonly string[]) {
  return [...new Set(ids.map((id) => id.trim()).filter(Boolean))].slice(
    0,
    MAX_COMPARE_PROJECTS,
  );
}

export function readCompareIds(value: string | null) {
  if (!value) return [];
  try {
    const parsed: unknown = JSON.parse(value);
    return Array.isArray(parsed)
      ? normalizeCompareIds(
          parsed.filter((id): id is string => typeof id === 'string'),
        )
      : [];
  } catch {
    return [];
  }
}

export function toggleCompareId(ids: readonly string[], id: string) {
  const normalized = normalizeCompareIds(ids);
  if (normalized.includes(id)) return normalized.filter((item) => item !== id);
  return normalized.length < MAX_COMPARE_PROJECTS
    ? [...normalized, id]
    : normalized;
}
