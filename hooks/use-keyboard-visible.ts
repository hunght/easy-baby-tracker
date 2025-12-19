import { useEffect, useState } from 'react';
import { Keyboard, Platform } from 'react-native';

/**
 * Hook to detect keyboard visibility
 * Uses platform-specific events for better accuracy:
 * - iOS: keyboardWillShow/keyboardWillHide (fires before animation)
 * - Android: keyboardDidShow/keyboardDidHide (fires after animation)
 *
 * @returns boolean indicating if keyboard is currently visible
 *
 * @example
 * ```tsx
 * const isKeyboardVisible = useKeyboardVisible();
 * if (isKeyboardVisible) {
 *   return null; // Hide component when keyboard is shown
 * }
 * ```
 */
export function useKeyboardVisible(): boolean {
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const keyboardShowListener = Keyboard.addListener(showEvent, () => {
      setIsKeyboardVisible(true);
    });
    const keyboardHideListener = Keyboard.addListener(hideEvent, () => {
      setIsKeyboardVisible(false);
    });

    return () => {
      keyboardShowListener.remove();
      keyboardHideListener.remove();
    };
  }, []);

  return isKeyboardVisible;
}
