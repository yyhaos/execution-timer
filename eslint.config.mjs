import typescriptEslint from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';

export default [
  {
    ignores: ['out/**', 'out-test/**', 'node_modules/**'],
  },
  {
    files: ['src/**/*.ts'],
    plugins: {
      '@typescript-eslint': typescriptEslint,
    },
    languageOptions: {
      parser: tsParser,
      ecmaVersion: 2019,
      sourceType: 'module',
    },
    rules: {
      curly: 'error',
      eqeqeq: 'error',
      'no-throw-literal': 'error',
      semi: ['error', 'always'],
    },
  },
];
