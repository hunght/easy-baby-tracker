import { useState } from 'react';
import { View } from 'react-native';

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
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
        <View className="rounded-b-2xl bg-background px-4 pb-3 pt-2  ">
          <TabsList className="w-full">
            <TabsTrigger value="timeline" className="flex-1">
              <Text className="font-semibold">{t('tabs.timeline')}</Text>
            </TabsTrigger>
            <TabsTrigger value="charts" className="flex-1">
              <Text className="font-semibold">{t('tabs.charts')}</Text>
            </TabsTrigger>
          </TabsList>
        </View>

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
