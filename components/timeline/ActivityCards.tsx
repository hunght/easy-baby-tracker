import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import React from 'react';
import { Text, View } from 'react-native';

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
  color,
}: {
  children: React.ReactNode;
  icon: React.ReactNode;
  color: string;
}) => (
  <View className="mb-3 flex-row items-start rounded-2xl bg-white p-3 shadow-sm shadow-black/5">
    <View
      className="mr-3 h-10 w-10 items-center justify-center rounded-full"
      style={{ backgroundColor: color }}>
      {icon}
    </View>
    <View className="flex-1">{children}</View>
  </View>
);

export const DiaperCard = ({ data }: { data: DiaperChangeRecord }) => {
  const isWet = data.kind === 'wet' || data.kind === 'mixed';
  const isDirty = data.kind === 'soiled' || data.kind === 'mixed';

  return (
    <CardContainer
      color="#E0F2F1"
      icon={<MaterialCommunityIcons name="baby-face-outline" size={24} color="#00695C" />}>
      <Text className="mb-1 text-base font-semibold text-[#333]">Diaper Change</Text>
      <View className="mb-1 flex-row flex-wrap items-center gap-2">
        {isWet && (
          <Text className="overflow-hidden rounded bg-[#F5F5F5] px-2 py-0.5 text-sm text-[#666]">
            💧 Wet
          </Text>
        )}
        {isDirty && (
          <Text className="overflow-hidden rounded bg-[#F5F5F5] px-2 py-0.5 text-sm text-[#666]">
            💩 Dirty
          </Text>
        )}
        {data.color && (
          <View
            className="h-3 w-3 rounded-full border border-[#ddd]"
            style={{ backgroundColor: getColorHex(data.color) }}
          />
        )}
      </View>
      {data.notes && <Text className="mt-1 text-sm italic text-[#888]">{data.notes}</Text>}
    </CardContainer>
  );
};

export const FeedingCard = ({ data }: { data: FeedingRecord }) => {
  const isBottle = data.type === 'bottle';
  const isBreast = data.type === 'breast';

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
        className="overflow-hidden rounded bg-[#F5F5F5] px-2 py-0.5 text-sm text-[#666]">
        {data.amountMl} ml
      </Text>
    );
  }
  if (data.amountGrams != null) {
    rowItems.push(
      <Text
        key="amountGrams"
        className="overflow-hidden rounded bg-[#F5F5F5] px-2 py-0.5 text-sm text-[#666]">
        {data.amountGrams} g
      </Text>
    );
  }
  if (data.duration != null) {
    rowItems.push(
      <Text
        key="duration"
        className="overflow-hidden rounded bg-[#F5F5F5] px-2 py-0.5 text-sm text-[#666]">
        {Math.round(data.duration / 60)} mins
      </Text>
    );
  }
  if (details !== '') {
    rowItems.push(
      <Text
        key="details"
        className="overflow-hidden rounded bg-[#F5F5F5] px-2 py-0.5 text-sm text-[#666]">
        {details}
      </Text>
    );
  }

  return (
    <CardContainer
      color="#FFF3E0"
      icon={<MaterialCommunityIcons name="baby-bottle-outline" size={24} color="#EF6C00" />}>
      <Text className="mb-1 text-base font-semibold text-[#333]">
        {isBottle ? 'Bottle Feeding' : isBreast ? 'Breast Feeding' : 'Solids'}
      </Text>
      {rowItems.length > 0 && (
        <View className="mb-1 flex-row flex-wrap items-center gap-2">{rowItems}</View>
      )}
      {data.ingredient && (
        <Text className="overflow-hidden rounded bg-[#F5F5F5] px-2 py-0.5 text-sm text-[#666]">
          {data.ingredient}
        </Text>
      )}
      {data.notes && <Text className="mt-1 text-sm italic text-[#888]">{data.notes}</Text>}
    </CardContainer>
  );
};

export const SleepCard = ({ data }: { data: SleepSessionRecord }) => {
  const durationMins = data.duration ? Math.round(data.duration / 60) : 0;
  const hours = Math.floor(durationMins / 60);
  const mins = durationMins % 60;

  return (
    <CardContainer
      color="#E8EAF6"
      icon={<Ionicons name="moon-outline" size={24} color="#283593" />}>
      <Text className="mb-1 text-base font-semibold text-[#333]">Sleep ({data.kind})</Text>
      <Text className="overflow-hidden rounded bg-[#F5F5F5] px-2 py-0.5 text-sm text-[#666]">
        {hours > 0 ? `${hours}h ` : ''}
        {mins}m
      </Text>
      {data.notes && <Text className="mt-1 text-sm italic text-[#888]">{data.notes}</Text>}
    </CardContainer>
  );
};

