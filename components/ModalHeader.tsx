import { useRouter } from 'expo-router';
import { Pressable, View } from 'react-native';

import { Text } from '@/components/ui/text';

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
    <View className="pt-15 flex-row items-center justify-between border-b border-border px-5 py-4">
      <Pressable
        onPress={() => router.back()}
        accessibilityRole="button"
        accessibilityLabel={closeLabel}>
        <Text className="text-base font-semibold text-primary">{closeLabel}</Text>
      </Pressable>
      <Text className="text-xl font-bold text-foreground">{title}</Text>
      {onSave ? (
        <Pressable
          onPress={onSave}
          disabled={isSaving}
          accessibilityRole="button"
          accessibilityLabel={saveLabel}
          accessibilityState={{ disabled: isSaving }}>
          <Text
            className={`text-base font-semibold ${isSaving ? 'text-muted-foreground' : 'text-primary'}`}>
            {saveLabel}
          </Text>
        </Pressable>
      ) : (
        <View className="w-12" />
      )}
    </View>
  );
}
