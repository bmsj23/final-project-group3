import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { AppStackParamList } from '../../../navigation/types';
import { radius } from '../../../theme/radius';
import { spacing } from '../../../theme/spacing';

type HelpScreenProps = NativeStackScreenProps<AppStackParamList, 'Help'>;

const HELP_ITEMS = [
  {
    icon: 'help-buoy-outline' as const,
    title: 'Frequently Asked Questions',
    text: 'Find quick answers about accounts, events, and bookings.',
  },
  {
    icon: 'mail-outline' as const,
    title: 'Contact Support',
    text: 'Reach the team for account or event concerns.',
  },
  {
    icon: 'document-text-outline' as const,
    title: 'Community Guidelines',
    text: 'Review the expected behavior for organizers and attendees.',
  },
];

export function HelpScreen({ navigation }: HelpScreenProps) {
  return (
    <SafeAreaView style={styles.root} edges={[]}>
      <StatusBar style="light" />
      <LinearGradient colors={['#060D1F', '#0F1E3D', '#091423']} style={StyleSheet.absoluteFill} />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Pressable
            style={({ pressed }) => [styles.backBtn, pressed && styles.backBtnPressed]}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="chevron-back" size={22} color="#F8FAFC" />
          </Pressable>
          <Text style={styles.headerTitle}>Help & Support</Text>
          <View style={styles.headerGhost} />
        </View>

        {HELP_ITEMS.map((item) => (
          <View key={item.title} style={styles.card}>
            <View style={styles.iconWrap}>
              <Ionicons name={item.icon} size={22} color="#F97316" />
            </View>
            <View style={styles.cardBody}>
              <Text style={styles.cardTitle}>{item.title}</Text>
              <Text style={styles.cardText}>{item.text}</Text>
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#060D1F' },
  scroll: {
    flexGrow: 1,
    paddingTop: 56,
    paddingHorizontal: spacing.xl,
    paddingBottom: 32,
    gap: 14,
  },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 24 },
  backBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  backBtnPressed: { opacity: 0.75 },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontFamily: 'Inter_700Bold',
    fontSize: 20,
    color: '#F8FAFC',
  },
  headerGhost: { width: 42 },
  card: {
    flexDirection: 'row',
    gap: spacing.md,
    backgroundColor: '#FFFFFF',
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: spacing.md,
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(249,115,22,0.12)',
  },
  cardBody: { flex: 1, gap: 6 },
  cardTitle: { fontFamily: 'Inter_700Bold', fontSize: 15, color: '#0F172A' },
  cardText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    lineHeight: 20,
    color: '#475569',
  },
});