export const GrowthCard = ({ data }: { data: GrowthRecord }) => {
  return (
    <CardContainer
      color="#F3E5F5"
      icon={<MaterialCommunityIcons name="ruler" size={24} color="#6A1B9A" />}>
      <Text className="mb-1 text-base font-semibold text-[#333]">Growth Measurement</Text>
      <View className="mb-1 flex-row flex-wrap items-center gap-2">
        {data.weightKg != null && (
          <Text className="overflow-hidden rounded bg-[#F5F5F5] px-2 py-0.5 text-sm text-[#666]">
            {data.weightKg} kg
          </Text>
        )}
        {data.heightCm != null && (
          <Text className="overflow-hidden rounded bg-[#F5F5F5] px-2 py-0.5 text-sm text-[#666]">
            {data.heightCm} cm
          </Text>
        )}
        {data.headCircumferenceCm != null && (
          <Text className="overflow-hidden rounded bg-[#F5F5F5] px-2 py-0.5 text-sm text-[#666]">
            Head: {data.headCircumferenceCm} cm
          </Text>
        )}
      </View>
      {data.notes && <Text className="mt-1 text-sm italic text-[#888]">{data.notes}</Text>}
    </CardContainer>
  );
};

export const HealthCard = ({ data }: { data: HealthRecord }) => {
  return (
    <CardContainer
      color="#FFEBEE"
      icon={<MaterialCommunityIcons name="medical-bag" size={24} color="#C62828" />}>
      <Text className="mb-1 text-base font-semibold text-[#333]">Health - {data.type}</Text>
      <View className="mb-1 flex-row flex-wrap items-center gap-2">
        {data.temperature != null && (
          <Text className="overflow-hidden rounded bg-[#F5F5F5] px-2 py-0.5 text-sm text-[#666]">
            {data.temperature}°C
          </Text>
        )}
        {data.medicineType && (
          <Text className="overflow-hidden rounded bg-[#F5F5F5] px-2 py-0.5 text-sm text-[#666]">
            {data.medicineType}
          </Text>
        )}
        {data.medication && (
          <Text className="overflow-hidden rounded bg-[#F5F5F5] px-2 py-0.5 text-sm text-[#666]">
            {data.medication}
          </Text>
        )}
      </View>
      {data.symptoms && (
        <Text className="mt-1 text-sm italic text-[#888]">Symptoms: {data.symptoms}</Text>
      )}
      {data.notes && <Text className="mt-1 text-sm italic text-[#888]">{data.notes}</Text>}
    </CardContainer>
  );
};

export const PumpingCard = ({ data }: { data: PumpingRecord }) => {
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
      color="#E1F5FE"
      icon={<MaterialCommunityIcons name="pump" size={24} color="#0277BD" />}>
      <Text className="mb-1 text-base font-semibold text-[#333]">Pumping</Text>
      <View className="mb-1 flex-row flex-wrap items-center gap-2">
        {data.amountMl != null && (
          <Text className="overflow-hidden rounded bg-[#F5F5F5] px-2 py-0.5 text-sm text-[#666]">
            Total: {data.amountMl} ml
          </Text>
        )}
        {data.duration != null && (
          <Text className="overflow-hidden rounded bg-[#F5F5F5] px-2 py-0.5 text-sm text-[#666]">
            {Math.round(data.duration / 60)} mins
          </Text>
        )}
        {details ? (
          <Text className="overflow-hidden rounded bg-[#F5F5F5] px-2 py-0.5 text-sm text-[#666]">
            {details}
          </Text>
        ) : null}
      </View>
      {data.notes && <Text className="mt-1 text-sm italic text-[#888]">{data.notes}</Text>}
    </CardContainer>
  );
};

export const DiaryCard = ({ data }: { data: DiaryEntryRecord }) => {
  return (
    <CardContainer
      color="#FFF8E1"
      icon={<MaterialCommunityIcons name="book-open-variant" size={24} color="#FF8F00" />}>
      <Text className="mb-1 text-base font-semibold text-[#333]">
        {data.title || 'Diary Entry'}
      </Text>
      <Text className="mt-1 text-sm italic text-[#888]" numberOfLines={3}>
        {data.content}
      </Text>
      {data.photoUri && (
        <Text className="overflow-hidden rounded bg-[#F5F5F5] px-2 py-0.5 text-sm text-[#666]">
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
