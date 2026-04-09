// ==========================================
// PokerZone - Haptic Feedback Hook
// ==========================================

import { useCallback } from 'react';
import { Platform } from 'react-native';
import { useAuthStore } from '../store/authStore';

// Haptic feedback types
export type HapticType = 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error';

export function useHaptics() {
  const hapticEnabled = useAuthStore(state => state.hapticEnabled);

  const trigger = useCallback(async (type: HapticType = 'light') => {
    if (!hapticEnabled) return;
    if (Platform.OS === 'web') return;

    try {
      const Haptics = require('expo-haptics');

      switch (type) {
        case 'light':
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          break;
        case 'medium':
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          break;
        case 'heavy':
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
          break;
        case 'success':
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          break;
        case 'warning':
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          break;
        case 'error':
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          break;
      }
    } catch {
      // Haptics not available
    }
  }, [hapticEnabled]);

  return { trigger };
}
