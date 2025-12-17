---
description: Guidelines for one-handed mobile UI/UX design patterns
---

# One-Handed UI/UX Design Guidelines

This document outlines patterns and best practices for designing mobile interfaces optimized for one-handed use, particularly important for parents who often hold their baby while using the app.

## Core Principles

### 1. Thumb Zone Optimization

- Place primary actions in the **bottom third** of the screen (easy thumb reach)
- Use **sticky bottom bars** for key actions (Add, Save, Remove)
- Avoid placing critical buttons in top corners

### 2. Touch Target Sizes

| Element                      | Minimum Size | Recommended |
| ---------------------------- | ------------ | ----------- |
| Buttons                      | 44px         | 48-56px     |
| Checkboxes                   | 24px         | 28px+       |
| List items                   | 48px         | 56px+       |
| FAB (Floating Action Button) | 56px         | 56-64px     |

### 3. Interactive Patterns

#### Full-Row Tappable Areas

```tsx
// Instead of small tap targets, make entire rows tappable
<Pressable className="flex-row items-center p-4 active:opacity-80" onPress={handleAction}>
  <Icon />
  <Text>Label</Text>
  <ChevronRight /> {/* Visual affordance */}
</Pressable>
```

#### Bottom Sheet Modals

- Use slide-up modals from bottom for settings/options
- Keep modal content within thumb reach
- Allow tap-outside-to-dismiss

```tsx
<Modal animationType="slide" transparent>
  <Pressable className="flex-1 bg-black/50" onPress={onClose}>
    <View className="flex-1" /> {/* Spacer - tappable to close */}
    <Pressable onPress={(e) => e.stopPropagation()}>{/* Modal content at bottom */}</Pressable>
  </Pressable>
</Modal>
```

#### Horizontal Segment Selectors

```tsx
<View className="flex-row gap-2">
  <Pressable className="h-10 flex-1 rounded-xl bg-accent">
    <Text>Today</Text>
  </Pressable>
  <Pressable className="h-10 flex-1 rounded-xl bg-muted">
    <Text>Tomorrow</Text>
  </Pressable>
</View>
```

### 4. Haptic Feedback

- Use `expo-haptics` for confirmatory actions
- Light feedback for toggles/selections
- Medium feedback for successful completions

```tsx
import * as Haptics from 'expo-haptics';

// On button press
Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

// On successful action
Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
```

### 5. List Design

#### Vertical Lists (Preferred)

- Full-width items instead of horizontal chips
- Large checkboxes on left side (easy thumb access)
- Secondary actions on right side

```tsx
<View className="flex-row items-center rounded-2xl border p-4">
  {/* Left: Primary action (checkbox) - thumb zone */}
  <Pressable className="w-14 items-center">
    <Checkbox size={28} />
  </Pressable>

  {/* Center: Content */}
  <View className="flex-1">
    <Text>Item Label</Text>
  </View>

  {/* Right: Navigate/More */}
  <ChevronRight />
</View>
```

### 6. Floating Action Button (FAB)

- Position at bottom-right (right thumb) or bottom-center
- Use for primary "Add" actions
- Size: 56-64px

```tsx
<Pressable
  className="absolute bottom-8 right-5 h-14 w-14 items-center justify-center rounded-full bg-accent shadow-lg"
  style={{ elevation: 8 }}>
  <Plus size={28} color="#FFF" />
</Pressable>
```

### 7. Form Inputs

#### Time/Date Pickers

- Inline display: Label and value on same row
- Entire row tappable to open picker
- Picker slides up from bottom

```tsx
<Pressable className="flex-row items-center justify-between py-3">
  <View className="flex-row items-center gap-3">
    <Clock size={20} />
    <Text>Reminder Time</Text>
  </View>
  <Text className="font-semibold text-accent">10:30 AM</Text>
</Pressable>
```

#### Toggle Switches

- Place label on left, switch on right
- Make entire row tappable (not just switch)
- Minimum row height: 48px

### 8. Collapsible Sections

