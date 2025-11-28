import { Text, TextClassContext } from '@/components/ui/text';
import { cn } from '@/lib/utils';
import { Pressable, View, type ViewProps } from 'react-native';

type CardProps = ViewProps &
  React.RefAttributes<View> & {
    onPress?: () => void;
    accessibilityLabel?: string;
    accessibilityRole?: string;
  };

function Card({ className, onPress, accessibilityLabel, accessibilityRole, ...props }: CardProps) {
  const Component = onPress ? Pressable : View;
  return (
    <TextClassContext.Provider value="text-card-foreground">
      <Component
        className={cn(
          'flex flex-col gap-6 rounded-xl border border-border bg-card py-6 shadow-sm shadow-black/5',
          onPress && 'active:opacity-70',
          className
        )}
        onPress={onPress}
        accessibilityLabel={accessibilityLabel}
        accessibilityRole={accessibilityRole}
        {...props}
      />
    </TextClassContext.Provider>
  );
}

function CardHeader({ className, ...props }: ViewProps & React.RefAttributes<View>) {
  return <View className={cn('flex flex-col gap-1.5 px-6', className)} {...props} />;
}

function CardTitle({
  className,
  ...props
}: React.ComponentProps<typeof Text> & React.RefAttributes<Text>) {
  return (
    <Text
      role="heading"
      aria-level={3}
      className={cn('font-semibold leading-none', className)}
      {...props}
    />
  );
}

function CardDescription({
  className,
  ...props
}: React.ComponentProps<typeof Text> & React.RefAttributes<Text>) {
  return <Text className={cn('text-sm text-muted-foreground', className)} {...props} />;
}

function CardContent({ className, ...props }: ViewProps & React.RefAttributes<View>) {
  return <View className={cn('px-6', className)} {...props} />;
}

function CardFooter({ className, ...props }: ViewProps & React.RefAttributes<View>) {
  return <View className={cn('flex flex-row items-center px-6', className)} {...props} />;
}

export { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle };
