import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useCallback, useMemo, useState } from 'react';
import { Alert, Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';

import { AccessNotice } from '../../../components/ui/AccessNotice';
import { DarkHero } from '../../../components/ui/DarkHero';
import { EmptyStateCard } from '../../../components/ui/EmptyStateCard';
import { ScreenContainer } from '../../../components/ui/ScreenContainer';
import { SectionHeader } from '../../../components/ui/SectionHeader';
import { formatEventDateTime, formatEventStatus } from '../../../features/events/formatters';
import type { EventRecord } from '../../../lib/supabase/types';
import type { AppStackParamList } from '../../../navigation/types';
import { useAppSession } from '../../../providers/AppSessionProvider';
import { colors } from '../../../theme/colors';
import { layout } from '../../../theme/layout';
import { radius } from '../../../theme/radius';
import { spacing } from '../../../theme/spacing';
import { typography } from '../../../theme/typography';
import {
  deleteEventByAdmin,
  deleteUserByAdmin,
  fetchAdminUsers,
  fetchModerationEvents,
  setUserSuspensionByAdmin,
  updateEventStatusByAdmin,
  updateUserRoleByAdmin,
} from '../api';
import type { AdminUserSummary } from '../types';

type AdminUsersScreenProps = NativeStackScreenProps<AppStackParamList, 'AdminUsers'>;

function mapEventForAdminRow(event: EventRecord) {
  return {
    id: event.id,
    title: event.title,
    startsAt: event.date_time,
    status: event.status,
  };
}

export function AdminUsersScreen({ navigation }: AdminUsersScreenProps) {
  const { profile } = useAppSession();
  const isAdmin = profile?.role === 'admin';
  const [users, setUsers] = useState<AdminUserSummary[]>([]);
  const [events, setEvents] = useState<Array<{ id: string; title: string; startsAt: string; status: EventRecord['status'] }>>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [userFilter, setUserFilter] = useState<'all' | 'admin' | 'user' | 'suspended'>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const filteredUsers = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();
    return users.filter((user) => {
      const matchesQuery = normalizedQuery.length === 0
        || user.email.toLowerCase().includes(normalizedQuery)
        || (user.fullName ?? '').toLowerCase().includes(normalizedQuery);

      const matchesFilter = userFilter === 'all'
        || (userFilter === 'admin' && user.role === 'admin')
        || (userFilter === 'user' && user.role === 'user')
        || (userFilter === 'suspended' && user.isSuspended);

      return matchesQuery && matchesFilter;
    });
  }, [searchQuery, userFilter, users]);

  const loadAdminData = useCallback(async (isRefresh = false) => {
    if (!isAdmin) {
      setUsers([]);
      setEvents([]);
      setIsLoading(false);
      setIsRefreshing(false);
      return;
    }

    if (isRefresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    try {
      const [{ data: nextUsers, error: usersError }, { data: nextEvents, error: eventsError }] =
        await Promise.all([fetchAdminUsers(), fetchModerationEvents()]);

      if (usersError) {
        throw usersError;
      }
      if (eventsError) {
        throw eventsError;
      }

      setUsers(nextUsers);
      setEvents(nextEvents.map(mapEventForAdminRow));
      setErrorMessage(null);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to load admin data.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [isAdmin]);

  useFocusEffect(
    useCallback(() => {
      void loadAdminData();
    }, [loadAdminData]),
  );

  const handleRoleToggle = useCallback(async (user: AdminUserSummary) => {
    const nextRole = user.role === 'admin' ? 'user' : 'admin';
    try {
      const { error } = await updateUserRoleByAdmin(user.id, nextRole);
      if (error) {
        throw error;
      }
      await loadAdminData(true);
    } catch (error) {
      Alert.alert('Unable to update role', error instanceof Error ? error.message : 'Please try again.');
    }
  }, [loadAdminData]);

  const handleSuspensionToggle = useCallback(async (user: AdminUserSummary) => {
    try {
      const { error } = await setUserSuspensionByAdmin(user.id, !user.isSuspended);
      if (error) {
        throw error;
      }
      await loadAdminData(true);
    } catch (error) {
      Alert.alert('Unable to update status', error instanceof Error ? error.message : 'Please try again.');
    }
  }, [loadAdminData]);

  const handleDeleteUser = useCallback((user: AdminUserSummary) => {
    Alert.alert(
      'Delete this user profile?',
      'This removes the profile row and related organizer data. This cannot be undone from the app.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            void (async () => {
              try {
                const { error } = await deleteUserByAdmin(user.id);
                if (error) {
                  throw error;
                }
                await loadAdminData(true);
              } catch (error) {
                Alert.alert('Unable to delete user', error instanceof Error ? error.message : 'Please try again.');
              }
            })();
          },
        },
      ],
    );
  }, [loadAdminData]);

  const handleCancelEvent = useCallback(async (eventId: string) => {
    try {
      const { error } = await updateEventStatusByAdmin(eventId, 'cancelled');
      if (error) {
        throw error;
      }
      await loadAdminData(true);
    } catch (error) {
      Alert.alert('Unable to cancel event', error instanceof Error ? error.message : 'Please try again.');
    }
  }, [loadAdminData]);

  const handleDeleteEvent = useCallback((eventId: string) => {
    Alert.alert(
      'Delete this event?',
      'This permanently removes the event.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            void (async () => {
              try {
                const { error } = await deleteEventByAdmin(eventId);
                if (error) {
                  throw error;
                }
                await loadAdminData(true);
              } catch (error) {
                Alert.alert('Unable to delete event', error instanceof Error ? error.message : 'Please try again.');
              }
            })();
          },
        },
      ],
    );
  }, [loadAdminData]);

  const handleBackPress = useCallback(() => {
    if (navigation.canGoBack()) {
      navigation.goBack();
      return;
    }
    navigation.navigate('Tabs', { screen: 'Profile' });
  }, [navigation]);

  return (
    <ScreenContainer bg={colors.bgDark} noPadding>
      <StatusBar style="light" />
      <ScrollView
        bounces={false}
        contentContainerStyle={styles.content}
        overScrollMode="never"
        refreshControl={isAdmin ? (
          <RefreshControl
            onRefresh={() => void loadAdminData(true)}
            refreshing={isRefreshing}
            tintColor={colors.primary}
          />
        ) : undefined}
        showsVerticalScrollIndicator={false}
        style={styles.scroll}
      >
        <DarkHero
          eyebrow="Administration"
          title="Admin Panel"
          bottomSlot={(
            <View style={styles.heroBottom}>
              <Pressable
                accessibilityRole="button"
                onPress={handleBackPress}
                style={({ pressed }) => [styles.heroBackButton, pressed && styles.buttonPressed]}
              >
                <Ionicons color={colors.textLight} name="chevron-back" size={18} />
                <Text style={styles.heroBackText}>Back</Text>
              </Pressable>
              {isAdmin ? (
                <View style={styles.heroStats}>
                  <View style={styles.heroStatCard}>
                    <Text style={styles.heroStatValue}>{users.length}</Text>
                    <Text style={styles.heroStatLabel}>Users</Text>
                  </View>
                  <View style={styles.heroStatCard}>
                    <Text style={styles.heroStatValue}>{events.length}</Text>
                    <Text style={styles.heroStatLabel}>Events</Text>
                  </View>
                </View>
              ) : null}
            </View>
          )}
        />

        <View style={styles.body}>
          {!isAdmin ? (
            <View style={styles.restrictedWrap}>
              <AccessNotice
                body="Only administrators can access this screen."
                title="Admin access required"
              />
              <Pressable
                accessibilityRole="button"
                onPress={handleBackPress}
                style={({ pressed }) => [styles.primaryButton, pressed && styles.buttonPressed]}
              >
                <Text style={styles.primaryButtonText}>Go Back</Text>
              </Pressable>
            </View>
          ) : errorMessage ? (
            <View style={styles.stateWrap}>
              <EmptyStateCard body={errorMessage} icon="cloud-offline-outline" title="Unable to load admin data" />
            </View>
          ) : isLoading ? (
            <View style={styles.stateWrap}>
              <EmptyStateCard body="Loading users and moderation queue." icon="hourglass-outline" title="Loading admin panel" />
            </View>
          ) : (
            <>
              <View style={styles.sectionSurface}>
                <SectionHeader title="User Management" />
                <View style={styles.filterSection}>
                  <TextInput
                    autoCapitalize="none"
                    autoCorrect={false}
                    onChangeText={setSearchQuery}
                    placeholder="Search by name or email"
                    placeholderTextColor={colors.textMuted}
                    style={styles.searchInput}
                    value={searchQuery}
                  />
                  <View style={styles.filterRow}>
                    {[
                      { key: 'all' as const, label: 'All' },
                      { key: 'admin' as const, label: 'Admins' },
                      { key: 'user' as const, label: 'Users' },
                      { key: 'suspended' as const, label: 'Suspended' },
                    ].map((filter) => (
                      <Pressable
                        key={filter.key}
                        accessibilityRole="button"
                        onPress={() => setUserFilter(filter.key)}
                        style={({ pressed }) => [
                          styles.filterPill,
                          userFilter === filter.key && styles.filterPillActive,
                          pressed && styles.buttonPressed,
                        ]}
                      >
                        <Text style={[styles.filterPillText, userFilter === filter.key && styles.filterPillTextActive]}>
                          {filter.label}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </View>
                {filteredUsers.length === 0 ? (
                  <EmptyStateCard body="No users were found." icon="people-outline" title="No users" />
                ) : (
                  <View style={styles.cardList}>
                    {filteredUsers.map((user) => {
                      const isSelf = user.id === profile?.id;
                      return (
                        <View key={user.id} style={styles.userCard}>
                          <View style={styles.userHeader}>
                            <Text numberOfLines={1} style={styles.userName}>{user.fullName ?? 'Unnamed user'}</Text>
                            <View style={[styles.roleBadge, user.role === 'admin' ? styles.roleAdmin : styles.roleUser]}>
                              <Text style={styles.roleBadgeText}>{user.role.toUpperCase()}</Text>
                            </View>
                          </View>
                          <Text numberOfLines={1} style={styles.userEmail}>{user.email}</Text>
                          <Text style={styles.userMeta}>
                            Joined {new Date(user.createdAt).toLocaleDateString('en-PH')}
                          </Text>
                          <View style={styles.actionRow}>
                            <Pressable
                              accessibilityRole="button"
                              disabled={isSelf}
                              onPress={() => void handleRoleToggle(user)}
                              style={({ pressed }) => [
                                styles.actionButton,
                                isSelf && styles.disabledButton,
                                pressed && !isSelf && styles.buttonPressed,
                              ]}
                            >
                              <Text style={styles.actionButtonText}>{user.role === 'admin' ? 'Demote' : 'Promote'}</Text>
                            </Pressable>
                            <Pressable
                              accessibilityRole="button"
                              disabled={isSelf}
                              onPress={() => void handleSuspensionToggle(user)}
                              style={({ pressed }) => [
                                styles.actionButton,
                                isSelf && styles.disabledButton,
                                pressed && !isSelf && styles.buttonPressed,
                              ]}
                            >
                              <Text style={styles.actionButtonText}>{user.isSuspended ? 'Activate' : 'Suspend'}</Text>
                            </Pressable>
                            <Pressable
                              accessibilityRole="button"
                              disabled={isSelf}
                              onPress={() => handleDeleteUser(user)}
                              style={({ pressed }) => [
                                styles.dangerButton,
                                isSelf && styles.disabledButton,
                                pressed && !isSelf && styles.buttonPressed,
                              ]}
                            >
                              <Text style={styles.dangerButtonText}>Delete</Text>
                            </Pressable>
                          </View>
                        </View>
                      );
                    })}
                  </View>
                )}
              </View>

              <View style={styles.sectionSurface}>
                <SectionHeader title="Event Moderation" />
                {events.length === 0 ? (
                  <EmptyStateCard body="No events are in the moderation queue." icon="flag-outline" title="Queue is clear" />
                ) : (
                  <View style={styles.cardList}>
                    {events.map((event) => (
                      <View key={event.id} style={styles.eventCard}>
                        <Text numberOfLines={2} style={styles.eventTitle}>{event.title}</Text>
                        <Text style={styles.eventMeta}>{formatEventDateTime(event.startsAt)}</Text>
                        <Text style={styles.eventMeta}>Status: {formatEventStatus(event.status)}</Text>
                        <View style={styles.actionRow}>
                          <Pressable
                            accessibilityRole="button"
                            disabled={event.status === 'cancelled'}
                            onPress={() => void handleCancelEvent(event.id)}
                            style={({ pressed }) => [
                              styles.actionButton,
                              event.status === 'cancelled' && styles.disabledButton,
                              pressed && event.status !== 'cancelled' && styles.buttonPressed,
                            ]}
                          >
                            <Text style={styles.actionButtonText}>Cancel Event</Text>
                          </Pressable>
                          <Pressable
                            accessibilityRole="button"
                            onPress={() => handleDeleteEvent(event.id)}
                            style={({ pressed }) => [styles.dangerButton, pressed && styles.buttonPressed]}
                          >
                            <Text style={styles.dangerButtonText}>Delete Event</Text>
                          </Pressable>
                        </View>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            </>
          )}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scroll: {
    backgroundColor: 'transparent',
    flex: 1,
  },
  content: {
    flexGrow: 1,
  },
  heroBottom: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'space-between',
  },
  heroBackButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderColor: 'rgba(255,255,255,0.24)',
    borderRadius: radius.full,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.xxs,
    minHeight: 40,
    paddingHorizontal: spacing.md,
  },
  heroBackText: {
    ...typography.caption3,
    color: colors.textLight,
  },
  heroStats: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  heroStatCard: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderColor: 'rgba(255,255,255,0.24)',
    borderRadius: radius.lg,
    borderWidth: 1,
    minWidth: 72,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  heroStatValue: {
    ...typography.button1,
    color: colors.textLight,
  },
  heroStatLabel: {
    ...typography.caption4,
    color: '#CBD5E1',
    textTransform: 'uppercase',
  },
  body: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    flex: 1,
    gap: spacing.lg,
    marginTop: -12,
    minHeight: 540,
    paddingBottom: spacing.xxl,
    paddingHorizontal: layout.screenPaddingH,
    paddingTop: spacing.xl,
  },
  restrictedWrap: {
    gap: spacing.md,
  },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: radius.full,
    justifyContent: 'center',
    minHeight: 46,
  },
  primaryButtonText: {
    ...typography.button1,
    color: colors.textLight,
  },
  buttonPressed: {
    opacity: 0.85,
  },
  stateWrap: {
    paddingTop: spacing.xs,
  },
  sectionSurface: {
    backgroundColor: '#F8FAFF',
    borderColor: '#DBEAFE',
    borderRadius: radius.xl,
    borderWidth: 1,
    gap: spacing.md,
    padding: spacing.md,
  },
  filterSection: {
    gap: spacing.sm,
  },
  searchInput: {
    ...typography.body2,
    backgroundColor: colors.white,
    borderColor: '#BFDBFE',
    borderRadius: radius.md,
    borderWidth: 1,
    color: colors.text,
    minHeight: 46,
    paddingHorizontal: spacing.md,
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  filterPill: {
    alignItems: 'center',
    backgroundColor: colors.white,
    borderColor: '#BFDBFE',
    borderRadius: radius.full,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 30,
    paddingHorizontal: spacing.sm,
  },
  filterPillActive: {
    backgroundColor: '#DBEAFE',
    borderColor: '#93C5FD',
  },
  filterPillText: {
    ...typography.caption4,
    color: '#334155',
  },
  filterPillTextActive: {
    color: '#1D4ED8',
  },
  cardList: {
    gap: spacing.sm,
  },
  userCard: {
    backgroundColor: colors.white,
    borderColor: '#D7E3F4',
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: spacing.xs,
    padding: spacing.md,
  },
  userHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.xs,
    justifyContent: 'space-between',
  },
  userName: {
    ...typography.button1,
    color: colors.text,
    flex: 1,
  },
  roleBadge: {
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  roleAdmin: {
    backgroundColor: 'rgba(59,130,246,0.12)',
  },
  roleUser: {
    backgroundColor: 'rgba(34,197,94,0.12)',
  },
  roleBadgeText: {
    ...typography.caption4,
    color: '#0F172A',
  },
  userEmail: {
    ...typography.body2,
    color: '#334155',
  },
  userMeta: {
    ...typography.caption2,
    color: colors.textMuted,
  },
  actionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  actionButton: {
    alignItems: 'center',
    backgroundColor: colors.white,
    borderColor: '#BFDBFE',
    borderRadius: radius.md,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 36,
    paddingHorizontal: spacing.sm,
  },
  actionButtonText: {
    ...typography.caption3,
    color: colors.primary,
  },
  dangerButton: {
    alignItems: 'center',
    backgroundColor: colors.white,
    borderColor: '#FECACA',
    borderRadius: radius.md,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 36,
    paddingHorizontal: spacing.sm,
  },
  dangerButtonText: {
    ...typography.caption3,
    color: colors.error,
  },
  disabledButton: {
    opacity: 0.45,
  },
  eventCard: {
    backgroundColor: colors.white,
    borderColor: '#D7E3F4',
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: spacing.xs,
    padding: spacing.md,
  },
  eventTitle: {
    ...typography.button1,
    color: colors.text,
  },
  eventMeta: {
    ...typography.body2,
    color: '#334155',
  },
});
