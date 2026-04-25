import type { ComponentProps } from 'react';

import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';

import { styles } from './privacyScreen.styles';

type ActionItem = {
  destructive?: boolean;
  icon: ComponentProps<typeof Ionicons>['name'];
  onPress: () => void;
  text: string;
  title: string;
};

type PrivacyActionListProps = {
  items: ActionItem[];
};

export function PrivacyActionList({ items }: PrivacyActionListProps) {
  return (
    <View style={styles.actionList}>
      {items.map((item) => (
        <Pressable
          key={item.title}
          accessibilityRole="button"
          style={({ pressed }) => [styles.actionRow, pressed && styles.pressed]}
          onPress={item.onPress}
        >
          <View
            style={[
              styles.actionIconWrap,
              item.destructive ? styles.actionIconDanger : styles.actionIconDefault,
            ]}
          >
            <Ionicons name={item.icon} size={18} color={item.destructive ? '#DC2626' : '#2563EB'} />
          </View>
          <View style={styles.actionCopy}>
            <Text style={[styles.actionTitle, item.destructive && styles.actionTitleDanger]}>{item.title}</Text>
            <Text style={styles.actionText}>{item.text}</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color="#94A3B8" />
        </Pressable>
      ))}
    </View>
  );
}
