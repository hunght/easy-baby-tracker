import { Link } from 'expo-router';
import { View } from 'react-native';

import { Text } from '@/components/ui/text';
import { useLocalization } from '@/localization/LocalizationProvider';

export default function ModalScreen() {
  const { t } = useLocalization();

  return (
    <View className="flex-1 items-center justify-center p-5" testID="modal-container">
      <Text className="mb-4 text-2xl font-bold text-foreground" testID="modal-title">
        {t('modal.title')}
      </Text>
      <Link href="/" dismissTo className="mt-4 py-4" testID="modal-close-button">
        <Text className="text-primary underline">{t('modal.link')}</Text>
      </Link>
    </View>
  );
}
