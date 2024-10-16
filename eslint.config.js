// eslint-disable-next-line no-undef
const js = require('@eslint/js');
// eslint-disable-next-line no-undef
const typescript = require('@typescript-eslint/eslint-plugin');
// eslint-disable-next-line no-undef
const typescriptParser = require('@typescript-eslint/parser');

// eslint-disable-next-line no-undef
module.exports = [
  js.configs.recommended,
  {
    files: ['src/**/*.ts'],
    ignores: ['**/node_modules/**', '**/dist/**'],
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        project: './tsconfig.json',
      },
      globals: {
        NodeJS: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        console: 'readonly',
      },
    },
    plugins: {
      '@typescript-eslint': typescript,
    },
    rules: {
      ...typescript.configs['recommended'].rules,
      quotes: ['error', 'single'],
      indent: ['error', 2, { SwitchCase: 1 }],
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
  },
];
