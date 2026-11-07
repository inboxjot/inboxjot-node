import { defineConfig } from 'vite-plus';

export default defineConfig({
  staged: {
    '*': 'vp check --fix',
  },
  pack: {
    entry: 'src/index.ts',
    format: ['esm', 'cjs'],
    platform: 'neutral',
    dts: true,
  },
  fmt: {
    endOfLine: 'lf',
    singleQuote: true,
    tabWidth: 2,
    trailingComma: 'es5',
    printWidth: 80,
    experimentalSortPackageJson: {
      sortScripts: true,
    },
    sortImports: {},
    ignorePatterns: ['dist/', 'node_modules/', 'openapi.json', 'src/schema.ts'],
  },
  lint: {
    plugins: ['typescript', 'import'],
    rules: {
      'typescript/consistent-type-imports': 'error',
      'import/consistent-type-specifier-style': ['error', 'prefer-top-level'],
      curly: ['error', 'all'],
    },
    overrides: [
      {
        files: ['test/**'],
        rules: { 'typescript/unbound-method': 'off' },
      },
    ],
    options: {
      typeAware: true,
      typeCheck: true,
    },
  },
});
