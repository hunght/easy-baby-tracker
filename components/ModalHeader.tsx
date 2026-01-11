import { useRouter } from 'expo-router';
import { View } from 'react-native';

import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { useKeyboardVisible } from '@/hooks/use-keyboard-visible';

type ModalHeaderProps = {
  title: string;
  onSave?: () => void;
  onBack?: () => void;
  isSaving?: boolean;
  closeLabel?: string;
  saveLabel?: string;
  showSaveOnKeyboard?: boolean;
  /** Set to true when parent already handles safe area */
  noTopPadding?: boolean;
};

export function ModalHeader({
  title,
  onSave,
  onBack,
  isSaving = false,
  closeLabel = 'Close',
  saveLabel = 'Save',
  showSaveOnKeyboard = false,
  noTopPadding = false,
}: ModalHeaderProps) {
  const router = useRouter();

  const handleClose = () => {
    if (onBack) {
      onBack();
    } else {
      router.back();
    }
  };
  const isKeyboardVisible = useKeyboardVisible();

  const shouldShowSave = onSave && (showSaveOnKeyboard ? isKeyboardVisible : true);

  return (
    <View
      className={`${noTopPadding ? '' : 'pt-15'} flex-row items-center justify-between border-b border-border bg-background px-5 py-4`}>
      <Button
        variant="link"
        size="sm"
        className="-ml-2 px-2"
        onPress={handleClose}
        accessibilityLabel={closeLabel}
        testID="btn-close">
        <Text className="text-base font-semibold text-foreground">{closeLabel}</Text>
      </Button>
      <Text className="text-xl font-bold text-foreground">{title}</Text>
      {shouldShowSave ? (
        <Button
          size="sm"
          onPress={onSave}
          disabled={isSaving}
          accessibilityLabel={saveLabel}
          accessibilityState={{ disabled: isSaving }}>
          <Text>{saveLabel}</Text>
        </Button>
      ) : (
        <View className="w-12" />
      )}
    </View>
  );
}
