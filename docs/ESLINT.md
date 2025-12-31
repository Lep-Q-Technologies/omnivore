# ESLint Configuration Guide

## Overview

This monorepo uses **ESLint 9** with **flat config** format and **typescript-eslint v8** for consistent, type-aware linting across all packages.

## Architecture

```
omnivore (root)
├── eslint.config.js          → Shared config for all Node.js/TypeScript packages
│   └── Used by: api-nest, and all other backend packages
│
├── packages/omnivore-polish/
│   └── eslint.config.js      → Standalone (React + browser environment)
│
└── packages/web-vite/
    └── eslint.config.js      → Standalone (React + browser environment)
```

### Root Config (`eslint.config.js`)

- **Applies to:** All TypeScript/JavaScript files except ignored packages
- **Ignored packages:** `omnivore-polish`, `web-vite` (have their own configs)
- **Parser:** `typescript-eslint` with `projectService: true` for type-aware linting
- **Plugins:** `simple-import-sort` for automatic import organization
- **Philosophy:** Rules are either `'error'` (blocks commit) or `'off'` (disabled)
  - **No `'warn'`** - warnings don't block commits and get ignored

### Package-Specific Configs

Frontend packages (React apps) have standalone configs because they need:

- Browser globals instead of Node.js globals
- React-specific plugins (`react-hooks`, `react-refresh`)
- Different linting rules (e.g., allowing `console.log` for debugging)

## Adding New Packages

### Option 1: Use Root Config (Recommended for Backend/Node Packages)

**No action needed!** New packages automatically inherit the root config.

```
packages/your-new-service/
├── src/
│   └── index.ts
└── package.json
// No eslint.config needed - uses root automatically
```

### Option 2: Frontend/Browser Package

1. **Copy config from `omnivore-polish` or `web-vite`**
2. **Add to root's `ignores` array:**

```javascript
// eslint.config.js
export default [
  {
    ignores: [
      'node_modules/**',
      '**/dist/**',
      'packages/omnivore-polish/**',
      'packages/web-vite/**',
      'packages/your-react-app/**', // Add here
    ],
  },
  // ...
]
```

### Option 3: Custom Rules for Specific Package

If you need the base rules + custom overrides:

```javascript
// packages/your-package/eslint.config.mjs
import rootConfig from '../../eslint.config.js'

export default [
  ...rootConfig, // Inherit all root rules
  {
    files: ['**/*.ts'],
    rules: {
      // Package-specific overrides
      'no-console': 'off', // This package allows console
      'max-params': ['error', 5], // Different limit
    },
  },
]
```

## Rule Philosophy

### Error vs Off (No Warnings)

**Error** - Blocks commit, prevents bugs:

- `'prefer-const'` - Prevents accidental mutation
- `'guard-for-in'` - Prevents prototype pollution
- `'@typescript-eslint/no-shadow'` - Prevents variable shadowing bugs
- `'@typescript-eslint/no-unused-vars'` - Prevents dead code

**Off** - Style preferences, not bugs:

- `'dot-notation'` - Style choice
- `'newline-before-return'` - Formatting handled by Prettier
- `'prefer-template'` - Style choice
- `'no-await-in-loop'` - Often intentional for sequential async

**Why no warnings?**

- Warnings don't block commits
- Developers ignore them
- Creates false sense of quality
- Use error if it matters, off if it doesn't

### Type-Aware Rules

Some rules are disabled because the codebase uses `strictNullChecks: false`:

```javascript
'@typescript-eslint/prefer-nullish-coalescing': 'off',  // Requires strictNullChecks
'@typescript-eslint/no-unnecessary-condition': 'off',   // Requires strictNullChecks
```

To enable these, you'd need to set `strictNullChecks: true` in `tsconfig.json`.

## Prettier Integration

**Prettier runs standalone**, not via ESLint plugin:

- `eslint-config-prettier` - Disables conflicting ESLint rules ✅
- `eslint-plugin-prettier` - ❌ Removed (slows down linting)

### Pre-commit Hook

`.lintstagedrc.json` runs:

1. `eslint --fix` - Fixes auto-fixable issues (includes import sorting)
2. `prettier --write` - Formats code

## Common Tasks

### Run ESLint

```bash
# Root level (all packages except ignored)
npx eslint .

# Specific package
cd packages/api-nest
npx eslint src/

# Auto-fix
npx eslint src/ --fix
```

### Check Config

```bash
# Verify which config file is used
npx eslint --print-config src/main.ts

# Debug config resolution
DEBUG=eslint:* npx eslint src/main.ts
```

### Add New Rule

Edit `eslint.config.js`:

```javascript
rules: {
  // Add new rule
  'your-rule': 'error',  // or 'off'
}
```

**Never use `'warn'` - only `'error'` or `'off'`.**

## Troubleshooting

### Type-Aware Rules Not Working

**Error:** `"This rule requires parserServices to be generated"`

**Fix:** Ensure `parserOptions.projectService: true` is set:

```javascript
languageOptions: {
  parser: tseslint.parser,
  parserOptions: {
    projectService: true,
    tsconfigRootDir: import.meta.dirname,
  },
},
```

### Linting Slow

Type-aware linting with `projectService` loads the entire TypeScript project.

**Check performance:**

```bash
time npx eslint src/
```

**If too slow (>30s):**

- Use ESLint cache: `--cache --cache-location .eslintcache`
- Consider disabling type-aware rules
- Exclude large generated files

### Module Warning

**Warning:** `Module type of eslint.config.js is not specified`

**Fix:** Add to root `package.json`:

```json
{
  "type": "module"
}
```

## Migration Notes

### From ESLint 8 → 9

- **Old:** `.eslintrc` files (deprecated)
- **New:** Flat config (`eslint.config.js`)

### Key Changes

1. **Config format** - Array of objects instead of extending configs
2. **Parser options** - `projectService: true` instead of `project: ['./tsconfig.json']`
3. **Imports** - Use `import` instead of `require` in config
4. **Plugins** - Import directly, no more string-based plugin names

## Resources

- [ESLint 9 Flat Config Guide](https://eslint.org/docs/latest/use/configure/migration-guide)
- [typescript-eslint v8 Announcement](https://typescript-eslint.io/blog/announcing-typescript-eslint-v8/)
- [Prettier + ESLint Integration](https://prettier.io/docs/en/integrating-with-linters.html)

---

**Last updated:** 2025-12-31
**Maintainer:** See commit history
