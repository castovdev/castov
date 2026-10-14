import js from '@eslint/js';
import next from 'eslint-config-next';
import globals from 'globals';

const eslintConfig = [
  {
    ignores: [
      'node_modules/**',
      '.next/**',
      'dist/**',
      'packages/*/dist/**',
      'build/**',
      'out/**',
      'coverage/**',
      '*.tsbuildinfo',
      'next-env.d.ts',
    ],
  },
  js.configs.recommended,
  ...next,
  {
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
        React: 'readonly',
      },
    },
    rules: {
      // Non-critical stylistic overrides
      'react/no-unescaped-entities': 'off',
      'react/jsx-no-comment-textnodes': 'off',
      'no-case-declarations': 'off',
      'no-useless-escape': 'off',
    },
  },
  {
    files: ['**/*.ts', '**/*.tsx'],
    rules: {
      'no-undef': 'off',
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
    },
  },
];

export default eslintConfig;
