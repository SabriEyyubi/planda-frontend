import { OPERATIONS_ROUTES } from '@planda/api-contract';

const token = '[a-zA-Z0-9-]+';
const rules: Record<string, RegExp[]> = Object.fromEntries(
  Object.entries(OPERATIONS_ROUTES).map(([method, paths]) => [
    method,
    paths.map(
      (path) =>
        new RegExp(
          `^${path.replace(/:[a-zA-Z]+/g, token).replaceAll('/', '\\/')}$`,
        ),
    ),
  ]),
);

export function allowedOperationsPath(
  method: string,
  area: string,
  segments: string[],
) {
  const path = [area, ...segments].join('/');
  return Boolean(rules[method]?.some((rule) => rule.test(path)))
    ? `/${path}`
    : null;
}
