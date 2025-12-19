import { MaterialCommunityIcons } from '@expo/vector-icons';
import { View } from 'react-native';

import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { useLocalization } from '@/localization/LocalizationProvider';
import { useKeyboardVisible } from '@/hooks/use-keyboard-visible';

type StickySaveBarProps = {
  onPress: () => void;
  isSaving?: boolean;
  disabled?: boolean;
  label?: string;
  savingLabel?: string;
  icon?: keyof typeof MaterialCommunityIcons.glyphMap;
  containerClassName?: string;
};

export function StickySaveBar({
  onPress,
  isSaving = false,
  disabled = false,
  label,
  savingLabel,
  icon = 'content-save',
  containerClassName = 'bg-background',
}: StickySaveBarProps) {
  const { t } = useLocalization();
  const isKeyboardVisible = useKeyboardVisible();

  // Hide the bar when keyboard is visible
  if (isKeyboardVisible) {
    return null;
  }

  const isDisabled = isSaving || disabled;
  const displayLabel = isSaving
    ? (savingLabel ?? label ?? t('common.saving'))
    : (label ?? t('common.save'));

  return (
    <View
      className={`absolute bottom-0 left-0 right-0 border-t border-border ${containerClassName} px-5 pb-8 pt-4`}>
      <Button onPress={onPress} disabled={isDisabled} variant="default" size="lg">
        <MaterialCommunityIcons name={icon} size={22} color={isDisabled ? '#999' : '#FFF'} />
        <Text>{displayLabel}</Text>
      </Button>
    </View>
  );
}
