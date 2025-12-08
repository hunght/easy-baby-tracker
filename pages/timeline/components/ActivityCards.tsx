import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import React from 'react';
import { View } from 'react-native';

import { Text } from '@/components/ui/text';
import { useBrandColor } from '@/hooks/use-brand-color';
import { DiaperChangeRecord } from '@/database/diaper';
import { DiaryEntryRecord } from '@/database/diary';
import { FeedingRecord } from '@/database/feeding';
import { GrowthRecord } from '@/database/growth';
import { HealthRecord } from '@/database/health';
import { PumpingRecord } from '@/database/pumping';
import { SleepSessionRecord } from '@/database/sleep';

const CardContainer = ({
  children,
  icon,
  backgroundColor,
}: {
  children: React.ReactNode;
  icon: React.ReactNode;
  backgroundColor: string;
}) => (
  <View className="mb-3 flex-row items-start rounded-lg bg-card p-3 shadow-sm shadow-black/5">
    <View
      className="mr-3 h-10 w-10 items-center justify-center rounded-full"
      style={{ backgroundColor }}>
      {icon}
    </View>
    <View className="flex-1">{children}</View>
  </View>
);

export const DiaperCard = ({ data }: { data: DiaperChangeRecord }) => {
  const brandColors = useBrandColor();
  const isWet = data.kind === 'wet' || data.kind === 'mixed';
  const isDirty = data.kind === 'soiled' || data.kind === 'mixed';
  const iconColor = brandColors.colors.info;

  return (
    <CardContainer
      backgroundColor={brandColors.colors.info + '20'}
      icon={<MaterialCommunityIcons name="baby-face-outline" size={24} color={iconColor} />}>
      <Text className="mb-1 text-base font-semibold text-foreground">Diaper Change</Text>
      <View className="mb-1 flex-row flex-wrap items-center gap-2">
        {isWet && (
          <Text className="overflow-hidden rounded-sm bg-muted px-2 py-0.5 text-sm text-muted-foreground">
            💧 Wet
          </Text>
        )}
        {isDirty && (
          <Text className="overflow-hidden rounded-sm bg-muted px-2 py-0.5 text-sm text-muted-foreground">
            💩 Dirty
          </Text>
        )}
        {data.color && (
          <View
            className="h-3 w-3 rounded-full border border-border"
            style={{ backgroundColor: getColorHex(data.color) }}
          />
        )}
      </View>
      {data.notes && (
        <Text className="mt-1 text-sm italic text-muted-foreground">{data.notes}</Text>
      )}
    </CardContainer>
  );
};

export const FeedingCard = ({ data }: { data: FeedingRecord }) => {
  const brandColors = useBrandColor();
  const isBottle = data.type === 'bottle';
  const isBreast = data.type === 'breast';
  const iconColor = brandColors.colors.secondary;

  let details = '';
  if (isBreast) {
    if (data.leftDuration != null && data.rightDuration != null) {
      details = `L: ${Math.round(data.leftDuration / 60)}m, R: ${Math.round(data.rightDuration / 60)}m`;
    } else if (data.leftDuration != null) {
      details = `Left: ${Math.round(data.leftDuration / 60)}m`;
    } else if (data.rightDuration != null) {
      details = `Right: ${Math.round(data.rightDuration / 60)}m`;
    }
  }

  const rowItems: React.ReactNode[] = [];
  if (data.amountMl != null) {
    rowItems.push(
      <Text
        key="amountMl"
        className="overflow-hidden rounded-sm bg-muted px-2 py-0.5 text-sm text-muted-foreground">
        {data.amountMl} ml
      </Text>
    );
  }
  if (data.amountGrams != null) {
    rowItems.push(
      <Text
        key="amountGrams"
        className="overflow-hidden rounded-sm bg-muted px-2 py-0.5 text-sm text-muted-foreground">
        {data.amountGrams} g
      </Text>
    );
  }
  if (data.duration != null) {
    rowItems.push(
      <Text
        key="duration"
        className="overflow-hidden rounded-sm bg-muted px-2 py-0.5 text-sm text-muted-foreground">
        {Math.round(data.duration / 60)} mins
      </Text>
    );
  }
  if (details !== '') {
    rowItems.push(
      <Text
        key="details"
        className="overflow-hidden rounded-sm bg-muted px-2 py-0.5 text-sm text-muted-foreground">
        {details}
      </Text>
    );
  }

  return (
    <CardContainer
      backgroundColor={brandColors.colors.secondary + '20'}
      icon={<MaterialCommunityIcons name="baby-bottle-outline" size={24} color={iconColor} />}>
      <Text className="mb-1 text-base font-semibold text-foreground">
        {isBottle ? 'Bottle Feeding' : isBreast ? 'Breast Feeding' : 'Solids'}
      </Text>
      {rowItems.length > 0 && (
        <View className="mb-1 flex-row flex-wrap items-center gap-2">{rowItems}</View>
      )}
      {data.ingredient && (
        <Text className="overflow-hidden rounded-sm bg-muted px-2 py-0.5 text-sm text-muted-foreground">
          {data.ingredient}
        </Text>
      )}
      {data.notes && (
        <Text className="mt-1 text-sm italic text-muted-foreground">{data.notes}</Text>
      )}
    </CardContainer>
  );
};

