import type { ComponentProps } from 'react';

import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';

import { styles } from './helpScreen.styles';

type HelpAction = {
  cta?: string;
  icon: ComponentProps<typeof Ionicons>['name'];
  onPress: () => void;
  text: string;
  title: string;
};

type HelpActionListProps = {
  items: HelpAction[];
};

export function HelpActionList({ items }: HelpActionListProps) {
  return (
    <View style={styles.actionList}>
      {items.map((item) => (
        <Pressable
          key={item.title}
          accessibilityRole="button"
          style={({ pressed }) => [styles.actionRow, pressed && styles.pressed]}
          onPress={item.onPress}
        >
          <View style={styles.actionIconWrap}>
            <Ionicons name={item.icon} size={20} color="#2563EB" />
          </View>
          <View style={styles.actionCopy}>
            <Text style={styles.actionTitle}>{item.title}</Text>
            <Text style={styles.actionText}>{item.text}</Text>
            {item.cta ? <Text style={styles.actionCta}>{item.cta}</Text> : null}
          </View>
          <Ionicons name="chevron-forward" size={16} color="#CBD5E1" />
        </Pressable>
      ))}
    </View>
  );
}
