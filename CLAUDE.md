# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Easy Baby Tracker is a privacy-first, offline-only baby tracking app built with React Native and Expo. All data is stored locally in SQLite - no cloud sync, no accounts required.

**Tech Stack**: React Native 0.81 + Expo 54, TypeScript (strict), NativeWind 4 (Tailwind CSS), Drizzle ORM + SQLite, React Query, Clerk Auth (optional)

## Development Commands

```bash
# Development
npm start              # Start Expo dev server (kills port 8081 first)
npm run ios            # Run on iOS simulator
npm run android        # Run on Android emulator
npm run web            # Run on web

# Code Quality
npm run type-check     # TypeScript strict checking (fails on `any`)
npm run lint:fix       # ESLint auto-fix
npm run format         # Prettier formatting

# Database
npm run db:generate    # Generate Drizzle migrations after schema changes
```

## Architecture

### Directory Structure
- `app/` - Expo Router file-based routing with groups: `(tabs)`, `(tracking)`, `(auth)`, `(profiles)`, `(easy-schedule)`
- `components/ui/` - React Native Reusables (shadcn/ui pattern)
- `database/` - One module per feature with CRUD functions (feeding.ts, sleep.ts, etc.)
- `db/schema.ts` - Drizzle ORM schema definition
- `constants/query-keys.ts` - Centralized React Query cache keys
- `pages/` - Complex page components extracted from routes
- `localization/` - i18n translations

### Data Flow
1. Screen in `app/` uses `useQuery` with key from `constants/query-keys.ts`
2. Query function calls database module in `database/*.ts`
3. Database module uses Drizzle ORM on SQLite
4. Mutations invalidate React Query cache on success

## Critical Rules

### Styling - NativeWind Only
```tsx
// CORRECT - Use className with Tailwind utilities
<View className="flex-1 bg-background p-4">
  <Text className="text-xl font-bold text-foreground">Title</Text>
</View>

// WRONG - StyleSheet is banned by ESLint
const styles = StyleSheet.create({ ... });
```

Use `cn()` from `@/lib/utils` to merge classes.

**Shadow Bug Workaround**: Shadow classes on `Pressable`/`TouchableOpacity` cause navigation context errors. Use native `style` prop for shadows on pressable components only.

### React Query - No Wrapper Hooks
```tsx
// CORRECT - Use useQuery directly with centralized keys
import { FEEDINGS_QUERY_KEY } from '@/constants/query-keys';
const { data } = useQuery({ queryKey: FEEDINGS_QUERY_KEY, queryFn: getFeedings });

// WRONG - Don't create wrapper hooks like hooks/use-feedings.ts
```

### TypeScript
- No `any` type (fails build)
- No type assertions except `as const`
- Use type guards instead of `as` casting
- Use Drizzle's `$inferSelect`/`$inferInsert` for DB types

### Database
- Timestamps in Unix seconds: `Math.floor(Date.now() / 1000)`
- Baby ID auto-injected via `requireActiveBabyProfileId()`
- One module per feature in `database/` folder

### Save Pattern
```tsx
const mutation = useMutation({
  mutationFn: (payload) => saveFeeding(payload),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: FEEDINGS_QUERY_KEY });
    showNotification(t('common.saveSuccess'), 'success');
    setTimeout(() => router.back(), 500); // Delay for notification visibility
  },
});
```

### Edit Mode Pattern
```tsx
const { id } = useLocalSearchParams<{ id: string }>();
const isEditing = !!id;

const { data } = useQuery({
  queryKey: feedingByIdKey(parseInt(id)),
  queryFn: () => getFeedingById(parseInt(id)),
  enabled: isEditing, // Only fetch when editing
});
```

## Common Gotchas

- **ScrollView**: Use `contentContainerClassName` not `className` for content styling
- **TabsTrigger**: Must wrap text in `<Text>` component
- **Notification timing**: Add 500ms delay before `router.back()` after showing notifications
- **Edit queries**: Always set `enabled: isEditing` to avoid fetching when creating
- **UI components**: Not all shadcn/ui components available - check `docs/ui-components-library.md`

## Adding New Features

### New Activity Screen
1. Create `app/(tracking)/{activity}.tsx`
2. Add database module `database/{activity}.ts`
3. Add query keys to `constants/query-keys.ts`
4. Add translations to `localization/translations/`

### New UI Component
```bash
npx @react-native-reusables/cli@latest add <component-name>
```

### Database Schema Change
1. Edit `db/schema.ts`
2. Run `npm run db:generate`
3. Restart app (migrations auto-run)

## Brand Colors

- Primary: `bg-primary` (#5B7FFF)
- Accent: `bg-accent` (#FF8AB8)
- Mint: `bg-mint` (#7FE3CC)
- Lavender: `bg-lavender` (#C7B9FF)

Border radius: Cards `rounded-lg` (12px), Buttons `rounded-md` (8px), Pills `rounded-pill` (24px)
