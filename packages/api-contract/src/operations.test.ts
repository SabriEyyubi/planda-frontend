import { describe, expect, it } from 'vitest';
import { OPERATIONS_ROUTES } from './index';
import openApi from '../openapi/openapi.json';

describe('operations contract manifest', () => {
  it('is deterministic and contains no duplicate method/path pairs', () => {
    const routes = Object.entries(OPERATIONS_ROUTES).flatMap(
      ([method, paths]) => paths.map((path) => `${method} ${path}`),
    );
    expect(new Set(routes).size).toBe(routes.length);
    expect(routes).toHaveLength(34);
  });
  it('contains only method/path pairs present in the generated OpenAPI source', () => {
    for (const [method, routes] of Object.entries(OPERATIONS_ROUTES)) {
      for (const route of routes) {
        const normalizedRoute = `/api/v1/${route}`.replace(/:[^/]+/g, ':param');
        const openApiPath = Object.keys(openApi.paths).find(
          (path) =>
            path.replace(/\{[^/]+\}/g, ':param') === normalizedRoute &&
            method.toLowerCase() in
              openApi.paths[path as keyof typeof openApi.paths],
        );
        expect(openApiPath).toBeDefined();
      }
    }
  });
});
