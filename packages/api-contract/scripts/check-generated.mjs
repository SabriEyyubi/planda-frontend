import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

const packageDirectory = new URL('..', import.meta.url);
const temporaryDirectory = mkdtempSync(join(tmpdir(), 'planda-contract-'));
const generatedPath = join(temporaryDirectory, 'schema.ts');
try {
  const result = spawnSync(
    'openapi-typescript',
    ['openapi/openapi.json', '-o', generatedPath],
    { cwd: packageDirectory, encoding: 'utf8' },
  );
  if (result.status !== 0) throw new Error(result.stderr || result.stdout);
  const expected = readFileSync(
    new URL('../src/generated/schema.ts', import.meta.url),
    'utf8',
  );
  const actual = readFileSync(generatedPath, 'utf8');
  if (actual !== expected) {
    throw new Error('Generated API schema drifted. Run pnpm api:generate.');
  }
  process.stdout.write('Generated API schema matches OpenAPI snapshot.\n');
} finally {
  rmSync(temporaryDirectory, { recursive: true, force: true });
}
