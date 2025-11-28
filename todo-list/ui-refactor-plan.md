# Project-Wide UI Refactor Plan

Date: 2025-11-28
Project: native-wind (BabyEase)

## Executive Summary

This document outlines a comprehensive plan to refactor the entire project to use the native-wind design system, replacing all StyleSheet usage with Tailwind CSS utility classes and leveraging React Native Reusables components.

## Current State Analysis

### ✅ Already Migrated (Phase 1 & 2.1 - Completed)

- `app/(tabs)/scheduling.tsx` - Fully migrated with Badge integration
- `app/(tabs)/charts.tsx` - Fully migrated with Badge integration
- `app/(tabs)/settings.tsx` - Fully migrated
- `app/(tabs)/index.tsx` - **Dashboard** - Migrated with Badge (baby tabs) and Card (tracking tiles)
- `components/ui/badge.tsx` - Enhanced with interactive states
- `components/ui/card.tsx` - Enhanced with onPress support
- `components/timeline/TimelineFilters.tsx` - Refactored to use Badge

### 🔄 Needs Migration

#### High Priority - Core Screens (Phase 2)

**Dashboard & Main Screens**

1. ~~`app/(tabs)/index.tsx`~~ - Main dashboard/home screen ✅ **COMPLETED**
2. `app/(tabs)/timeline.tsx` - Timeline view (partially migrated)
3. `app/index.tsx` - App entry point

**Activity Tracking Screens** 4. `app/feeding.tsx` - Feeding tracker 5. `app/sleep.tsx` - Sleep tracker 6. `app/diaper.tsx` - Diaper tracker 7. `app/pumping.tsx` - Pumping tracker 8. `app/health.tsx` - Health records 9. `app/growth.tsx` - Growth tracking 10. `app/diary.tsx` - Diary entries

**Profile & Settings** 11. `app/profile-edit.tsx` - Profile editing 12. `app/profile-selection.tsx` - Profile selection

#### Medium Priority - Feature Screens (Phase 3)

**Scheduling Features** 13. `app/easy-schedule.tsx` - E.A.S.Y. schedule screen 14. `app/easy-schedule-info.tsx` - E.A.S.Y. schedule info modal

**Modals & Overlays** 15. `app/modal.tsx` - Generic modal

#### Lower Priority - Components (Phase 4)

**Timeline Components** 16. `components/timeline/TimelineItem.tsx` 17. `components/timeline/ActivityCards.tsx`

**Feeding Components** 18. `components/feeding/BreastFeedingForm.tsx` 19. `components/feeding/BottleFeedingForm.tsx` 20. `components/feeding/SolidsFeedingForm.tsx`

**Chart Components** 21. `components/charts/DiaperCharts.tsx` 22. `components/charts/SleepCharts.tsx` 23. `components/charts/FeedingCharts.tsx` 24. `components/charts/GrowthCharts.tsx` 25. `components/charts/ChartCard.tsx` 26. `components/charts/SummaryCard.tsx`

**UI Components** 27. `components/TabPageHeader.tsx` 28. `components/ui/TimePickerField.tsx` 29. `components/ui/TimeField.tsx` 30. `components/ui/DatePickerField.tsx` 31. `components/ui/DateTimePickerModal.tsx` 32. `components/ui/NotificationBar.tsx` 33. `components/ui/PrimaryButton.tsx` 34. `components/ui/collapsible.tsx`

**Utility Components** 35. `components/parallax-scroll-view.tsx` 36. `components/themed-text.tsx`

## Migration Strategy

### Phase 2: Core Activity Tracking (Week 1-2)

**Goal**: Migrate all main activity tracking screens to native-wind

#### 2.1 Dashboard & Timeline

- [ ] Refactor `app/(tabs)/index.tsx` (Dashboard)
  - Replace StyleSheet with Tailwind classes
  - Use Card components for activity tiles
  - Implement Badge for status indicators
  - Add accessibility labels
- [ ] Complete `app/(tabs)/timeline.tsx` migration
  - Convert remaining StyleSheet usage
  - Ensure TimelineItem uses design tokens

#### 2.2 Activity Tracking Screens

