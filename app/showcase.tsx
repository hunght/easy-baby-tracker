import React from 'react';
import { ScrollView, Text, View } from 'react-native';

import { Badge } from '@/components/ui/badge';

export default function ShowcaseScreen() {
    return (
        <ScrollView className="flex-1 bg-background p-4" contentContainerClassName="gap-6 pb-10">
            <View className="gap-2">
                <Text className="text-2xl font-bold text-foreground">UI Showcase</Text>
                <Text className="text-muted-foreground">
                    A collection of UI components used in the app.
                </Text>
            </View>

            <View className="gap-4">
                <Text className="text-xl font-semibold text-foreground">Badges</Text>

                <View className="gap-2">
                    <Text className="text-sm font-medium text-muted-foreground">Variants</Text>
                    <View className="flex-row flex-wrap gap-2">
                        <Badge variant="default"><Text>Default</Text></Badge>
                        <Badge variant="secondary"><Text>Secondary</Text></Badge>
                        <Badge variant="destructive"><Text>Destructive</Text></Badge>
                        <Badge variant="outline"><Text>Outline</Text></Badge>
                    </View>
                </View>

                <View className="gap-2">
                    <Text className="text-sm font-medium text-muted-foreground">Interactive (Pressable)</Text>
                    <View className="flex-row flex-wrap gap-2">
                        <Badge variant="default" onPress={() => console.log('Pressed Default')}>
                            <Text>Press Me</Text>
                        </Badge>
                        <Badge variant="secondary" onPress={() => console.log('Pressed Secondary')}>
                            <Text>Press Me</Text>
                        </Badge>
                        <Badge variant="outline" onPress={() => console.log('Pressed Outline')}>
                            <Text>Press Me</Text>
                        </Badge>
                    </View>
                </View>

                <View className="gap-2">
                    <Text className="text-sm font-medium text-muted-foreground">Custom Styles</Text>
                    <View className="flex-row flex-wrap gap-2">
                        <Badge className="bg-blue-500"><Text className="text-white">Custom BG</Text></Badge>
                        <Badge variant="outline" className="border-purple-500"><Text className="text-purple-500">Custom Border</Text></Badge>
                    </View>
                </View>
            </View>
        </ScrollView>
    );
}
