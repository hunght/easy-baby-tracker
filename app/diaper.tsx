import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Text } from '@/components/ui/text';
import { DIAPER_CHANGES_QUERY_KEY } from '@/constants/query-keys';
import { saveDiaperChange, type DiaperChangePayload, type DiaperKind } from '@/database/diaper';
import { Stack } from 'expo-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import * as React from 'react';
import { View } from 'react-native';

export default function DiaperModal() {
  const queryClient = useQueryClient();
  const [kind, setKind] = React.useState<DiaperKind>('wet');
  const [notes, setNotes] = React.useState('');

  const mutation = useMutation({
    mutationFn: async () => {
      const payload: DiaperChangePayload = {
        kind,
        time: Math.floor(Date.now() / 1000),
        notes: notes || undefined,
      };
      return saveDiaperChange(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: DIAPER_CHANGES_QUERY_KEY });
    },
  });

  return (
    <View className="flex-1 gap-4 p-4">
      <Stack.Screen options={{ presentation: 'modal', title: 'Log Diaper' }} />
      <Text variant="h1" className="text-xl">Log Diaper Change</Text>
      <Card className="gap-3 p-3">
        <View className="gap-2">
          <Label>Type</Label>
          <Input value={kind} onChangeText={(v) => setKind((v as any) || 'wet')} />
        </View>
        <View className="gap-2">
          <Label>Notes</Label>
          <Input placeholder="Optional notes" value={notes} onChangeText={setNotes} />
        </View>
        <Button disabled={mutation.isPending} onPress={() => mutation.mutate()}>
          <Text>{mutation.isPending ? 'Saving…' : 'Save'}</Text>
        </Button>
      </Card>
    </View>
  );
}
