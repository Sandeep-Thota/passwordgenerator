// ==========================================
// PokerZone - Keyboard Shortcuts for Web
// ==========================================
// Provides keyboard shortcuts for common poker actions on web

import { useEffect, useCallback } from 'react';
import { Platform } from 'react-native';
import { PlayerAction } from '../engine/types';

interface KeyboardShortcutOptions {
  validActions: PlayerAction[];
  onAction: (action: PlayerAction, amount?: number) => void;
  minBet: number;
  maxBet: number;
  enabled?: boolean;
}

export function useKeyboardShortcuts({
  validActions,
  onAction,
  minBet,
  maxBet,
  enabled = true,
}: KeyboardShortcutOptions) {
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // Don't trigger if typing in an input
    const target = event.target as HTMLElement;
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
      return;
    }

    if (!enabled || validActions.length === 0) return;

    switch (event.key.toLowerCase()) {
      case 'f':
        if (validActions.includes('fold')) {
          event.preventDefault();
          onAction('fold');
        }
        break;

      case 'c':
        // C = Call if available, otherwise Check
        if (validActions.includes('call')) {
          event.preventDefault();
          onAction('call');
        } else if (validActions.includes('check')) {
          event.preventDefault();
          onAction('check');
        }
        break;

      case 'r':
        if (validActions.includes('raise')) {
          event.preventDefault();
          onAction('raise', minBet);
        }
        break;

      case 'a':
        if (validActions.includes('all-in')) {
          event.preventDefault();
          onAction('all-in');
        }
        break;

      case 'x':
        // X = Check (alternative)
        if (validActions.includes('check')) {
          event.preventDefault();
          onAction('check');
        }
        break;

      case 'escape':
        // Could be used to dismiss raise panel - handled by component
        break;
    }
  }, [validActions, onAction, minBet, maxBet, enabled]);

  useEffect(() => {
    if (Platform.OS !== 'web') return;

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);
}
