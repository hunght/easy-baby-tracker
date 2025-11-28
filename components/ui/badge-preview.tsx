import { Badge } from '@/components/ui/badge';
import { Text } from '@/components/ui/text';
import { Icon } from '@/components/ui/icon';
import { BadgeCheckIcon } from 'lucide-react-native';
import { View } from 'react-native';

export function BadgePreview() {
  return (
    <View className="flex flex-col items-start gap-4 p-4">
      <View className="flex flex-row flex-wrap gap-2">
        <Badge><Text>Default</Text></Badge>
        <Badge variant="secondary"><Text>Secondary</Text></Badge>
        <Badge variant="destructive"><Text>Destructive</Text></Badge>
        <Badge variant="outline"><Text>Outline</Text></Badge>
        <Badge variant="neutral"><Text>Neutral</Text></Badge>
        <Badge variant="subtle"><Text>Subtle</Text></Badge>
      </View>
      <View className="flex flex-row flex-wrap gap-2 items-center">
        <Badge variant="neutral" onPress={() => {}} className="bg-blue-500 dark:bg-blue-600">
          <Icon as={BadgeCheckIcon} className="text-white" />
          <Text className="text-white">Verified</Text>
        </Badge>
        <Badge count={8} variant="outline" />
        <Badge count={99} variant="destructive" />
        <Badge count="20+" variant="secondary" />
      </View>
      <View className="flex flex-row flex-wrap gap-2 items-center">
        <Badge size="sm"><Text>Small</Text></Badge>
        <Badge size="lg"><Text>Large</Text></Badge>
        <Badge size="lg" onPress={() => {}}><Text>Clickable</Text></Badge>
      </View>
    </View>
  );
}
