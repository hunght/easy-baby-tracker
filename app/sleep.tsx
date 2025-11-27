import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Text } from '@/components/ui/text';
import { SLEEP_SESSIONS_QUERY_KEY } from '@/constants/query-keys';
import { saveSleepSession, type SleepSessionPayload, type SleepSessionKind } from '@/database/sleep';
import { Stack } from 'expo-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import * as React from 'react';
import { View } from 'react-native';

export default function SleepModal() {
  const queryClient = useQueryClient();
  const [kind, setKind] = React.useState<SleepSessionKind>('nap');
  const [start, setStart] = React.useState('');
  const [end, setEnd] = React.useState('');

  const mutation = useMutation({
    mutationFn: async () => {
      const toUnix = (t: string) => {
        const [hh, mm] = t.split(':').map(Number);
        const now = new Date();
        now.setHours(hh || 0, mm || 0, 0, 0);
        return Math.floor(now.getTime() / 1000);
      };
      const payload: SleepSessionPayload = {
        kind,
        startTime: start ? toUnix(start) : Math.floor(Date.now() / 1000),
        endTime: end ? toUnix(end) : undefined,
        notes: undefined,
      };
      return saveSleepSession(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SLEEP_SESSIONS_QUERY_KEY });
    },
  });

  return (
    <View className="flex-1 gap-4 p-4">
      <Stack.Screen options={{ presentation: 'modal', title: 'Log Sleep' }} />
      <Text variant="h1" className="text-xl">Log Sleep</Text>
      <Card className="gap-3 p-3">
        <View className="gap-2">
          <Label>Kind</Label>
          <Input value={kind} onChangeText={(v) => setKind((v as any) || 'nap')} />
        </View>
        <View className="gap-2">
          <Label>Start time (HH:MM)</Label>
          <Input placeholder="e.g. 07:00" value={start} onChangeText={setStart} />
        </View>
        <View className="gap-2">
          <Label>End time (HH:MM)</Label>
          <Input placeholder="e.g. 08:30" value={end} onChangeText={setEnd} />
        </View>
        <Button disabled={mutation.isPending} onPress={() => mutation.mutate()}>
          <Text>{mutation.isPending ? 'Saving…' : 'Save'}</Text>
        </Button>
      </Card>
    </View>
  );
}
