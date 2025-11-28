# BabyEase NativeWind - AI Coding Agent Instructions

## Project Overview

BabyEase NativeWind is a **React Native baby tracking app** built with **Expo 54+** (New Architecture), **Expo Router**, **NativeWind 4** (Tailwind CSS), **Clerk Auth**, and **SQLite** (Drizzle ORM). This is a complete UI refactor of the original BabyEase app, migrating from StyleSheet patterns to a modern component library using [React Native Reusables](https://rnr-docs.vercel.app/).

**Key Difference from BabyEase**: This project uses **NativeWind/Tailwind** for styling instead of `StyleSheet.create()`. All UI components follow the shadcn/ui pattern via React Native Reusables.

## Architecture Patterns

### Styling System - NativeWind (Critical)

- **Never use `StyleSheet.create()`** - This project uses Tailwind utility classes exclusively
- **Utility function**: `cn()` from `@/lib/utils` merges Tailwind classes (uses `clsx` + `tailwind-merge`)
- **Theme colors**: Defined as CSS variables in `global.css`, accessed via Tailwind classes

  ```tsx
  // ✅ Correct
  <View className="bg-primary text-primary-foreground rounded-lg p-4">

  // ❌ Wrong - never use StyleSheet in this project
  const styles = StyleSheet.create({ container: { backgroundColor: '#5B7FFF' } });
  ```

- **Brand colors**: `bg-primary` (#5B7FFF), `bg-accent` (#FF8AB8), `bg-mint` (#7FE3CC), `bg-lavender` (#C7B9FF)
- **Border radius**: Cards = `rounded-lg` (12px), Buttons = `rounded-md` (8px), Pills = `rounded-pill` (24px)
- **Dark mode**: Use `className` with Tailwind's dark mode support (e.g., `dark:bg-background`)

### UI Components - React Native Reusables

- **Base components**: `components/ui/` (Button, Card, Badge, Input, Label, Text, Separator, etc.)
- **Installation**: `npx @react-native-reusables/cli@latest add <component-name>`
- **Pattern**: All components use `cn()` for className merging and CVA (Class Variance Authority) for variants
- **Example**:

  ```tsx
  import { Button } from '@/components/ui/button';
  import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

  <Card className="rounded-lg">
    <CardHeader>
      <CardTitle>Feeding Log</CardTitle>
    </CardHeader>
    <CardContent>
      <Button variant="default" size="lg">
        Save
      </Button>
    </CardContent>
  </Card>;
  ```

- **Custom UI**: TimeField, DatePickerField, NotificationBar (in `components/ui/`)

### Authentication - Clerk

- **Provider**: Clerk handles OAuth (Apple, Google, GitHub) + email/password auth
- **Hooks**: `useSignIn()`, `useSignUp()`, `useUser()`, `useAuth()`, `useSSO()` from `@clerk/clerk-expo`
- **Auth screens**: `app/(auth)/` contains sign-in, sign-up, forgot-password, verify-email flows
- **Social login**: `components/social-connections.tsx` handles OAuth with `startSSOFlow()`
- **Session management**: Use `setActive({ session })` after successful sign-in
- **Auth pattern**:
  ```tsx
  const { signIn, setActive, isLoaded } = useSignIn();
  const signInAttempt = await signIn.create({ identifier: email, password });
  if (signInAttempt.status === 'complete') {
    await setActive({ session: signInAttempt.createdSessionId });
  }
  ```
- **Note**: Clerk integration is complete in auth screens but NOT enforced app-wide (no ClerkProvider wrapping)

### Database & State (Same as BabyEase)

- **SQLite**: Drizzle ORM (`drizzle-orm/expo-sqlite`), schema in `db/schema.ts`
- **Timestamps**: Unix seconds (`Math.floor(Date.now() / 1000)`), never milliseconds
- **Modules**: `database/*.ts` with `save{Activity}`, `get{Activities}`, auto-inject `babyId` via `requireActiveBabyProfileId()`
- **React Query**: `@tanstack/react-query` for data fetching, keys in `constants/query-keys.ts`
- **Migrations**: Auto-run on startup via `useMigrations` in `app/_layout.tsx`

### Routing & Navigation

- **Expo Router**: File-based routing (tabs in `app/(tabs)/`, modals at top-level)
- **Auth flow**: `app/(auth)/sign-in.tsx`, `sign-up.tsx`, `forgot-password.tsx`, etc.
- **Modals**: Activity screens use `presentation: 'modal'` (feeding, sleep, diaper, etc.)
- **Navigation**: `router.push()`, `router.back()`, `useLocalSearchParams<{ id: string }>()`

### Localization

- **System**: `LocalizationProvider` + `useLocalization()` hook
- **Usage**: `const { t } = useLocalization(); t('feeding.types.breast')`
- **Files**: `localization/translations/*.ts` (English/Vietnamese)

## Development Workflows

### Styling Workflow

1. **Always use Tailwind classes** - Reference `docs/color-migration.md` for color mappings
2. **Add new components**: `npx @react-native-reusables/cli@latest add <name>`
3. **Check dark mode**: Test with `className="dark:..."` modifiers
4. **Migration status**: This project is actively migrating from StyleSheet to NativeWind (see `docs/ui-refactor-plan.md`)
   - ✅ **Completed**: All tab screens (`(tabs)/*.tsx`), feeding screen, auth screens
   - 🔄 **In progress**: Remaining activity screens (`sleep.tsx`, `diaper.tsx`, etc.), onboarding (`index.tsx` still has StyleSheet)
   - When editing files, prefer migrating StyleSheet usage to Tailwind classes

### Database Changes

1. Edit `db/schema.ts`
2. Run `npm run db:generate` (creates migration)
3. Restart app (migrations auto-run)
4. Browse: `npm run db:studio`

### Building & Testing

- **Local dev**: `npm start` (or `npm run ios`/`android`)
- **Type check**: `npm run type-check` (fails on `any` types)
- **Lint**: `npm run lint:fix` (enforces no classes, no unused vars, no `any`)
- **Format**: `npm run format` (Prettier with Tailwind plugin)

### Clerk Setup (First-Time)

1. Set up Clerk account at [go.clerk.com](https://go.clerk.com)
2. Enable Email/Phone/Username + OAuth (Apple, GitHub, Google)
3. Rename `.env.example` → `.env.local`, add `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY`

## Code Conventions

### TypeScript

- **Strict mode**: Enabled, `any` banned by ESLint
- **Type inference**: Use Drizzle's `$inferSelect`/`$inferInsert`
- **Path alias**: `@/*` → project root

### ESLint Rules (Strict)

- **No classes**: Functional patterns only (enforced)
- **No `any`**: Fails build
- **No unused vars**: Enforced (prefix `_` to ignore)
- **No eslint-disable comments**: Fix issues, don't suppress
- **No unused styles**: N/A (no StyleSheet in this project)

### Component Patterns

- **Functional only**: No class components
- **Styling**: Use `className` prop with Tailwind utilities
- **Forms**: Local `useState`, submit via React Query mutation
- **Form validation**: Simple client-side validation with local error state (see `components/sign-in-form.tsx`)
- **Edit mode**: `useLocalSearchParams<{ id }>()`, load with `useQuery`
- **Loading states**: Use `ActivityIndicator` from React Native or `isSaving` local state
- **Error handling**: `onError` callback in mutations shows notification via `showNotification()` from `NotificationContext`
- **Save pattern**:
  ```tsx
  const mutation = useMutation({
    mutationFn: (payload) => saveFeeding(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: FEEDINGS_QUERY_KEY });
      showNotification(t('common.saveSuccess'), 'success');
      setTimeout(() => router.back(), 500); // Delay for notification visibility
    },
    onError: (error) => {
      console.error('Failed to save:', error);
      showNotification(t('common.saveError'), 'error');
    },
  });
  ```

### Platform-Specific Styles

- **Web-only**: Use `Platform.select({ web: 'hover:...' })` in CVA variants
- **Example** (from `components/ui/button.tsx`):
  ```tsx
  cn(
    'rounded-md',
    Platform.select({
      web: 'hover:bg-primary/90 focus-visible:ring-2',
    })
  );
  ```

## Critical Files

- `app/_layout.tsx`: App initialization, Clerk provider, migrations, navigation stack
- `global.css`: Theme CSS variables (all `--primary`, `--accent`, etc.)
- `tailwind.config.js`: Tailwind config with brand colors + border radius tokens
- `lib/utils.ts`: `cn()` utility for className merging
- `components/ui/*`: React Native Reusables component library
- `db/schema.ts`: Database schema (same as BabyEase)
- `docs/color-migration.md`: Complete color mapping guide
- `docs/ui-components-library.md`: Component usage reference

## Common Tasks

### Add New Activity Screen

1. Create modal screen `app/{activity}.tsx` using Tailwind classes
2. Use components: `Button`, `Card`, `Input`, `Badge` from `components/ui/`
3. Add database module in `database/{activity}.ts` (same pattern as BabyEase)
4. Register route in `app/_layout.tsx` with `presentation: 'modal'`
5. Add translations to `localization/translations/{activity}.ts`

### Add React Native Reusables Component

```bash
npx @react-native-reusables/cli@latest add accordion
```

This installs the component + dependencies to `components/ui/`

### Convert StyleSheet to NativeWind

```tsx
// Before (BabyEase style)
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA', padding: 16 },
  title: { fontSize: 20, fontWeight: 'bold', color: '#11181C' }
});
<View style={styles.container}>
  <Text style={styles.title}>Title</Text>
</View>

// After (NativeWind style)
<View className="flex-1 bg-background p-4">
  <Text className="text-xl font-bold text-foreground">Title</Text>
</View>
```

### Common Tailwind Class Patterns

```tsx
// Spacing: p-4 (padding 16px), m-6 (margin 24px), gap-3 (gap 12px)
// Flexbox: flex-1, flex-row, items-center, justify-between
// Colors: bg-primary, text-foreground, border-border
// Borders: rounded-lg (12px), rounded-md (8px), border border-border
// Shadows: shadow-sm shadow-black/5 (card shadow)
// Typography: text-xl (20px), font-bold, font-semibold

// Badge for type selection (feeding, diaper types)
<Badge
  variant={selected ? 'default' : 'secondary'}
  onPress={() => setType(value)}
  className={`flex-1 ${selected ? 'bg-primary' : 'bg-card'}`}
>
  <Text className={selected ? 'text-white' : 'text-muted-foreground'}>
    {label}
  </Text>
</Badge>

// Card for content grouping
<Card className="rounded-lg mb-4">
  <CardHeader>
    <CardTitle>Section Title</CardTitle>
  </CardHeader>
  <CardContent>
    <Text>Content here</Text>
  </CardContent>
</Card>

// Modal header pattern (used in all activity screens)
<ModalHeader
  title={t('feeding.title')}
  onSave={handleSave}
  isSaving={isSaving}
  closeLabel={t('common.close')}
  saveLabel={t('common.save')}
/>
```

### Style Auth Screens

Auth screens (sign-in, sign-up, etc.) should use:

- `Card` for form containers with `border-border/0 shadow-none sm:border-border sm:shadow-sm`
- `Input` with proper labels (`Label` component)
- `Button` variants: `default` (primary), `outline`, `link`
- `SocialConnections` component for OAuth buttons

## Gotchas

- **No StyleSheet**: Migration in progress - use Tailwind classes only in new/edited code
- **className vs style**: Always use `className` prop, never inline `style={{ ... }}`
- **cn() import**: Use `import { cn } from '@/lib/utils'` for merging classes
- **Dark mode**: Test with `useColorScheme()` from `nativewind`, classes auto-switch
- **Platform styles**: Wrap web-only hover/focus states in `Platform.select()`
- **Clerk auth state**: Components re-render on auth state changes, use `useUser()` to check auth
- **React Native Reusables**: Not all shadcn/ui components are available - check `docs/ui-components-library.md`
- **Timestamps**: Still use seconds (same as BabyEase), not milliseconds
- **Baby ID**: Database modules auto-inject `babyId` from active profile (same as BabyEase)
- **Notification delay**: Add 500ms `setTimeout()` before `router.back()` after showing notifications to ensure visibility
- **ScrollView className**: Use `contentContainerClassName` for scroll content styling, not `className`