- Use for secondary information (benefits, details)
- Show chevron indicator for expand/collapse
- Default to collapsed for cleaner UI

```tsx
<Pressable onPress={() => setExpanded(!expanded)}>
  <View className="flex-row items-center justify-between">
    <Text>Benefits</Text>
    {expanded ? <ChevronUp /> : <ChevronDown />}
  </View>
</Pressable>;
{
  expanded && <View>{/* Content */}</View>;
}
```

### 9. Baby Profile Forms

Profile editing screens require special attention since parents frequently update baby information.

#### Layout Structure

```
┌──────────────────────────────┐
│  Close     Edit Profile      │  ← Header (minimal)
├──────────────────────────────┤
│                              │
│         [Add Photo]          │  ← Photo at top (optional)
│                              │
│  Nickname ─────────────────  │
│  ┌─────────────────────────┐ │
│  │ Baby                    │ │  ← Input: 48px height
│  └─────────────────────────┘ │
│                              │
│  Gender ───────────────────  │
│  ┌───────┬───────┬───────┐  │
│  │Unknown│  Boy  │  Girl │  │  ← Segment: 48px height
│  └───────┴───────┴───────┘  │
│                              │
│  Birthdate ────────────────  │  ← Full-row tappable
│  ┌─────────────────────────┐ │
│  │ Dec 15, 2025            │ │
│  └─────────────────────────┘ │
│                              │
│  Due Date ─────────────────  │
│  ┌─────────────────────────┐ │
│  │ Dec 15, 2025            │ │
│  └─────────────────────────┘ │
│                              │
├──────────────────────────────┤
│  ┌─────────────────────────┐ │
│  │      Save Changes       │ │  ← Sticky bottom: 56px
│  └─────────────────────────┘ │
└──────────────────────────────┘
```

#### Key Patterns

1. **Sticky Save Bar**: Always at bottom (56px height, rounded-2xl)
2. **Gender Selector**: 3-segment toggle with 48px height, full-width
3. **Date Pickers**: Full-row tappable, slides up from bottom
4. **Photo Action**: Centered at top, uses bottom sheet for options
5. **Haptic Feedback**: On gender change and save

```tsx
{/* Sticky Save Bar */}
<View className="absolute bottom-0 left-0 right-0 px-5 pb-8 pt-4">
  <Pressable
    onPress={handleSave}
    className="h-14 items-center justify-center rounded-2xl bg-accent">
    <Text className="text-lg font-bold text-white">Save Changes</Text>
  </Pressable>
</View>
```

## Implementation Checklist

When creating a new screen, verify:

- [ ] Primary actions in bottom third of screen
- [ ] Sticky bottom bar for key buttons
- [ ] Touch targets ≥ 48px height
- [ ] Full-row tap areas where applicable
- [ ] Modals slide up from bottom
- [ ] Haptic feedback on key interactions
- [ ] Checkboxes/toggles on left side of rows
- [ ] Cancel/Done buttons easily reachable

## Examples in This Codebase

| Screen                    | Pattern Used                              |
| ------------------------- | ----------------------------------------- |
| `habit.tsx`               | FAB, large checkmarks, full-card tappable |
| `habit-detail.tsx`        | Sticky bottom bar, reminder modal         |
| `habit-select.tsx`        | Full-width list items, large checkboxes   |
| `scheduling.tsx`          | Segment selector, timeline cards          |
| `DateTimePickerModal.tsx` | Bottom sheet, Cancel/Done buttons         |
| `profile-edit.tsx`        | Sticky save bar, gender selector, dates   |
| `feeding.tsx`             | Tabs, sticky save, timer buttons (88px)   |
| `pumping.tsx`             | Dual timers, quick amount presets         |
| `diaper.tsx`              | 2x2 type grid, color picker               |
| `sleep.tsx`               | Large timer button, time cards            |
| `health.tsx`              | Temperature presets, status display       |
| `growth.tsx`              | +/- quick adjust buttons                  |
