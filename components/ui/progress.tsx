import { cn } from '@/lib/utils';
import * as React from 'react';
import { View } from 'react-native';

interface ProgressProps {
  value?: number;
  max?: number;
  className?: string;
}

const Progress = React.forwardRef<View, ProgressProps>(
  ({ value = 0, max = 100, className, ...props }, ref) => {
    const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

    return (
      <View
        ref={ref}
        className={cn('h-2 w-full overflow-hidden rounded-full bg-secondary', className)}
        {...props}>
        <View className="h-full bg-primary" style={{ width: `${percentage}%` }} />
      </View>
    );
  }
);

Progress.displayName = 'Progress';

export { Progress };
