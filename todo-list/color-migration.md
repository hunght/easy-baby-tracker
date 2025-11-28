# BabyEase Color Migration to NativeWind

## Overview

This document serves as a **practical guide** for migrating BabyEase brand colors to NativeWind/Tailwind CSS. Use this document to systematically update components and ensure consistent color usage across the application.

## Quick Reference: Color Mapping

### Primary Brand Colors

| Brand Token              | Hex     | Tailwind Class                      | CSS Variable    | Usage                                      |
| ------------------------ | ------- | ----------------------------------- | --------------- | ------------------------------------------ |
| `BrandColors.primary`    | #5B7FFF | `bg-primary` `text-primary`         | `--primary`     | Primary actions, active states, focus ring |
| `BrandColors.secondary`  | #FFB347 | `bg-secondary` `text-secondary`     | `--secondary`   | Secondary buttons, warm accents            |
| `BrandColors.accentPink` | #FF8AB8 | `bg-accent` `text-accent`           | `--accent`      | Highlights, playful elements               |
| `BrandColors.mint`       | #7FE3CC | `bg-mint` `text-mint`               | `--mint`        | Success states, positive indicators        |
| `BrandColors.lavender`   | #C7B9FF | `bg-lavender` `text-lavender`       | `--lavender`    | Subtle backgrounds, muted states           |
| `BrandColors.warning`    | #FF7A59 | `bg-destructive` `text-destructive` | `--destructive` | Warnings, destructive actions              |
| `BrandColors.info`       | #4BA3C3 | `bg-info` `text-info`               | `--info`        | Informational banners                      |

### Semantic Colors

| Old Theme Token           | Hex     | New Tailwind Class      | CSS Variable             |
| ------------------------- | ------- | ----------------------- | ------------------------ |
| `Colors.light.background` | #fff    | `bg-background`         | `--background` (#F5F7FA) |
| `Colors.light.text`       | #11181C | `text-foreground`       | `--foreground`           |
| `Colors.light.tint`       | #0a7ea4 | `bg-primary`            | `--primary`              |
| `BrandColors.graySoft`    | #F5F7FA | `bg-background`         | `--background`           |
| `BrandColors.grayStrong`  | #3F464A | `text-muted-foreground` | `--muted-foreground`     |

## Step-by-Step Migration Process

### Step 1: Identify Hardcoded Colors

Search for hardcoded colors in your codebase:

```bash
# Find hex colors
grep -r "#[0-9A-Fa-f]\{6\}" app/ features/ components/

# Find common patterns
grep -r "bg-white\|text-white\|bg-\[#" app/ features/ components/
```

### Step 2: Replace Common Patterns

#### Pattern 1: Background Colors

**Before:**

```tsx
<View style={{ backgroundColor: '#5B7FFF' }}>
<View className="bg-white">
<View className="bg-[#FF8AB8]">
```

**After:**

```tsx
<View className="bg-primary">
<View className="bg-card">  // or bg-background
<View className="bg-accent">
```

#### Pattern 2: Text Colors

**Before:**

```tsx
<Text style={{ color: '#11181C' }}>
<Text className="text-white">
<Text className="text-[#FF7A59]">
```

**After:**

```tsx
<Text className="text-foreground">
<Text className="text-foreground">  // or text-card-foreground
<Text className="text-destructive">
```

#### Pattern 3: Native Component Colors (Slider, Icons, etc.)

For native components that require hex values (like `Slider`, `MaterialCommunityIcons`), use the `useBrandColor` hook:

**Before:**

```tsx
<Slider minimumTrackTintColor="#FF5C8D" />
<MaterialCommunityIcons color="#FFF" />
```

**After:**

```tsx
import { useBrandColor } from '@/hooks/use-brand-color';

function MyComponent() {
  const brandColors = useBrandColor();

  return (
    <>
      <Slider minimumTrackTintColor={brandColors.colors.accent} />
      <MaterialCommunityIcons color={brandColors.colors.white} />
    </>
  );
}
```

**Note:** The `useBrandColor` hook automatically uses the correct color based on the current color scheme (light/dark). All colors come from the centralized `THEME` config - single source of truth.

#### Pattern 4: Border Radius

**Before:**

```tsx
<View className="rounded-xl">
<View className="rounded-2xl">
```

**After:**

```tsx
<View className="rounded-lg">   // Cards (12px)
<View className="rounded-md">   // Buttons (8px)
<View className="rounded-pill"> // Pills/Badges (24px)
<View className="rounded-sm">   // Small elements (4px)
```

## Border Radius (from BRANDING.md)

| Usage          | Old | New Tailwind   | Value |
| -------------- | --- | -------------- | ----- |
| Cards          | -   | `rounded-lg`   | 12px  |
| Buttons        | -   | `rounded-md`   | 8px   |
| Pills/Badges   | -   | `rounded-pill` | 24px  |
| Small elements | -   | `rounded-sm`   | 4px   |

### Step 3: Component-Specific Examples

