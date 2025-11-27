import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { Link, Tabs } from 'expo-router';
import { Baby, BedSingle, Milk, ScrollText } from 'lucide-react-native';
import { router } from 'expo-router';
import * as React from 'react';
import { View } from 'react-native';

export default function TrackingTab() {
  return (
    <View className="flex-1 gap-4 p-4">
      <Text variant="h1" className="text-2xl">Track activities</Text>
      <View className="grid-cols-2 gap-3 web:grid">
        <Card className="p-3">
          <Text className="mb-2 font-medium">Feeding</Text>
          <Button onPress={() => router.push({ pathname: '/feeding' })}>
            <Icon as={Milk} className="mr-2 size-5" />
            <Text>Log feeding</Text>
          </Button>
        </Card>
        <Card className="p-3">
          <Text className="mb-2 font-medium">Sleep</Text>
          <Button onPress={() => router.push({ pathname: '/sleep' })}>
            <Icon as={BedSingle} className="mr-2 size-5" />
            <Text>Log sleep</Text>
          </Button>
        </Card>
        <Card className="p-3">
          <Text className="mb-2 font-medium">Diaper</Text>
          <Button onPress={() => router.push({ pathname: '/diaper' })}>
            <Icon as={Baby} className="mr-2 size-5" />
            <Text>Log diaper</Text>
          </Button>
        </Card>
        <Card className="p-3">
          <Text className="mb-2 font-medium">Diary</Text>
          <Button onPress={() => router.push({ pathname: '/diary' })}>
            <Icon as={ScrollText} className="mr-2 size-5" />
            <Text>New diary entry</Text>
          </Button>
        </Card>
      </View>
    </View>
  );
}

export const unstable_settings = { tabs: true };

export function TabsLayout() {
  return (
    <Tabs>
      <Tabs.Screen name="index" options={{ title: 'Track' }} />
      <Tabs.Screen name="timeline" options={{ title: 'Timeline' }} />
    </Tabs>
  );
}
