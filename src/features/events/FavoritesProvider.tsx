import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { useAppSession } from '../../providers/AppSessionProvider';
import { addFavoriteEvent, fetchMyFavoriteEventIds, removeFavoriteEvent } from './api';

type FavoritesContextValue = {
  isLoading: boolean;
  favoriteIds: string[];
  isFavorited: (eventId: string) => boolean;
  refreshFavorites: () => Promise<void>;
  toggleFavorite: (eventId: string) => Promise<void>;
};

type FavoritesProviderProps = {
  children: React.ReactNode;
};

const FavoritesContext = createContext<FavoritesContextValue | undefined>(undefined);

function hasDuplicateConstraintError(error: unknown) {
  if (!error || typeof error !== 'object') {
    return false;
  }

  return 'code' in error && error.code === '23505';
}

export function FavoritesProvider({ children }: FavoritesProviderProps) {
  const { isGuest, profile } = useAppSession();
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const refreshFavorites = useCallback(async () => {
    if (isGuest || !profile?.id) {
      setFavoriteIds([]);
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await fetchMyFavoriteEventIds(profile.id);
      if (error) {
        throw error;
      }
      setFavoriteIds(data);
    } finally {
      setIsLoading(false);
    }
  }, [isGuest, profile?.id]);

  useEffect(() => {
    void refreshFavorites();
  }, [refreshFavorites]);

  const favoriteIdSet = useMemo(() => new Set(favoriteIds), [favoriteIds]);

  const toggleFavorite = useCallback(
    async (eventId: string) => {
      if (isGuest || !profile?.id) {
        throw new Error('Sign in to save events.');
      }

      const wasFavorited = favoriteIdSet.has(eventId);
      const previous = favoriteIds;

      setFavoriteIds((current) => {
        if (wasFavorited) {
          return current.filter((id) => id !== eventId);
        }

        if (current.includes(eventId)) {
          return current;
        }

        return [eventId, ...current];
      });

      try {
        if (wasFavorited) {
          const { error } = await removeFavoriteEvent(profile.id, eventId);
          if (error) {
            throw error;
          }
          return;
        }

        const { error } = await addFavoriteEvent(profile.id, eventId);
        if (error && !hasDuplicateConstraintError(error)) {
          throw error;
        }
      } catch (error) {
        setFavoriteIds(previous);
        throw error;
      }
    },
    [favoriteIdSet, favoriteIds, isGuest, profile?.id],
  );

  const value = useMemo<FavoritesContextValue>(
    () => ({
      isLoading,
      favoriteIds,
      isFavorited: (eventId: string) => favoriteIdSet.has(eventId),
      refreshFavorites,
      toggleFavorite,
    }),
    [favoriteIdSet, favoriteIds, isLoading, refreshFavorites, toggleFavorite],
  );

  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>;
}

export function useEventFavorites() {
  const context = useContext(FavoritesContext);

  if (!context) {
    throw new Error('useEventFavorites must be used inside FavoritesProvider');
  }

  return context;
}
