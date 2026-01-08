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
    settings: {
      'import/resolver': {
        typescript: {
          alwaysTryTypes: true,
          project: './tsconfig.json',
        },
        node: {
          extensions: ['.js', '.jsx', '.ts', '.tsx'],
        },
      },
      'import/parsers': {
        '@typescript-eslint/parser': ['.ts', '.tsx'],
      },
      'import/ignore': ['node_modules', '\\.d\\.ts$'],
    },
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector: 'ClassDeclaration',
          message: 'Classes are not allowed. Please use functional programming patterns instead.',
        },
        {
          // Match TSAsExpression that is NOT "as const" (TSTypeReference with typeName.name="const") and NOT "as unknown" (TSUnknownKeyword)
          // This catches all other type assertions like "as SomeType" or "as string"
          selector:
            'TSAsExpression:not([typeAnnotation.typeName.name="const"]):not([typeAnnotation.type="TSUnknownKeyword"])',
          message:
            'Type assertions using "as" are not allowed (except "as const" and "as unknown"). Use type guards or proper type narrowing instead.',
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
      // Detect unused exports (functions, variables, types, etc.)
      'unused-imports/no-unused-vars': [
        'error', // Changed from 'warn' to 'error'
        {
          vars: 'all',
          varsIgnorePattern: '^_',
          args: 'after-used',
          argsIgnorePattern: '^_',
        },
      ],
      // Detect unused module exports (cross-file analysis)
      'import/no-unused-modules': [
        'error',
        {
          unusedExports: true,
          missingExports: false,
          src: ['./'],
          ignoreExports: [
            // Expo Router files (default exports are used by framework)
            'app/**',
            // UI components (React Native Reusables - used dynamically)
            'components/ui/**',
            // Config files
            '*.config.js',
            '*.config.ts',
            // Database migrations/seeding (used programmatically)
            'database/easy-formula-rules.ts',
            // Internal types that might be used in same module
            'components/TimeField.tsx',
            // Types/interfaces exported for external use
            'lib/notifications-wrapper.ts',
            'lib/easy-schedule-generator.ts',
            'localization/LocalizationProvider.tsx',
          ],
        },
      ],
      // Disable namespace import errors for React Native Reusables (they use internal APIs)
      'import/namespace': 'off',
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
  // App route files - ignore unused exports (Expo Router uses default exports)
  {
    files: [
      'app/**/*.tsx',
      'app/**/*.ts',
      '*.config.js',
      '*.config.ts',
    ],
    rules: {
      'unused-imports/no-unused-vars': 'off', // Allow unused exports in route/config files
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

