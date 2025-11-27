import { Link } from 'expo-router';
import { StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useLocalization } from '@/localization/LocalizationProvider';

export default function ModalScreen() {
  const { t } = useLocalization();

  return (
    <ThemedView style={styles.container} testID="modal-container">
      <ThemedText type="title" testID="modal-title">{t('modal.title')}</ThemedText>
      <Link href="/" dismissTo style={styles.link} testID="modal-close-button">
        <ThemedText type="link">{t('modal.link')}</ThemedText>
      </Link>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  link: {
    marginTop: 15,
    paddingVertical: 15,
  },
});
