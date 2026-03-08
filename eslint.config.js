//  @ts-check

import { tanstackConfig } from '@tanstack/eslint-config'
import eslintConfigPrettier from 'eslint-plugin-prettier/recommended'

export default [
  ...tanstackConfig,
  eslintConfigPrettier,
  {
    rules: {
      'import/no-cycle': 'off',
      'import/order': 'off',
      'sort-imports': 'off',
      '@typescript-eslint/array-type': 'off',
      '@typescript-eslint/require-await': 'off',
      'pnpm/json-enforce-catalog': 'off',
      'prettier/prettier': ['error', { endOfLine: 'auto' }],
    },
  },
  {
    ignores: [
      'eslint.config.js',
      'prettier.config.js',
      'src/client/**',
      '.output',
      '.amplify-hosting',
      '.wrangler',
    ],
  },
]
