import { useState } from 'react';
import { View } from 'react-native';

import { TabPageHeader } from '@/components/TabPageHeader';
import { Text } from '@/components/ui/text';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useLocalization } from '@/localization/LocalizationProvider';
import { TimelineTabContent } from '@/pages/timeline/TimelineTabContent';
import { ChartsTabContent } from '@/pages/charts/ChartsTabContent';

export default function ChartsScreen() {
  const { t } = useLocalization();
  const [activeTab, setActiveTab] = useState('timeline');

  return (
    <View className="flex-1 bg-background">
      <TabPageHeader title={t('charts.title')} />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
        <TabsList className="mx-4 mt-2">
          <TabsTrigger value="timeline">
            <Text>{t('tabs.timeline')}</Text>
          </TabsTrigger>
          <TabsTrigger value="charts">
            <Text>{t('tabs.charts')}</Text>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="timeline" className="flex-1">
          <TimelineTabContent />
        </TabsContent>

        <TabsContent value="charts" className="flex-1">
          <ChartsTabContent />
        </TabsContent>
      </Tabs>
    </View>
  );
}