export const SleepCard = ({ data }: { data: SleepSessionRecord }) => {
  const brandColors = useBrandColor();
  const durationMins = data.duration ? Math.round(data.duration / 60) : 0;
  const hours = Math.floor(durationMins / 60);
  const mins = durationMins % 60;
  const iconColor = brandColors.colors.info;

  return (
    <CardContainer
      backgroundColor={brandColors.colors.info + '20'}
      icon={<Ionicons name="moon-outline" size={24} color={iconColor} />}>
      <Text className="mb-1 text-base font-semibold text-foreground">Sleep ({data.kind})</Text>
      <Text className="overflow-hidden rounded-sm bg-muted px-2 py-0.5 text-sm text-muted-foreground">
        {hours > 0 ? `${hours}h ` : ''}
        {mins}m
      </Text>
      {data.notes && (
        <Text className="mt-1 text-sm italic text-muted-foreground">{data.notes}</Text>
      )}
    </CardContainer>
  );
};

export const GrowthCard = ({ data }: { data: GrowthRecord }) => {
  const brandColors = useBrandColor();
  const iconColor = brandColors.colors.accent;

  return (
    <CardContainer
      backgroundColor={brandColors.colors.accent + '20'}
      icon={<MaterialCommunityIcons name="ruler" size={24} color={iconColor} />}>
      <Text className="mb-1 text-base font-semibold text-foreground">Growth Measurement</Text>
      <View className="mb-1 flex-row flex-wrap items-center gap-2">
        {data.weightKg != null && (
          <Text className="overflow-hidden rounded-sm bg-muted px-2 py-0.5 text-sm text-muted-foreground">
            {data.weightKg} kg
          </Text>
        )}
        {data.heightCm != null && (
          <Text className="overflow-hidden rounded-sm bg-muted px-2 py-0.5 text-sm text-muted-foreground">
            {data.heightCm} cm
          </Text>
        )}
        {data.headCircumferenceCm != null && (
          <Text className="overflow-hidden rounded-sm bg-muted px-2 py-0.5 text-sm text-muted-foreground">
            Head: {data.headCircumferenceCm} cm
          </Text>
        )}
      </View>
      {data.notes && (
        <Text className="mt-1 text-sm italic text-muted-foreground">{data.notes}</Text>
      )}
    </CardContainer>
  );
};

