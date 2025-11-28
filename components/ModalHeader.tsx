import { useRouter } from 'expo-router';
import { View } from 'react-native';

import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';

type ModalHeaderProps = {
  title: string;
  onSave?: () => void;
  isSaving?: boolean;
  closeLabel?: string;
  saveLabel?: string;
};

export function ModalHeader({
  title,
  onSave,
  isSaving = false,
  closeLabel = 'Close',
  saveLabel = 'Save',
}: ModalHeaderProps) {
  const router = useRouter();

  return (
    <View className="pt-15 flex-row items-center justify-between border-b border-border bg-background px-5 py-4 dark:bg-card">
      <Button
        variant="link"
        size="sm"
        className="-ml-2 px-2"
        onPress={() => router.back()}
        accessibilityLabel={closeLabel}>
        <Text className="text-base font-semibold">{closeLabel}</Text>
      </Button>
      <Text className="text-xl font-bold text-foreground">{title}</Text>
      {onSave ? (
        <Button
          variant="link"
          size="sm"
          className="px-2"
          onPress={onSave}
          disabled={isSaving}
          accessibilityLabel={saveLabel}
          accessibilityState={{ disabled: isSaving }}>
          <Text className="text-base font-semibold">{saveLabel}</Text>
        </Button>
      ) : (
        <View className="w-12" />
      )}
    </View>
  );
}
