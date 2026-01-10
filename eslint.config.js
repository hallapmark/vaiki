import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'


/*
  This file enables type-aware rules by pointing parserOptions.project to
  tsconfigs. That allows `tseslint.configs.recommendedTypeChecked` (or strictTypeChecked).
  lint runs are slower if type-checked mode is enabled.
  See README of initial commit for vite-provided instructions.
*/
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      // Type-aware recommended config. Use `recommendedTypeChecked` for type-checked rules
      tseslint.configs.recommendedTypeChecked,

      reactHooks.configs['recommended-latest'],
      // optionally add stylistic or stricter configs:
      // tseslint.configs.stylisticTypeChecked,
      // tseslint.configs.strictTypeChecked,
      reactX.configs['recommended-typescript'], 
      reactDom.configs.recommended,

      reactRefresh.configs.vite
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        // point ESLint to the tsconfig files so type-aware rules work
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
])
