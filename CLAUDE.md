# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

EasyBaby+ is a React Native baby tracking app built with Expo 54+ (New Architecture), supporting iOS, Android, and web. It tracks feeding, sleep, diapers, growth, health, and supports E.A.S.Y. scheduling method.

**Tech Stack**: Expo Router, NativeWind 4 (Tailwind CSS), Supabase (PostgreSQL), React Query, TypeScript strict mode

## Essential Commands

```bash
# Development
npm start              # Start Expo dev server (clears cache, kills port 8081)
npm run ios            # Run on iOS simulator
npm run android        # Run on Android emulator
npm run web            # Run web version

# Code Quality (run before commits)
npm run type-check     # TypeScript strict mode validation
npm run lint:fix       # ESLint with auto-fix
npm run format         # Prettier formatting

# Database
npm run types:generate # Generate Supabase TypeScript types

# Screenshots (Maestro E2E)
npm run screenshots:ios
npm run screenshots:android
```

## Architecture

### Routing Structure (Expo Router)
- `app/(tabs)/` - Main tabs: tracking, charts, easy-schedule, reminders, settings
- `app/(tracking)/` - Modal screens for activities (feeding, sleep, diaper, growth, health, pumping, diary)
- `app/(auth)/` - Authentication screens
- `app/(profiles)/` - Baby profile management modals

### Data Layer
- **Database**: Supabase with functions in `database/*.ts` (feeding.ts, sleep.ts, diaper.ts, etc.)
- **Query Keys**: Centralized in `constants/query-keys.ts` for cache management
- **State**: React Query for server state, useState for local/form state

### Component Library
- UI primitives in `components/ui/` (React Native Reusables - shadcn/ui pattern)
- Install new components: `npx @react-native-reusables/cli@latest add <name>`
- All components use `cn()` from `@/lib/utils` for Tailwind class merging

## Critical Rules

### Styling - NativeWind Only
**StyleSheet.create() is banned by ESLint.** Use Tailwind classes exclusively:

```tsx
// ✅ Correct
<View className="flex-1 bg-background p-4">
  <Text className="text-xl font-bold text-foreground">Title</Text>
</View>

// ❌ Wrong - triggers ESLint error
const styles = StyleSheet.create({ container: { backgroundColor: '#fff' } });
```

**Shadow classes on Pressable/TouchableOpacity cause navigation context errors.** Use native style prop for shadows on pressable components:

```tsx
// ❌ Causes error
<Pressable className="shadow-md">

// ✅ Use native style
<Pressable style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 4 }}>
```

### No Custom Hook Wrappers for Queries
Use React Query's `useQuery` directly in components - don't create wrapper hooks:

```tsx
// ✅ Correct - direct usage
import { useQuery } from '@tanstack/react-query';
import { getFeedings } from '@/database/feeding';
import { FEEDINGS_QUERY_KEY } from '@/constants/query-keys';

const { data } = useQuery({ queryKey: FEEDINGS_QUERY_KEY, queryFn: getFeedings });

// ❌ Wrong - don't create hooks/use-feedings.ts
```

### TypeScript Strict Mode
- `any` type is banned by ESLint
- Use type guards instead of `as` assertions (except `as const`)
- Use `$inferSelect`/`$inferInsert` for database types

### Timestamps
Always use Unix seconds: `Math.floor(Date.now() / 1000)`, never milliseconds.

## Common Patterns

### Save with Mutation
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

### Edit Mode
```tsx
const { id } = useLocalSearchParams<{ id: string }>();
const isEditing = !!id;

const { data } = useQuery({
  queryKey: feedingByIdKey(parseInt(id)),
  queryFn: () => getFeedingById(parseInt(id)),
  enabled: isEditing, // Avoid fetching when creating
});
```

## Theme Colors
- Primary: `bg-primary` (#5B7FFF blue)
- Accent: `bg-accent` (#FF8AB8 pink)
- Mint: `bg-mint` (#7FE3CC)
- Lavender: `bg-lavender` (#C7B9FF)
- Border radius: Cards = `rounded-lg` (12px), Buttons = `rounded-md` (8px)

## Gotchas
- **ScrollView**: Use `contentContainerClassName` not `className` for content styling
- **TabsTrigger**: Must wrap text in `<Text>` component
- **Notification delay**: Add 500ms setTimeout before router.back() after showing notifications
- **Edit queries**: Always set `enabled: isEditing` to avoid fetching when creating new records