For each screen (`feeding.tsx`, `sleep.tsx`, `diaper.tsx`, `pumping.tsx`, `health.tsx`, `growth.tsx`, `diary.tsx`):

- [ ] Replace StyleSheet with native-wind classes
- [ ] Use Button component for actions
- [ ] Use Card for content grouping
- [ ] Use Input for form fields
- [ ] Use Badge for status/type indicators
- [ ] Add proper accessibility labels
- [ ] Test on iOS and Android

**Common Patterns**:

```tsx
// Before
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F6F2FF' },
  button: { backgroundColor: '#6200EE', padding: 16 }
});

// After
<View className="flex-1 bg-background">
  <Button variant="default" className="p-4">
```

#### 2.3 Profile Screens

- [ ] Refactor `app/profile-edit.tsx`
  - Use Input components
  - Use DatePickerField (already exists)
  - Use Button for save/cancel
- [ ] Refactor `app/profile-selection.tsx`
  - Use Card for profile cards
  - Use Avatar component
  - Use Badge for active profile indicator

### Phase 3: Feature Screens (Week 3)

**Goal**: Migrate scheduling and modal screens

#### 3.1 Scheduling Features

- [ ] Refactor `app/easy-schedule.tsx`
  - Use Card for schedule display
  - Use Collapsible for expandable sections
  - Use Button for actions
- [ ] Refactor `app/easy-schedule-info.tsx`
  - Use Card for info sections
  - Use Text component with design tokens

#### 3.2 Modals

- [ ] Refactor `app/modal.tsx`
  - Consider using Dialog component from RNR
  - Use design tokens for styling

### Phase 4: Component Library (Week 4)

**Goal**: Refactor all supporting components

#### 4.1 Timeline Components

- [ ] Migrate `components/timeline/TimelineItem.tsx`
- [ ] Migrate `components/timeline/ActivityCards.tsx`

#### 4.2 Feeding Components

- [ ] Migrate `components/feeding/BreastFeedingForm.tsx`
- [ ] Migrate `components/feeding/BottleFeedingForm.tsx`
- [ ] Migrate `components/feeding/SolidsFeedingForm.tsx`

#### 4.3 Chart Components

- [ ] Migrate all chart components to use design tokens
- [ ] Ensure consistent Card usage
- [ ] Add proper accessibility

#### 4.4 UI Components

- [ ] Refactor `components/TabPageHeader.tsx`
- [ ] Review and update picker components
- [ ] Consolidate `PrimaryButton` with `Button` component
- [ ] Update `NotificationBar` to use design tokens

## Design System Enforcement

### Color Tokens (Use These Instead of Hex)

```tsx
// ❌ Don't use
backgroundColor: '#6200EE';
color: '#F6F2FF';

// ✅ Use
className = 'bg-primary text-background';
```

### Component Mapping

| Old Pattern                        | New Component         |
| ---------------------------------- | --------------------- |
| `TouchableOpacity` + custom styles | `Button` component    |
| `View` + border/background         | `Card` component      |
| `TextInput` + custom styles        | `Input` component     |
| Custom chip/tag                    | `Badge` component     |
| Custom label                       | `Label` component     |
| Hardcoded divider                  | `Separator` component |

### Accessibility Requirements

Every interactive element must have:

- `accessibilityRole` (button, link, etc.)
- `accessibilityLabel` (descriptive text)
- `accessibilityState` (selected, disabled, etc.)
- `accessibilityHint` (optional, for complex actions)

## New Components to Add

### Recommended Additions

1. **Dialog** - For confirmation modals

   ```bash
   npx @react-native-reusables/cli@latest add dialog
   ```

2. **Alert Dialog** - For important alerts

   ```bash
   npx @react-native-reusables/cli@latest add alert-dialog
   ```

3. **Checkbox** - For multi-select forms

   ```bash
   npx @react-native-reusables/cli@latest add checkbox
   ```

4. **Radio Group** - For single-select options

   ```bash
   npx @react-native-reusables/cli@latest add radio-group
   ```

5. **Select** - For dropdown selections

   ```bash
   npx @react-native-reusables/cli@latest add select
   ```

6. **Switch** - For toggle settings

   ```bash
   npx @react-native-reusables/cli@latest add switch
   ```