#### Example 1: Form Components

**Before:**

```tsx
<View className="mb-6 flex-row overflow-hidden rounded-xl border border-border bg-white">
  <Pressable className="bg-[#FF8AB8]">
    <Text className="text-white">Option</Text>
  </Pressable>
</View>
```

**After:**

```tsx
<View className="mb-6 flex-row overflow-hidden rounded-lg border border-border bg-card">
  <Pressable className="bg-accent">
    <Text className="text-accent-foreground">Option</Text>
  </Pressable>
</View>
```

#### Example 2: Buttons and Interactive Elements

**Before:**

```tsx
<Pressable className="bg-blue-500">
  <Text className="text-white">Click me</Text>
</Pressable>
```

**After:**

```tsx
<Pressable className="bg-primary">
  <Text className="text-primary-foreground">Click me</Text>
</Pressable>
```

#### Example 3: Status Indicators

**Before:**

```tsx
<Badge className="bg-green-500">
<Badge className="bg-red-500">
```

**After:**

```tsx
<Badge className="bg-mint">        // Success
<Badge className="bg-destructive"> // Error/Warning
```

#### Example 4: Slider Components

**Before:**

```tsx
<Slider minimumTrackTintColor="#FF5C8D" maximumTrackTintColor="#E0E0E0" thumbTintColor="#FFF" />
```

**After:**

```tsx
import { useBrandColor } from '@/hooks/use-brand-color';

function MyComponent() {
  const brandColors = useBrandColor();

  return (
    <Slider
      minimumTrackTintColor={brandColors.colors.accent} // Automatically uses correct color for light/dark
      maximumTrackTintColor="#E0E0E0" // Keep muted gray for track
      thumbTintColor={brandColors.colors.white} // White from hook
    />
  );
}
```

#### Example 5: Icons

**Before:**

```tsx
<MaterialCommunityIcons name="heart" size={20} color={isActive ? '#FF8AB8' : '#666666'} />
```

**After:**

```tsx
import { useBrandColor } from '@/hooks/use-brand-color';

function MyComponent() {
  const brandColors = useBrandColor();

  return (
    <MaterialCommunityIcons
      name="heart"
      size={20}
      color={isActive ? brandColors.colors.accent : undefined}  // Use hook for brand colors
      className={!isActive ? 'text-muted-foreground'}            // Use Tailwind for inactive
    />
  );
}
```

**Note:** For icons, prefer Tailwind classes when possible. Use the `useBrandColor` hook when you need hex values for native components.

## Dark Mode Support

All colors have been adjusted for dark mode with proper contrast. The CSS variables in `global.css` automatically handle dark mode switching:

**Light Mode:**

- Primary: `#5B7FFF` (230 100% 68%)
- Background: `#F5F7FA` (240 20% 98%)
- Foreground: `#11181C` (210 11% 7%)

**Dark Mode:**

- Primary: `#6B9FFF` (230 100% 72%) - Lighter for visibility
- Background: `#11181C` (210 11% 7%)
- Foreground: `#ECEDEE` (210 17% 93%)

**How it works:**

- Tailwind classes automatically use the correct color based on `.dark` class
- No need to manually switch colors - just use semantic classes
- Example: `bg-primary` will be `#5B7FFF` in light mode and `#6B9FFF` in dark mode

## Chart Colors

Chart colors now use the brand palette (defined in `global.css`):

