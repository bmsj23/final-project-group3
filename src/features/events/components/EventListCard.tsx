import { Image } from 'expo-image';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { colors } from '../../../theme/colors';
import { radius } from '../../../theme/radius';
import { shadows } from '../../../theme/shadows';
import { spacing } from '../../../theme/spacing';
import { typography } from '../../../theme/typography';
import { formatEventDateTime } from '../formatters';
import type { EventSummary } from '../types';

type EventListCardProps = {
  event: EventSummary;
  categoryName?: string;
  onPress?: () => void;
  variant?: 'featured' | 'compact';
};

const AVATAR_PLACEHOLDER_COLORS = ['#DBEAFE', '#EDE9FE', '#FCE7F3'];

function MemberAvatarStack({ joined }: { joined: number }) {
  const visibleCount = Math.min(joined, 3);
  return (
    <View style={stackStyles.row}>
      <View style={stackStyles.avatars}>
        {Array.from({ length: visibleCount }, (_, i) => (
          <View
            key={i}
            style={[
              stackStyles.avatar,
              { backgroundColor: AVATAR_PLACEHOLDER_COLORS[i % AVATAR_PLACEHOLDER_COLORS.length] },
              i > 0 && stackStyles.avatarOverlap,
            ]}
          />
        ))}
      </View>
      <Text style={stackStyles.label}>{joined} Members joined</Text>
    </View>
  );
}

const stackStyles = StyleSheet.create({
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.xs,
  },
  avatars: {
    flexDirection: 'row',
  },
  avatar: {
    borderColor: colors.bgCard,
    borderRadius: radius.full,
    borderWidth: 2,
    height: 22,
    width: 22,
  },
  avatarOverlap: {
    marginLeft: -8,
  },
  label: {
    ...typography.caption4,
    color: colors.textMuted,
  },
});

export function EventListCard({
  categoryName,
  event,
  onPress,
  variant = 'compact',
}: EventListCardProps) {
  const joinedCount = event.capacity - event.remainingSlots;

  return (
    <Pressable
      accessibilityRole={onPress ? 'button' : undefined}
      onPress={onPress}
      style={[styles.card, variant === 'featured' ? styles.featuredCard : styles.compactCard]}
    >
      {variant === 'featured' ? (
        <>
          <Image
            contentFit="cover"
            source={event.coverImageUrl ? { uri: event.coverImageUrl } : undefined}
            style={styles.featuredImage}
            transition={150}
          />
          <View style={styles.favouriteBadge}>
            <Ionicons color={colors.error} name="heart" size={16} />
          </View>
          <View style={styles.featuredBody}>
            <Text numberOfLines={2} style={styles.featuredTitle}>
              {event.title}
            </Text>
            <View style={styles.metaRow}>
              <Ionicons color={colors.textMuted} name="calendar-outline" size={12} />
              <Text style={styles.meta}>{formatEventDateTime(event.startsAt)}</Text>
            </View>
            <View style={styles.metaRow}>
              <Ionicons color={colors.textMuted} name="location-outline" size={12} />
              <Text numberOfLines={1} style={styles.meta}>{event.location}</Text>
            </View>
            <View style={styles.featuredFooter}>
              <MemberAvatarStack joined={joinedCount} />
              <View style={styles.joinButton}>
                <Text style={styles.joinButtonText}>JOIN NOW</Text>
              </View>
            </View>
          </View>
        </>
      ) : (
        <View style={styles.compactRow}>
          <Image
            contentFit="cover"
            source={event.coverImageUrl ? { uri: event.coverImageUrl } : undefined}
            style={styles.compactImage}
            transition={150}
          />
          <View style={styles.compactBody}>
            <Text numberOfLines={1} style={styles.compactTitle}>
              {event.title}
            </Text>
            <Text numberOfLines={1} style={styles.meta}>
              {formatEventDateTime(event.startsAt)}
            </Text>
            <Text numberOfLines={1} style={styles.meta}>
              {event.location}
            </Text>
            {categoryName ? <Text style={styles.category}>{categoryName}</Text> : null}
          </View>
          <View style={styles.trailingColumn}>
            <Text style={styles.spotsText}>{event.remainingSlots} spots</Text>
            <Text style={styles.joinText}>JOIN NOW</Text>
          </View>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.xl,
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 5,
  },
  featuredCard: {
    width: 292,
  },
  compactCard: {
    padding: spacing.sm,
  },
  featuredImage: {
    backgroundColor: '#DBEAFE',
    height: 170,
    width: '100%',
  },
  favouriteBadge: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: radius.full,
    height: 34,
    justifyContent: 'center',
    position: 'absolute',
    right: spacing.md,
    top: spacing.md,
    width: 34,
  },
  featuredBody: {
    gap: spacing.xs,
    padding: spacing.lg,
  },
  featuredTitle: {
    ...typography.h5,
    color: colors.text,
    fontSize: 21,
  },
  metaRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 4,
  },
  meta: {
    ...typography.caption2,
    color: colors.textMuted,
  },
  featuredFooter: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
  },
  joinButton: {
    backgroundColor: colors.text,
    borderRadius: radius.xl,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  joinButtonText: {
    ...typography.caption3,
    color: colors.textLight,
  },
  compactRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
  },
  compactImage: {
    backgroundColor: '#DBEAFE',
    borderRadius: radius.md,
    height: 72,
    width: 72,
  },
  compactBody: {
    flex: 1,
    gap: 2,
  },
  compactTitle: {
    ...typography.button1,
    color: colors.text,
    fontSize: 17,
  },
  category: {
    ...typography.caption3,
    color: colors.primary,
    marginTop: 2,
  },
  trailingColumn: {
    alignItems: 'flex-end',
    gap: spacing.xs,
    width: 72,
  },
  spotsText: {
    ...typography.caption3,
    color: colors.primary,
  },
  joinText: {
    ...typography.caption3,
    color: colors.text,
  },
});
