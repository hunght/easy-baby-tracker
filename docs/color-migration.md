# BabyEase Color Migration to NativeWind

## Overview

This document explains how the BabyEase brand colors from `constants/theme.ts` have been migrated to the NativeWind/Tailwind CSS configuration.

## Color Mapping

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

## Border Radius (from BRANDING.md)

| Usage          | Old | New Tailwind   | Value |
| -------------- | --- | -------------- | ----- |
| Cards          | -   | `rounded-lg`   | 12px  |
| Buttons        | -   | `rounded-md`   | 8px   |
| Pills/Badges   | -   | `rounded-pill` | 24px  |
| Small elements | -   | `rounded-sm`   | 4px   |

## Migration Examples

### Before (Old Theme)

```tsx
import { BrandColors } from '@/constants/theme';

<View style={{ backgroundColor: BrandColors.primary }}>
  <Text style={{ color: BrandColors.graySoft }}>Hello</Text>
</View>;
```

### After (NativeWind)

```tsx
<View className="bg-primary">
  <Text className="text-background">Hello</Text>
</View>
```

### Button Examples

```tsx
// Primary button
<Button variant="default" className="bg-primary">
  <Text className="text-primary-foreground">Save</Text>
</Button>

// Secondary button
<Button variant="secondary" className="bg-secondary">
  <Text className="text-secondary-foreground">Cancel</Text>
</Button>

// Success indicator
<Badge className="bg-mint">
  <Text className="text-foreground">Success</Text>
</Badge>
```

## Dark Mode Support

All colors have been adjusted for dark mode with proper contrast:

- Primary: Lighter tint (#5B7FFF → lighter for dark backgrounds)
- Background: Dark (#11181C)
- Foreground: Light (#ECEDEE)
- Borders: Adjusted for visibility on dark backgrounds

## Chart Colors

Chart colors now use the brand palette:

1. `--chart-1`: Primary (#5B7FFF)
2. `--chart-2`: Secondary (#FFB347)
3. `--chart-3`: Accent Pink (#FF8AB8)
4. `--chart-4`: Mint (#7FE3CC)
5. `--chart-5`: Warning (#FF7A59)

## Typography

Font configuration remains platform-specific (from `Fonts` in theme.ts):

- iOS: System fonts (SF Pro, SF Pro Rounded, etc.)
- Android: Roboto
- Web: System UI stack

For custom fonts (e.g., Nunito), follow the BRANDING.md guide.

## Usage Guidelines

1. **Always use Tailwind classes** instead of hardcoded hex colors
2. **Use semantic tokens** (primary, secondary, accent) instead of specific colors
3. **Test in both light and dark mode** to ensure proper contrast
4. **Follow WCAG AA** contrast requirements for accessibility

## Files Updated

- `global.css` - CSS variables with BabyEase brand colors
- `tailwind.config.js` - Extended color palette and border radius
- This document - Migration reference

## Next Steps

- [ ] Update any remaining hardcoded colors in components
- [ ] Test all screens in dark mode
- [ ] Verify WCAG AA contrast compliance
- [ ] Update Showcase screen with brand color examples

---

Last Updated: 2025-11-28
