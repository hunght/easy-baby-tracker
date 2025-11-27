import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Text } from '@/components/ui/text';
import { Stack } from 'expo-router';
import * as React from 'react';
import { View } from 'react-native';

export default function DiaryModal() {
  return (
    <View className="flex-1 gap-4 p-4">
      <Stack.Screen options={{ presentation: 'modal', title: 'New Diary Entry' }} />
      <Text variant="h1" className="text-xl">New Diary Entry</Text>
      <Card className="gap-3 p-3">
        <View className="gap-2">
          <Label>Title</Label>
          <Input placeholder="Title" />
        </View>
        <View className="gap-2">
          <Label>Content</Label>
          <Input placeholder="Write something..." />
        </View>
        <Button>
          <Text>Save</Text>
        </Button>
      </Card>
    </View>
  );
}
