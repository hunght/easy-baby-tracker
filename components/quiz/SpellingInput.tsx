import { forwardRef, useEffect, useRef, useImperativeHandle } from 'react';
import { TextInput, View, type TextInputProps } from 'react-native';

import { cn } from '@/lib/utils';

export interface SpellingInputRef {
  focus: () => void;
  clear: () => void;
}

interface SpellingInputProps extends Omit<TextInputProps, 'ref'> {
  value: string;
  onChangeText: (text: string) => void;
  onSubmit: () => void;
  disabled?: boolean;
  autoFocus?: boolean;
  className?: string;
}

export const SpellingInput = forwardRef<SpellingInputRef, SpellingInputProps>(
  ({ value, onChangeText, onSubmit, disabled, autoFocus = true, className, ...props }, ref) => {
    const inputRef = useRef<TextInput>(null);

    useImperativeHandle(ref, () => ({
      focus: () => inputRef.current?.focus(),
      clear: () => {
        onChangeText('');
        inputRef.current?.clear();
      },
    }));

    useEffect(() => {
      if (autoFocus && !disabled) {
        // Small delay to ensure the component is mounted
        const timer = setTimeout(() => {
          inputRef.current?.focus();
        }, 100);
        return () => clearTimeout(timer);
      }
    }, [autoFocus, disabled]);

    return (
      <View
        className={cn(
          'rounded-xl border-2 border-border bg-card px-4 py-3',
          disabled && 'opacity-50',
          className
        )}>
        <TextInput
          ref={inputRef}
          value={value}
          onChangeText={onChangeText}
          onSubmitEditing={onSubmit}
          editable={!disabled}
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="off"
          spellCheck={false}
          returnKeyType="done"
          placeholder="Type your spelling..."
          placeholderTextColor="#9CA3AF"
          className="text-center text-2xl font-semibold text-foreground"
          {...props}
        />
      </View>
    );
  }
);

SpellingInput.displayName = 'SpellingInput';
