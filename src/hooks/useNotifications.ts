// ==========================================
// PokerZone - Push Notifications Hook
// ==========================================
// Handles local notifications for game events (your turn, etc.)

import { useEffect, useRef, useCallback } from 'react';
import { Platform, AppState, AppStateStatus } from 'react-native';
import { useAuthStore } from '../store/authStore';

// We use a simple notification approach that works across platforms:
// - Web: Notification API
// - Mobile: expo-notifications (loaded dynamically)

let Notifications: any = null;

async function loadNotifications() {
  if (Platform.OS !== 'web') {
    try {
      Notifications = require('expo-notifications');
    } catch {
      // expo-notifications not available
    }
  }
}

export function useNotifications() {
  const appState = useRef<AppStateStatus>(AppState.currentState);
  const isBackground = useRef(false);
  const soundEnabled = useAuthStore(state => state.soundEnabled);

  useEffect(() => {
    loadNotifications();

    // Request permissions on mobile
    if (Platform.OS !== 'web' && Notifications) {
      Notifications.requestPermissionsAsync?.().catch(() => {});
      Notifications.setNotificationHandler?.({
        handleNotification: async () => ({
          shouldShowAlert: true,
          shouldPlaySound: soundEnabled,
          shouldSetBadge: false,
        }),
      });
    }

    // Request web notification permission
    if (Platform.OS === 'web' && typeof Notification !== 'undefined' && Notification.permission === 'default') {
      Notification.requestPermission().catch(() => {});
    }

    // Track app state for background detection
    const subscription = AppState.addEventListener('change', (nextState: AppStateStatus) => {
      isBackground.current = nextState !== 'active';
      appState.current = nextState;
    });

    return () => {
      subscription.remove();
    };
  }, []);

  const sendLocalNotification = useCallback(async (title: string, body: string) => {
    // Only send when app is backgrounded
    if (!isBackground.current) return;

    if (Platform.OS === 'web') {
      // Web Notification API
      if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
        try {
          new Notification(title, {
            body,
            icon: '/favicon.ico',
            tag: 'pokerzone-turn', // Replace previous notification
          });
        } catch {
          // Notifications not supported
        }
      }
    } else if (Notifications) {
      // Expo notifications for mobile
      try {
        await Notifications.scheduleNotificationAsync({
          content: {
            title,
            body,
            sound: soundEnabled,
          },
          trigger: null, // Fire immediately
        });
      } catch {
        // Notification failed
      }
    }
  }, [soundEnabled]);

  const notifyYourTurn = useCallback(() => {
    sendLocalNotification(
      "It's your turn!",
      "Your poker hand is waiting. Come back and make your move!"
    );
  }, [sendLocalNotification]);

  const notifyGameStarted = useCallback(() => {
    sendLocalNotification(
      "Game Started",
      "A new hand has been dealt. Join the action!"
    );
  }, [sendLocalNotification]);

  const notifyWin = useCallback((amount: string) => {
    sendLocalNotification(
      "You won!",
      `Congratulations! You won ${amount} chips!`
    );
  }, [sendLocalNotification]);

  return {
    notifyYourTurn,
    notifyGameStarted,
    notifyWin,
    sendLocalNotification,
  };
}