7. **Tabs** - For tabbed interfaces (if needed beyond bottom tabs)

   ```bash
   npx @react-native-reusables/cli@latest add tabs
   ```

8. **Progress** - For loading states

   ```bash
   npx @react-native-reusables/cli@latest add progress
   ```

9. **Skeleton** - For loading placeholders

   ```bash
   npx @react-native-reusables/cli@latest add skeleton
   ```

10. **Tooltip** - For helpful hints
    ```bash
    npx @react-native-reusables/cli@latest add tooltip
    ```

## Testing Strategy

### Per-Screen Checklist

- [ ] Visual regression - Compare before/after screenshots
- [ ] Functionality - All interactions work correctly
- [ ] Accessibility - Screen reader announces correctly
- [ ] iOS testing - Test on iOS simulator/device
- [ ] Android testing - Test on Android emulator/device
- [ ] Dark mode - Verify colors work in dark mode
- [ ] TypeScript - No type errors (`npx tsc --noEmit`)

### Automated Testing

```bash
# Run before each commit
npm run type-check
npm run lint
```

## Migration Workflow

### For Each Screen/Component

1. **Create branch**: `git checkout -b refactor/screen-name`
2. **Analyze current code**: Identify StyleSheet usage and custom components
3. **Plan replacement**: Map old styles to Tailwind classes
4. **Implement changes**:
   - Replace StyleSheet with className
   - Replace custom components with RNR components
   - Add accessibility labels
5. **Test thoroughly**: Follow testing checklist
6. **Commit**: `git commit -m "refactor(ui): migrate screen-name to native-wind"`
7. **Create PR**: Request review
8. **Merge**: After approval

### Example Migration

**Before**:

```tsx
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F6F2FF',
    padding: 16,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  button: {
    backgroundColor: '#6200EE',
    padding: 12,
    borderRadius: 8,
  },
});

<View style={styles.container}>
  <View style={styles.card}>
    <Text>Content</Text>
  </View>
  <TouchableOpacity style={styles.button} onPress={handlePress}>
    <Text style={{ color: 'white' }}>Save</Text>
  </TouchableOpacity>
</View>;
```

**After**:

```tsx
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';

<View className="flex-1 bg-background p-4">
  <Card className="mb-3">
    <CardContent>
      <Text>Content</Text>
    </CardContent>
  </Card>
  <Button variant="default" onPress={handlePress} accessibilityLabel="Save changes">
    <Text>Save</Text>
  </Button>
</View>;
```

## Success Metrics

### Code Quality

- [x] Zero StyleSheet.create() usage in app/ ✅
- [x] Zero StyleSheet.create() usage in components/ ✅
- [x] ESLint rule banning StyleSheet imports ✅
- [ ] Zero hardcoded hex colors
- [ ] 100% TypeScript type coverage
- [ ] All interactive elements have accessibility labels

### Performance

- [ ] No performance regression
- [ ] Bundle size remains similar or smaller
- [ ] Smooth 60fps animations

### Developer Experience

- [ ] Faster development with utility classes
- [ ] Consistent component usage
- [ ] Better code reusability
- [ ] Easier theming/dark mode support

## Timeline

| Phase                    | Duration    | Completion Target        |
| ------------------------ | ----------- | ------------------------ |
| Phase 1 (Completed)      | -           | ✅ Done                  |
| Phase 2: Core Screens    | 2 weeks     | Week of Dec 9, 2025      |
| Phase 3: Feature Screens | 1 week      | Week of Dec 16, 2025     |
| Phase 4: Components      | 1 week      | Week of Dec 23, 2025     |
| **Total**                | **4 weeks** | **End of December 2025** |

## Resources

- [UI Components Library](./ui-components-library.md)
- [NativeWind Documentation](https://www.nativewind.dev/)
- [React Native Reusables](https://rnr-docs.vercel.app/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Previous Migration Report](./ui-migration-report-2025-11-28.md)

## Notes

- Maintain backward compatibility during migration
- Test each screen thoroughly before moving to next
- Update Showcase screen with new components as they're added
- Document any custom patterns or edge cases
- Consider creating a migration guide for team members

---

Last Updated: 2025-11-28
Status: Planning Phase
