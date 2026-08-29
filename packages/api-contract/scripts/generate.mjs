import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

const contractPath = new URL('../openapi/openapi.json', import.meta.url);
const generatedDirectory = new URL('../src/generated/', import.meta.url);

if (!existsSync(contractPath)) {
  throw new Error(
    'Backend OpenAPI contract is missing: packages/api-contract/openapi/openapi.json',
  );
}

mkdirSync(generatedDirectory, { recursive: true });
const result = spawnSync(
  'openapi-typescript',
  ['openapi/openapi.json', '-o', 'src/generated/schema.ts'],
  { cwd: new URL('..', import.meta.url), encoding: 'utf8' },
);

if (result.status !== 0) {
  throw new Error(
    result.stderr || result.stdout || 'OpenAPI generation failed.',
  );
}

writeFileSync(
  new URL('client.ts', generatedDirectory),
  `import createClient from 'openapi-fetch';\nimport type { paths } from './schema';\n\nexport function createApiClient(baseUrl: string) {\n  return createClient<paths>({ baseUrl });\n}\n`,
);
process.stdout.write('Generated OpenAPI schema and typed client.\n');
