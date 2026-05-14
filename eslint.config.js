import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import jsxA11y from 'eslint-plugin-jsx-a11y'
import testingLibrary from 'eslint-plugin-testing-library'
import tseslint from 'typescript-eslint'
import prettier from 'eslint-config-prettier'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist', '**/dist/**', 'node_modules', 'playwright-report', 'test-results']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
      jsxA11y.flatConfigs.recommended,
    ],
    languageOptions: {
      globals: globals.browser,
    },
  },
  {
    files: ['{apps,packages}/**/src/**/*.{test,spec}.{ts,tsx}', '{apps,packages}/**/src/test/**/*.{ts,tsx}'],
    extends: [testingLibrary.configs['flat/react']],
  },
  {
    files: ['packages/ui/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': ['error', {
        paths: [
          { name: '@jazzlore/music-core', message: 'packages/ui must not depend on music-core; pass derived data via props' },
          { name: '@tonaljs/note', message: 'packages/ui must not import music libs directly' },
          { name: 'tone', message: 'packages/ui must not import music libs directly' },
          { name: 'abcjs', message: 'packages/ui must not import music libs directly' },
        ],
      }],
    },
  },
  prettier,
])
