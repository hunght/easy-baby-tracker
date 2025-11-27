import { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { TabPageHeader } from '@/components/TabPageHeader';
import { DiaperCharts } from '@/components/charts/DiaperCharts';
import { FeedingCharts } from '@/components/charts/FeedingCharts';
import { GrowthCharts } from '@/components/charts/GrowthCharts';
import { SleepCharts } from '@/components/charts/SleepCharts';
import { BrandColors } from '@/constants/theme';
import { useLocalization } from '@/localization/LocalizationProvider';

type ChartCategory = 'feeding' | 'sleep' | 'growth' | 'diaper';

export default function ChartsScreen() {
  const { t } = useLocalization();
  const [selectedCategory, setSelectedCategory] = useState<ChartCategory>('feeding');

  const categories: { id: ChartCategory; label: string }[] = [
    { id: 'feeding', label: t('tracking.tiles.feeding.label') },
    { id: 'sleep', label: t('tracking.tiles.sleep.label') },
    { id: 'growth', label: t('tracking.tiles.growth.label') },
    { id: 'diaper', label: t('tracking.tiles.diaper.label') },
  ];

  const renderContent = () => {
    switch (selectedCategory) {
      case 'feeding':
        return <FeedingCharts />;
      case 'sleep':
        return <SleepCharts />;
      case 'growth':
        return <GrowthCharts />;
      case 'diaper':
        return <DiaperCharts />;
      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      <TabPageHeader title={t('charts.title')} />

      <View style={styles.tabsContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsContent}>
          {categories.map((cat) => (
            <TouchableOpacity
              key={cat.id}
              style={[
                styles.tab,
                selectedCategory === cat.id && styles.activeTab,
              ]}
              onPress={() => setSelectedCategory(cat.id)}
            >
              <Text
                style={[
                  styles.tabText,
                  selectedCategory === cat.id && styles.activeTabText,
                ]}
              >
                {cat.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        {renderContent()}
        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F6F2FF',
  },
  tabsContainer: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  tabsContent: {
    paddingHorizontal: 20,
    gap: 12,
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F5F7FA',
    borderWidth: 1,
    borderColor: '#E1E1E1',
  },
  activeTab: {
    backgroundColor: BrandColors.primary,
    borderColor: BrandColors.primary,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#687076',
  },
  activeTabText: {
    color: '#fff',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
});
