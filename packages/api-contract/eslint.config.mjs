import js from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['src/generated/**'] },
  {
    files: ['scripts/**/*.mjs'],
    languageOptions: {
      globals: { URL: 'readonly', process: 'readonly' },
    },
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
);
