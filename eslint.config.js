// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');
const reactNativePlugin = require('eslint-plugin-react-native');
const typescriptPlugin = require('@typescript-eslint/eslint-plugin');
const unusedImportsPlugin = require('eslint-plugin-unused-imports');

module.exports = defineConfig([
  ...expoConfig,
  {
    ignores: ['dist/*', 'node_modules/*', '.expo/*'],
    plugins: {
      'react-native': reactNativePlugin,
      '@typescript-eslint': typescriptPlugin,
      'unused-imports': unusedImportsPlugin,
    },
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector: 'ClassDeclaration',
          message: 'Classes are not allowed. Please use functional programming patterns instead.',
        },
        {
          selector: 'TSAsExpression',
          message: 'Type assertions using "as" are not allowed. Use type guards or proper type narrowing instead.',
        },
      ],
      // Ban StyleSheet.create - use NativeWind/Tailwind classes instead
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: 'react-native',
              importNames: ['StyleSheet'],
              message: 'StyleSheet is not allowed. Use NativeWind/Tailwind className instead.',
            },
          ],
        },
      ],
      // Detect unused StyleSheet properties (will error if StyleSheet is somehow used)
      'react-native/no-unused-styles': 'error',
      // Detect unused imports and exports
      'unused-imports/no-unused-imports': 'error',
      'unused-imports/no-unused-vars': [
        'warn',
        {
          vars: 'all',
          varsIgnorePattern: '^_',
          args: 'after-used',
          argsIgnorePattern: '^_',
        },
      ],
      // Detect unused variables and properties
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          vars: 'all',
          args: 'after-used',
          ignoreRestSiblings: true,
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrors: 'all',
        },
      ],
      // Also enable the base no-unused-vars rule (TypeScript version takes precedence)
      'no-unused-vars': 'off',
      // Ban the use of 'any' type
      '@typescript-eslint/no-explicit-any': 'error',
      // Ban unsafe type assertions
      '@typescript-eslint/consistent-type-assertions': [
        'error',
        {
          assertionStyle: 'as',
          objectLiteralTypeAssertions: 'never',
        },
      ],
      // Ban the use of 'as' type assertions - use type guards instead
      'no-restricted-syntax': [
        'error',
        {
          selector: 'ClassDeclaration',
          message: 'Classes are not allowed. Please use functional programming patterns instead.',
        },
        {
          selector: 'TSAsExpression',
          message: 'Type assertions using "as" are not allowed. Use type guards or proper type narrowing instead.',
        },
      ],
      // Ban disabling comments - fix issues instead of disabling them
      'no-warning-comments': [
        'error',
        {
          terms: ['eslint-disable'],
          location: 'anywhere',
        },
      ],
      // Disable exhaustive-deps rule for react-hooks
      'react-hooks/exhaustive-deps': 'off',
    },
  },
  // Node.js scripts configuration
  {
    files: ['scripts/**/*.js', '*.config.js'],
    languageOptions: {
      globals: {
        __dirname: 'readonly',
        __filename: 'readonly',
        require: 'readonly',
        module: 'readonly',
        process: 'readonly',
        console: 'readonly',
      },
    },
  },
]);

