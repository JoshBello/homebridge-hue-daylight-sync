import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';

export default [
  {
    ignores: ['dist/**'],
    rules: {
      quotes: ['error', 'single'],
      indent: ['error', 2, { SwitchCase: 1 }], // Enforce 2 spaces with 1 level indentation for `case` blocks
      'linebreak-style': ['error', 'unix'],
      semi: ['error', 'always'],
      'comma-dangle': ['error', 'always-multiline'],
      'dot-notation': 'error',
      eqeqeq: ['error', 'smart'],
      curly: ['error', 'all'],
      'brace-style': ['error'],
      'prefer-arrow-callback': 'warn',
      'max-len': ['warn', 160],
      'object-curly-spacing': ['error', 'always'],
      'no-use-before-define': 'off',
      '@typescript-eslint/no-use-before-define': ['error', { classes: false, enums: false }],
      '@typescript-eslint/no-unused-vars': ['error', { caughtErrors: 'none' }],
    },
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
    },
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
];