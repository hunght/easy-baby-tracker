# UI Components Library Documentation

## Overview

This project uses [React Native Reusables](https://rnr-docs.vercel.app/) - a collection of universal, unstyled components built with Radix UI and styled with NativeWind/Tailwind CSS.

## Installation Command

To add new components from the library, use:

```bash
npx @react-native-reusables/cli@latest add <component-name>
```

Example:

```bash
npx @react-native-reusables/cli@latest add accordion
```

## Currently Installed Components

### Core UI Components

- **Avatar** - `components/ui/avatar.tsx` - User profile images with fallback
- **Badge** - `components/ui/badge.tsx` - Labels, tags, and status indicators
- **Button** - `components/ui/button.tsx` - Interactive buttons with variants
- **Card** - `components/ui/card.tsx` - Container for content grouping
- **Collapsible** - `components/ui/collapsible.tsx` - Expandable/collapsible content
- **Input** - `components/ui/input.tsx` - Text input fields
- **Label** - `components/ui/label.tsx` - Form labels
- **Popover** - `components/ui/popover.tsx` - Floating content containers
- **Separator** - `components/ui/separator.tsx` - Visual dividers
- **Text** - `components/ui/text.tsx` - Styled text component

### Custom Components

- **DatePickerField** - Date selection with platform-specific UI
- **TimePickerField** - Time selection with platform-specific UI
- **DateTimePickerModal** - Combined date/time picker modal
- **NotificationBar** - Toast-style notifications
- **PrimaryButton** - App-specific primary button variant
- **Icon** - Lucide icon wrapper
- **IconSymbol** - SF Symbols for iOS

## Available Components (Not Yet Installed)

![Available Components](/Users/owner/.gemini/antigravity/brain/6fcde1f6-157b-45e8-941b-69eeade1b40c/uploaded_image_1764296617021.png)

### Layout & Navigation

- **Accordion** - Collapsible sections with headers
- **Tabs** - Tab navigation component
- **Menubar** - Menu bar navigation

### Forms & Input

- **Checkbox** - Checkbox input
- **Radio Group** - Radio button groups
- **Select** - Dropdown selection
- **Switch** - Toggle switch
- **Textarea** - Multi-line text input
- **Toggle** - Toggle button
- **Toggle Group** - Group of toggle buttons

### Feedback & Overlays

- **Alert** - Alert messages
- **Alert Dialog** - Modal alert dialogs
- **Dialog** - Modal dialogs
- **Progress** - Progress indicators
- **Skeleton** - Loading placeholders
- **Tooltip** - Hover tooltips

### Advanced

- **Aspect Ratio** - Maintain aspect ratio containers
- **Context Menu** - Right-click context menus
- **Dropdown Menu** - Dropdown menus
- **Hover Card** - Hover-triggered cards

## Usage Examples

### Badge Component

```tsx
import { Badge } from '@/components/ui/badge';
import { Text } from '@/components/ui/text';

// Static badge
<Badge variant="default">
  <Text>New</Text>
</Badge>

// Interactive badge
<Badge
  variant="outline"
  onPress={() => console.log('Pressed')}
  accessibilityLabel="Filter by category"
>
  <Text>Category</Text>
</Badge>
```

### Button Component

```tsx
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';

<Button variant="default" onPress={handlePress}>
  <Text>Click Me</Text>
</Button>;
```

### Card Component

```tsx
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Text } from '@/components/ui/text';

<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
  </CardHeader>
  <CardContent>
    <Text>Content goes here</Text>
  </CardContent>
</Card>;
```

## Design System Integration

All components use the NativeWind design tokens defined in `tailwind.config.js`:

### Colors

- `primary` - Primary brand color
- `secondary` - Secondary color
- `accent` - Accent color
- `destructive` - Error/danger color
- `muted` - Muted/disabled color
- `card` - Card background
- `border` - Border color
- `foreground` - Text color
- `background` - Background color

### Variants

Most components support these variants:

- `default` - Primary style
- `secondary` - Secondary style
- `destructive` - Error/danger style
- `outline` - Outlined style
- `ghost` - Minimal style

## Best Practices

1. **Accessibility**: Always add `accessibilityLabel` to interactive components
2. **Consistency**: Use design tokens instead of hardcoded colors
3. **Reusability**: Prefer existing components over custom implementations
4. **Testing**: Test components on both iOS and Android
5. **Documentation**: Update this file when adding new components

## Adding New Components

1. Run the CLI command:

   ```bash
   npx @react-native-reusables/cli@latest add <component-name>
   ```

2. The component will be added to `components/ui/`

3. Import and use in your screens:

   ```tsx
   import { ComponentName } from '@/components/ui/component-name';
   ```

4. Update this documentation with usage examples

## Resources

- [React Native Reusables Documentation](https://rnr-docs.vercel.app/)
- [NativeWind Documentation](https://www.nativewind.dev/)
- [Radix UI Documentation](https://www.radix-ui.com/)