1. `--chart-1`: Primary (#5B7FFF) - `230 100% 68%`
2. `--chart-2`: Secondary (#FFB347) - `35 100% 64%`
3. `--chart-3`: Accent Pink (#FF8AB8) - `340 100% 77%`
4. `--chart-4`: Mint (#7FE3CC) - `165 65% 69%`
5. `--chart-5`: Warning (#FF7A59) - `12 100% 67%`

**Usage in charts:**

```tsx
// Use CSS variables or Tailwind classes
const colors = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  // ... etc
];
```

## Color Format Reference

### HSL Format in CSS Variables

Colors in `global.css` use HSL format without the `hsl()` wrapper:

- Format: `H S% L%` (e.g., `230 100% 68%`)
- Used in CSS: `hsl(var(--primary))` automatically wraps it

### Converting Hex to HSL

If you need to add a new color:

1. Use an online converter or tool
2. Format: `H S% L%` (no `hsl()` wrapper)
3. Add to both `:root` (light) and `.dark:root` (dark) in `global.css`
4. Add to `tailwind.config.js` if it's a new brand color

**Example:**

```css
/* Light mode */
--new-color: 200 80% 60%; /* #4BA3C3 */

/* Dark mode */
--new-color: 200 70% 70%; /* Lighter version */
```

## Troubleshooting

### Issue: Colors not updating in dark mode

**Solution:** Ensure you're using Tailwind classes, not hardcoded hex values. Tailwind classes automatically switch based on the `.dark` class.

### Issue: Native components (Slider, Icons) need hex values

**Solution:** Use the `useBrandColor` hook which provides brand colors from the centralized `THEME` config. This ensures consistency and automatic light/dark mode support:

```tsx
import { useBrandColor } from '@/hooks/use-brand-color';

const brandColors = useBrandColor();
<Slider minimumTrackTintColor={brandColors.colors.accent} />;
```

### Issue: Text not visible on colored background

**Solution:** Use foreground variants:

- `text-primary-foreground` on `bg-primary`
- `text-accent-foreground` on `bg-accent`
- `text-destructive-foreground` on `bg-destructive`

### Issue: Border radius looks wrong

**Solution:** Use the correct semantic classes:

- Cards: `rounded-lg` (12px)
- Buttons: `rounded-md` (8px)
- Pills: `rounded-pill` (24px)
- Small: `rounded-sm` (4px)

## Typography

Font configuration remains platform-specific (from `Fonts` in theme.ts):

- iOS: System fonts (SF Pro, SF Pro Rounded, etc.)
- Android: Roboto
- Web: System UI stack

For custom fonts (e.g., Nunito), follow the BRANDING.md guide.

### Step 4: Verify Changes

After making changes:

1. **Test in both light and dark mode** - Ensure colors have proper contrast
2. **Check accessibility** - Verify WCAG AA contrast requirements
3. **Run linter** - Ensure no TypeScript/ESLint errors
4. **Visual inspection** - Compare before/after visually

### Step 5: Common Pitfalls to Avoid

❌ **Don't:**

- Use hardcoded hex colors in className: `className="bg-[#5B7FFF]"`
- Mix style props with className: `style={{ backgroundColor: '#FF8AB8' }} className="..."`
- Use generic colors: `bg-blue-500`, `text-red-500`
- Forget to update both light and dark mode variants

✅ **Do:**

- Use semantic Tailwind classes: `bg-primary`, `text-accent`
- Use foreground variants for text on colored backgrounds: `text-primary-foreground`
- Use brand-specific colors: `bg-mint`, `bg-lavender`, `bg-info`
- Test in both light and dark modes

## Usage Guidelines

1. **Always use Tailwind classes** instead of hardcoded hex colors
2. **Use semantic tokens** (primary, secondary, accent) instead of specific colors
3. **Test in both light and dark mode** to ensure proper contrast
4. **Follow WCAG AA** contrast requirements for accessibility
5. **For native components** (Slider, Icons) that require hex values, use exact brand colors from the mapping table

## Files to Check During Migration

### High Priority (Most Common Patterns)

- [ ] `features/feeding/components/*.tsx` - Form components with sliders and buttons
- [ ] `features/timeline/components/*.tsx` - Activity cards and timeline items
- [ ] `features/charts/components/*.tsx` - Chart components
- [ ] `app/**/*.tsx` - Screen components

### Search Patterns

Use these patterns to find files that need updates:

```bash
# Find hardcoded hex colors
grep -r "#[0-9A-Fa-f]\{6\}" app/ features/ components/

# Find bg-white (should be bg-card or bg-background)
grep -r "bg-white" app/ features/ components/

# Find text-white (should use foreground variants)
grep -r "text-white" app/ features/ components/

# Find rounded-xl (should be rounded-lg for cards)
grep -r "rounded-xl" app/ features/ components/
```

## Files Already Updated

✅ `global.css` - CSS variables with BabyEase brand colors (HSL values)
✅ `tailwind.config.js` - Extended color palette and border radius
✅ `lib/theme.ts` - Theme object with brand colors
✅ `features/feeding/components/BottleFeedingForm.tsx` - Example migration

## Migration Checklist Template

When migrating a component, use this checklist:

- [ ] Search for hardcoded hex colors (`#[0-9A-Fa-f]{6}`)
- [ ] Replace `bg-white` with `bg-card` or `bg-background`
- [ ] Replace `text-white` with appropriate foreground variant
- [ ] Update border radius (`rounded-xl` → `rounded-lg` for cards)
- [ ] Update native component colors (Slider, Icons) to brand hex values
- [ ] Test in light mode
- [ ] Test in dark mode
- [ ] Verify accessibility (contrast)
- [ ] Run linter
- [ ] Update this document if new patterns are found

## Next Steps

- [ ] Update remaining hardcoded colors in components (see Files to Check)
- [ ] Test all screens in dark mode
- [ ] Verify WCAG AA contrast compliance
- [ ] Update Showcase screen with brand color examples
- [ ] Document any edge cases or special patterns found

---

## Quick Links

- [Color Mapping Table](#quick-reference-color-mapping) - Quick lookup for brand colors
- [Step-by-Step Process](#step-by-step-migration-process) - How to migrate components
- [Component Examples](#step-3-component-specific-examples) - Real-world examples
- [Troubleshooting](#troubleshooting) - Common issues and solutions
- [Migration Checklist](#migration-checklist-template) - Use this for each component

---

**Last Updated:** 2025-01-28
**Status:** Active migration guide - Use this document when updating components
