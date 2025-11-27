import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Text } from '@/components/ui/text';
import { FEEDINGS_QUERY_KEY } from '@/constants/query-keys';
import { saveFeeding, type FeedingPayload } from '@/database/feeding';
import { Stack } from 'expo-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import * as React from 'react';
import { View } from 'react-native';

export default function FeedingModal() {
  const queryClient = useQueryClient();
  const [amountMl, setAmountMl] = React.useState('');
  const [notes, setNotes] = React.useState('');
  const [type, setType] = React.useState<FeedingPayload['type']>('bottle');

  const mutation = useMutation({
    mutationFn: async () => {
      const payload: FeedingPayload = {
        type,
        startTime: Math.floor(Date.now() / 1000),
        amountMl: amountMl ? Number(amountMl) : undefined,
        notes: notes || undefined,
      };
      return saveFeeding(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: FEEDINGS_QUERY_KEY });
    },
  });

  return (
    <View className="flex-1 gap-4 p-4">
      <Stack.Screen options={{ presentation: 'modal', title: 'Log Feeding' }} />
      <Text variant="h1" className="text-xl">Log Feeding</Text>
      <Card className="gap-3 p-3">
        <View className="gap-2">
          <Label>Type</Label>
          <Input value={type} onChangeText={(v) => setType((v as any) || 'bottle')} />
        </View>
        <View className="gap-2">
          <Label>Amount (ml)</Label>
          <Input placeholder="e.g. 120" keyboardType="numeric" value={amountMl} onChangeText={setAmountMl} />
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
