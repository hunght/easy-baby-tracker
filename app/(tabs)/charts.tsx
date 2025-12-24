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
        <TabsContent value="timeline" className="flex-1">
          <TimelineTabContent />
        </TabsContent>

        <TabsContent value="charts" className="flex-1">
          <ChartsTabContent />
        </TabsContent>

        <View className="rounded-t-2xl border-t border-border/20 bg-background px-4 pb-4 pt-3 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
          <TabsList className="w-full">
            <TabsTrigger value="timeline" className="flex-1">
              <Text className="text-base font-semibold">{t('tabs.timeline')}</Text>
            </TabsTrigger>
            <TabsTrigger value="charts" className="flex-1">
              <Text className="text-base font-semibold">{t('tabs.charts')}</Text>
            </TabsTrigger>
          </TabsList>
        </View>
      </Tabs>
    </View>
  );
}
