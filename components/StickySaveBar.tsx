import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Pressable, View } from 'react-native';

import { Text } from '@/components/ui/text';
import { useLocalization } from '@/localization/LocalizationProvider';

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
  const isDisabled = isSaving || disabled;
  const displayLabel = isSaving
    ? (savingLabel ?? label ?? t('common.saving'))
    : (label ?? t('common.save'));

  return (
    <View
      className={`absolute bottom-0 left-0 right-0 border-t border-border ${containerClassName} px-5 pb-8 pt-4`}>
      <Pressable
        onPress={onPress}
        disabled={isDisabled}
        className={`h-14 flex-row items-center justify-center gap-2 rounded-2xl ${
          isDisabled ? 'bg-muted' : 'bg-accent'
        }`}
        style={{
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          elevation: 3,
        }}>
        <MaterialCommunityIcons name={icon} size={22} color={isDisabled ? '#999' : '#FFF'} />
        <Text
          className={`text-lg font-bold ${isDisabled ? 'text-muted-foreground' : 'text-white'}`}>
          {displayLabel}
        </Text>
      </Pressable>
    </View>
  );
}