export const HealthCard = ({ data }: { data: HealthRecord }) => {
  const brandColors = useBrandColor();
  const iconColor = brandColors.colors.destructive;

  return (
    <CardContainer
      backgroundColor={brandColors.colors.destructive + '20'}
      icon={<MaterialCommunityIcons name="medical-bag" size={24} color={iconColor} />}>
      <Text className="mb-1 text-base font-semibold text-foreground">Health - {data.type}</Text>
      <View className="mb-1 flex-row flex-wrap items-center gap-2">
        {data.temperature != null && (
          <Text className="overflow-hidden rounded-sm bg-muted px-2 py-0.5 text-sm text-muted-foreground">
            {data.temperature}°C
          </Text>
        )}
        {data.medicineType && (
          <Text className="overflow-hidden rounded-sm bg-muted px-2 py-0.5 text-sm text-muted-foreground">
            {data.medicineType}
          </Text>
        )}
        {data.medication && (
          <Text className="overflow-hidden rounded-sm bg-muted px-2 py-0.5 text-sm text-muted-foreground">
            {data.medication}
          </Text>
        )}
      </View>
      {data.symptoms && (
        <Text className="mt-1 text-sm italic text-muted-foreground">Symptoms: {data.symptoms}</Text>
      )}
      {data.notes && (
        <Text className="mt-1 text-sm italic text-muted-foreground">{data.notes}</Text>
      )}
    </CardContainer>
  );
};

export const PumpingCard = ({ data }: { data: PumpingRecord }) => {
  const brandColors = useBrandColor();
  const iconColor = brandColors.colors.info;
  let details = '';
  if (data.leftAmountMl && data.rightAmountMl) {
    details = `L: ${data.leftAmountMl}ml, R: ${data.rightAmountMl}ml`;
  } else if (data.leftAmountMl) {
    details = `Left: ${data.leftAmountMl}ml`;
  } else if (data.rightAmountMl) {
    details = `Right: ${data.rightAmountMl}ml`;
  }

  return (
    <CardContainer
      backgroundColor={brandColors.colors.info + '20'}
      icon={<MaterialCommunityIcons name="pump" size={24} color={iconColor} />}>
      <Text className="mb-1 text-base font-semibold text-foreground">Pumping</Text>
      <View className="mb-1 flex-row flex-wrap items-center gap-2">
        {data.amountMl != null && (
          <Text className="overflow-hidden rounded-sm bg-muted px-2 py-0.5 text-sm text-muted-foreground">
            Total: {data.amountMl} ml
          </Text>
        )}
        {data.duration != null && (
          <Text className="overflow-hidden rounded-sm bg-muted px-2 py-0.5 text-sm text-muted-foreground">
            {Math.round(data.duration / 60)} mins
          </Text>
        )}
        {details ? (
          <Text className="overflow-hidden rounded-sm bg-muted px-2 py-0.5 text-sm text-muted-foreground">
            {details}
          </Text>
        ) : null}
      </View>
      {data.notes && (
        <Text className="mt-1 text-sm italic text-muted-foreground">{data.notes}</Text>
      )}
    </CardContainer>
  );
};

export const DiaryCard = ({ data }: { data: DiaryEntryRecord }) => {
  const brandColors = useBrandColor();
  const iconColor = brandColors.colors.secondary;

  return (
    <CardContainer
      backgroundColor={brandColors.colors.secondary + '20'}
      icon={<MaterialCommunityIcons name="book-open-variant" size={24} color={iconColor} />}>
      <Text className="mb-1 text-base font-semibold text-foreground">
        {data.title || 'Diary Entry'}
      </Text>
      <Text className="mt-1 text-sm italic text-muted-foreground" numberOfLines={3}>
        {data.content}
      </Text>
      {data.photoUri && (
        <Text className="overflow-hidden rounded-sm bg-muted px-2 py-0.5 text-sm text-muted-foreground">
          📷 1 photo
        </Text>
      )}
    </CardContainer>
  );
};

function getColorHex(colorName: string | null) {
  switch (colorName) {
    case 'yellow':
      return '#FFEB3B';
    case 'brown':
      return '#795548';
    case 'olive_green':
      return '#556B2F';
    case 'dark_green':
      return '#006400';
    case 'red':
      return '#F44336';
    case 'black':
      return '#000000';
    case 'white':
      return '#FFFFFF';
    default:
      return 'transparent';
  }
}
