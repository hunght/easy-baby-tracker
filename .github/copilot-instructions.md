# BabyEase NativeWind - AI Coding Agent Instructions

## Project Overview

BabyEase NativeWind is a **React Native baby tracking app** built with **Expo 54+** (New Architecture), **Expo Router**, **NativeWind 4**, **Clerk Auth**, and **SQLite** (Drizzle ORM). This is a complete UI refactor using [React Native Reusables](https://rnr-docs.vercel.app/) components with Tailwind CSS instead of StyleSheet patterns.

**Critical**: NativeWind 4/Tailwind classes ONLY - `StyleSheet.create()` is banned by ESLint. All components follow shadcn/ui patterns via React Native Reusables.

## Architecture Patterns

### Styling System - NativeWind (Critical)

- **NEVER `StyleSheet.create()`** - ESLint bans it. Use `className` prop with Tailwind utilities exclusively
- **`cn()` utility** (`@/lib/utils`): Merges Tailwind classes using `clsx` + `tailwind-merge`
- **Theme**: CSS variables in `global.css` → Tailwind classes (e.g., `bg-primary`, `text-foreground`)
- **Brand colors**: `bg-primary` (#5B7FFF), `bg-accent` (#FF8AB8), `bg-mint` (#7FE3CC), `bg-lavender` (#C7B9FF)
- **Radius tokens**: `rounded-lg` (12px cards), `rounded-md` (8px buttons), `rounded-pill` (24px)
- **Dark mode**: Use `dark:` prefix (e.g., `dark:bg-background`), auto-switches via `useColorScheme()`

```tsx
// ✅ Correct
<View className="rounded-lg bg-primary p-4">
  <Text className="text-xl font-bold text-foreground">Title</Text>
</View>;

// ❌ Wrong - triggers ESLint error
const styles = StyleSheet.create({ container: { backgroundColor: '#5B7FFF' } });
```

### UI Components - React Native Reusables

- **Library**: `components/ui/` contains Button, Card, Badge, Input, Label, Text, Separator, etc.
- **Install command**: `npx @react-native-reusables/cli@latest add <component-name>`
- **Pattern**: All use `cn()` + CVA (Class Variance Authority) for variants
- **Custom components**: TimeField, DatePickerField, TimePickerField, ModalHeader, NotificationBar

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

### Authentication - Clerk

- **Hooks**: `useSignIn()`, `useSignUp()`, `useUser()`, `useAuth()`, `useSSO()` from `@clerk/clerk-expo`
- **Auth screens**: `app/(auth)/` - sign-in, sign-up, forgot-password, verify-email
- **OAuth**: `components/social-connections.tsx` uses `startSSOFlow()` for Apple/Google/GitHub
- **Session**: Call `setActive({ session: signInAttempt.createdSessionId })` after successful sign-in
- **Note**: Clerk integration complete in auth screens but NOT app-wide (no ClerkProvider wrapper)

### Database & State

- **SQLite + Drizzle ORM**: Schema in `db/schema.ts`, migrations in `drizzle/`
- **Web support**: Auto-initialized via `DatabaseInitializer` in `app/_layout.tsx` (uses SharedArrayBuffer)
- **Timestamps**: ALWAYS Unix seconds (`Math.floor(Date.now() / 1000)`), NEVER milliseconds
- **Database modules** (`database/*.ts`): `save{Activity}()`, `get{Activities}()` auto-inject `babyId` via `requireActiveBabyProfileId()`
- **React Query**: Keys in `constants/query-keys.ts`, mutations invalidate queries on success
- **Migrations**: Auto-run on startup via `useMigrations`, generate with `npm run db:generate`
- **Dev tools**: `expo-drizzle-studio-plugin` opens in Expo dev tools (native only)

### Routing & Navigation

- **Expo Router**: File-based routing - tabs in `app/(tabs)/`, modals at root, auth in `app/(auth)/`
- **Modal screens**: Activity trackers (feeding, sleep, diaper) use `presentation: 'modal'` in stack options
- **Navigation**: `router.push()`, `router.back()`, edit mode via `useLocalSearchParams<{ id: string }>()`

### Localization

- **Hook**: `useLocalization()` provides `t()` function: `t('feeding.types.breast')`
- **Translations**: `localization/translations/*.ts` (English/Vietnamese)

## Development Workflows

### Styling Workflow

1. **Always use Tailwind classes** - Reference `docs/color-migration.md` for color mappings
2. **Add new components**: `npx @react-native-reusables/cli@latest add <name>`
3. **Check dark mode**: Test with `className="dark:..."` modifiers
4. **Migration status**: Actively migrating from StyleSheet to NativeWind
   - ✅ Completed: All tab screens, feeding screen, auth screens
   - 🔄 In progress: Remaining activity screens, onboarding
   - When editing files, migrate StyleSheet usage to Tailwind classes

### Database Changes

1. Edit `db/schema.ts`
2. Run `npm run db:generate` (creates migration in `drizzle/`)
3. Restart app (migrations auto-run via `useMigrations` in `_layout.tsx`)
4. Browse with Drizzle Studio via Expo dev tools (native only)

### Development Commands

- **Dev**: `npm start` / `npm run ios` / `npm run android` / `npm run web`
- **Type check**: `npm run type-check` (strict mode, fails on `any`)
- **Lint/format**: `npm run lint:fix`, `npm run format`
- **Database**: `npm run db:generate` (migration), browse via Expo dev tools
- **Build**: EAS Build configured in `eas.json` (profiles: development, preview, production)

### First-Time Setup

1. **Clerk Auth**: Add `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY` to `.env.local` (copy from [Clerk dashboard](https://go.clerk.com))
2. **Enable OAuth**: In Clerk dashboard, enable Apple, GitHub, Google under SSO Connections
3. **Install deps**: `npm install`
4. **Start dev**: `npm start`

## Code Conventions

### TypeScript

- **Strict mode**: Enabled, `any` banned by ESLint (fails build)
- **Type inference**: Use Drizzle's `$inferSelect`/`$inferInsert` for DB types
- **Path alias**: `@/*` → project root
- **No type assertions**: Use type guards instead of `as` (except `as const`)

### ESLint Rules (Strict)

- **No classes**: Functional patterns only (enforced)
- **No `any`**: Fails build
- **No unused vars**: Enforced (prefix `_` to ignore)
- **No eslint-disable**: Fix issues, don't suppress
- **No StyleSheet imports**: Banned by `no-restricted-imports`

### Component Patterns

- **Functional only**: No class components
- **Styling**: Use `className` prop with Tailwind utilities
- **Forms**: Local `useState`, submit via React Query mutation
- **Form validation**: Simple client-side validation with local error state
- **Edit mode**: `useLocalSearchParams<{ id }>()`, load with `useQuery`
- **Loading states**: `ActivityIndicator` or `isSaving` local state
- **Error handling**: `onError` in mutations shows `showNotification()` from `NotificationContext`
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
3. Add database module in `database/{activity}.ts` (same pattern as existing)
4. Register route in `app/_layout.tsx` with `presentation: 'modal'`
5. Add translations to `localization/translations/{activity}.ts`

### Add React Native Reusables Component

```bash
npx @react-native-reusables/cli@latest add accordion
```

Installs component + dependencies to `components/ui/`

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

## Common Use Cases

### Edit Mode Pattern

When loading existing data for editing:

```tsx
const { id } = useLocalSearchParams<{ id: string }>();
const isEditing = !!id;

const { data: existingData } = useQuery({
  queryKey: feedingByIdKey(parseInt(id)),
  queryFn: () => getFeedingById(parseInt(id)),
  enabled: isEditing,
});

useEffect(() => {
  if (existingData) {
    setFeedingType(existingData.type);
    // Populate other state from existingData
  }
}, [existingData]);
```

### Mutation with Update Support

```tsx
const mutation = useMutation({
  mutationFn: async (payload: FeedingPayload) => {
    if (isEditing && id) {
      await updateFeeding(parseInt(id), payload);
    } else {
      await saveFeeding(payload);
    }
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: FEEDINGS_QUERY_KEY });
    showNotification(t('common.saveSuccess'), 'success');
    setTimeout(() => router.back(), 500);
  },
  onError: (error) => {
    console.error('Failed to save:', error);
    showNotification(t('common.saveError'), 'error');
  },
});
```

## Gotchas

- **No StyleSheet**: Migration complete - use Tailwind classes only
- **className vs style**: Always use `className` prop, never inline `style={{ ... }}`
- **cn() import**: Use `import { cn } from '@/lib/utils'` for merging classes
- **Dark mode**: Test with `useColorScheme()` from `nativewind`, classes auto-switch
- **Platform styles**: Wrap web-only hover/focus states in `Platform.select()`
- **Clerk auth state**: Components re-render on auth state changes, use `useUser()` to check auth
- **React Native Reusables**: Not all shadcn/ui components are available - check `docs/ui-components-library.md`
- **Timestamps**: Unix seconds only (`Math.floor(Date.now() / 1000)`), never milliseconds
- **Baby ID**: Database modules auto-inject `babyId` via `requireActiveBabyProfileId()` (same as BabyEase)
- **Notification delay**: Add 500ms `setTimeout()` before `router.back()` after showing notifications to ensure visibility
- **ScrollView className**: Use `contentContainerClassName` for scroll content styling, not `className`
- **useNotification hook**: Import as `const { showNotification } = useNotification()` or use from provider context
- **Edit mode queries**: Set `enabled: isEditing` to avoid fetching when creating new records
