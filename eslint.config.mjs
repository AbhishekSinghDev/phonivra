import js from '@eslint/js'
import globals from 'globals'
import tseslint from 'typescript-eslint'
import reactHooks from 'eslint-plugin-react-hooks'

export default tseslint.config(
  { ignores: ['node_modules/**', 'out/**', 'dist/**'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{ts,tsx,mjs}'],
    languageOptions: { globals: globals.node }
  },
  {
    files: ['src/renderer/src/**/*.{ts,tsx}'],
    languageOptions: { globals: globals.browser },
    plugins: { 'react-hooks': reactHooks },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            'node:*',
            'electron',
            '@electron-toolkit/*',
            'fs',
            'path',
            'os',
            'child_process',
            'http',
            'https',
            'net',
            'tls',
            'crypto',
            'stream',
            'buffer',
            'process'
          ]
        }
      ]
    }
  }
)
