# Unused Exports Detection

## Setup

This project uses two tools to detect unused code:

### 1. ESLint with `eslint-plugin-unused-imports`

Detects unused imports automatically during linting.

```bash
npm run lint
```

### 2. ts-prune

Detects unused exports (functions, constants, types that are exported but never imported anywhere).

```bash
# Show all unused exports
npm run find-unused:detailed

# Exit with error code if unused exports found (for CI)
npm run find-unused
```

## Configuration

- **ESLint config**: `eslint.config.js` - includes `unused-imports` plugin
- **ts-prune config**: `.tsprunerc` - ignores route default exports (required by Expo Router)

## Current Unused Exports

✅ **Cleaned up (removed):**

- ~~`components/external-link.tsx` - ExternalLink~~
- ~~`components/hello-wave.tsx` - HelloWave~~
- ~~`components/user-menu.tsx` - UserMenu~~
- ~~`hooks/use-theme-color.ts` - useThemeColor~~
- ~~`constants/theme.ts` - Fonts~~

**Safe to remove (not used anywhere):**

- `lib/logger.ts` - logger
- `localization/translations.ts` - supportedLocales, TranslationTree

**May be needed (used in other projects or for future features):**

- Various query key helpers in `constants/query-keys.ts`
- Database helper functions in `database/`
- Notification scheduler functions in `lib/notification-scheduler.ts`
- `lib/easy-schedule-generator.ts` - calculateAgeInMonths, generateEasy3Schedule

## Recommended Actions

1. ✅ ~~Remove clearly unused components (HelloWave, ExternalLink, UserMenu, useThemeColor, Fonts)~~ - **DONE**
2. Keep database/notification functions (may be used in future or debugging)
3. Review query-keys exports - remove if truly not needed
4. Consider removing logger and translations helpers if confirmed unused
