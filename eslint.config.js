import js from '@eslint/js'
import prettierConfig from 'eslint-config-prettier'
import simpleImportSort from 'eslint-plugin-simple-import-sort'
import tseslint from 'typescript-eslint'

export default [
  {
    ignores: [
      'node_modules/**',
      '**/dist/**',
      '**/build/**',
      '**/coverage/**',
      'packages/omnivore-polish/**', // React app with browser-specific config
      'packages/web-vite/**', // React app with browser-specific config
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'],
    plugins: {
      '@typescript-eslint': tseslint.plugin,
      'simple-import-sort': simpleImportSort,
    },
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      // Prettier integration - only disable conflicting rules
      ...prettierConfig.rules,

      // Import sorting
      'simple-import-sort/imports': 'error',
      'simple-import-sort/exports': 'error',

      // Code quality rules - only 'error' (blocks commit) or 'off' (disabled)
      // No 'warn' - warnings don't block commits and get ignored
      'arrow-body-style': 'off',
      'prefer-arrow-callback': 'off',
      'prefer-const': 'error', // Prevents accidental mutation
      'array-callback-return': 'error',
      'block-scoped-var': 'error',
      'consistent-this': 'error',
      curly: ['error', 'all'],
      'no-console': 'off', // Useful for debugging, Prettier handles formatting
      'dot-notation': 'off', // Style preference
      eqeqeq: 'error',
      'for-direction': 'error',
      'global-require': 'off', // Not applicable to ES modules
      'guard-for-in': 'error', // Prevents prototype pollution bugs
      'handle-callback-err': 'error', // Prevents swallowed errors
      'id-blacklist': 'error',
      'init-declarations': 'off', // Style preference
      'lines-around-directive': 'off', // Style preference
      'lines-between-class-members': 'off', // Style preference
      'max-depth': ['error', 4],
      'max-nested-callbacks': ['error', 4],
      'max-params': ['error', 11],
      'newline-before-return': 'off', // Style preference
      'no-array-constructor': 'error',
      'no-await-in-loop': 'off', // Often intentional for sequential async
      'no-caller': 'error',
      'no-catch-shadow': 'error',
      'no-duplicate-imports': 'error',
      'no-else-return': 'off', // Style preference
      'no-empty-function': 'off',
      'no-eq-null': 'error',
      'no-eval': 'error',
      'no-implicit-globals': 'error',
      'no-implied-eval': 'error',
      'no-labels': 'error',
      'no-lone-blocks': 'error', // Likely a mistake
      'no-lonely-if': 'off', // Style preference
      'no-loop-func': 'error', // Prevents closure bugs
      'no-mixed-operators': 'error',
      'no-multi-assign': 'error',
      'no-multi-str': 'error', // Prevents syntax errors in strict mode
      'no-native-reassign': 'error',
      'no-proto': 'error',
      'no-prototype-builtins': 'off',
      'no-restricted-globals': 'error',
      'no-restricted-imports': 'error',
      'no-restricted-modules': 'error',
      'no-restricted-properties': 'error',
      'no-restricted-syntax': 'error',
      'no-return-await': 'off', // Deprecated in modern JS
      'no-self-compare': 'error',
      'no-sequences': 'error',
      'no-shadow': 'off',
      '@typescript-eslint/no-shadow': 'error',
      'no-shadow-restricted-names': 'error',
      'no-tabs': 'error',
      'no-template-curly-in-string': 'error',
      'no-undef-init': 'off', // Style preference
      'no-undefined': 'off', // Style preference
      // Type-aware rules requiring strictNullChecks (disabled - codebase uses strictNullChecks: false)
      '@typescript-eslint/prefer-nullish-coalescing': 'off',
      '@typescript-eslint/prefer-optional-chain': 'error',
      '@typescript-eslint/no-unnecessary-condition': 'off',
      'no-unmodified-loop-condition': 'error',
      'no-unneeded-ternary': 'error',
      'no-use-before-define': [
        'error', // Prevents hoisting bugs
        {
          functions: false,
        },
      ],
      'no-useless-call': 'error',
      'no-useless-concat': 'error',
      'no-useless-constructor': 'off',
      'no-useless-escape': 'off', // Style preference
      'no-useless-rename': 'error',
      'no-useless-return': 'error',
      'no-void': 'error',
      'no-with': 'error',
      'prefer-promise-reject-errors': 'error', // Prevents debugging issues
      'prefer-rest-params': 'error',
      'prefer-template': 'off', // Style preference
      radix: 'error', // Prevents parseInt bugs
      'symbol-description': 'error',
      'vars-on-top': 'error',
      yoda: 'error',
      'class-methods-use-this': 'off',
      '@typescript-eslint/no-empty-interface': 'error', // Prevents meaningless types
      '@typescript-eslint/no-explicit-any': 'error', // Prevents type safety issues
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_', // Allow unused args prefixed with _
          varsIgnorePattern: '^_', // Allow unused vars prefixed with _
        },
      ],
    },
  },
  {
    files: ['**/*.spec.ts', '**/*.test.ts'],
    rules: {
      // Test files can have console statements for debugging
      'no-console': 'off',
    },
  },
]
