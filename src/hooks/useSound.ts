// ==========================================
// PokerZone - Sound Effects Hook
// ==========================================
// Manages all game sound effects using expo-av

import { useCallback, useRef, useEffect } from 'react';
import { Audio } from 'expo-av';
import { useAuthStore } from '../store/authStore';

// Sound effect types
export type SoundEffect =
  | 'card-deal'
  | 'card-flip'
  | 'chip-bet'
  | 'chip-win'
  | 'check'
  | 'fold'
  | 'all-in'
  | 'timer-warning'
  | 'your-turn'
  | 'message'
  | 'join'
  | 'leave';

// Frequencies for generated tones (we generate sounds programmatically
// since we don't have audio files - this provides immediate feedback)
const SOUND_CONFIG: Record<SoundEffect, { frequency: number; duration: number; type: 'beep' }> = {
  'card-deal':     { frequency: 800,  duration: 80,  type: 'beep' },
  'card-flip':     { frequency: 600,  duration: 120, type: 'beep' },
  'chip-bet':      { frequency: 1000, duration: 60,  type: 'beep' },
  'chip-win':      { frequency: 1200, duration: 200, type: 'beep' },
  'check':         { frequency: 500,  duration: 100, type: 'beep' },
  'fold':          { frequency: 300,  duration: 150, type: 'beep' },
  'all-in':        { frequency: 1500, duration: 300, type: 'beep' },
  'timer-warning': { frequency: 900,  duration: 250, type: 'beep' },
  'your-turn':     { frequency: 700,  duration: 200, type: 'beep' },
  'message':       { frequency: 400,  duration: 80,  type: 'beep' },
  'join':          { frequency: 600,  duration: 150, type: 'beep' },
  'leave':         { frequency: 350,  duration: 150, type: 'beep' },
};

export function useSound() {
  const soundEnabled = useAuthStore(state => state.soundEnabled);
  const soundRef = useRef<Audio.Sound | null>(null);

  useEffect(() => {
    // Configure audio session
    Audio.setAudioModeAsync({
      playsInSilentModeIOS: false,
      staysActiveInBackground: false,
      shouldDuckAndroid: true,
    }).catch(() => {
      // Audio not available (e.g., web without user gesture)
    });

    return () => {
      if (soundRef.current) {
        soundRef.current.unloadAsync().catch(() => {});
      }
    };
  }, []);

  const playSound = useCallback(async (effect: SoundEffect) => {
    if (!soundEnabled) return;

    try {
      // For web and basic sound feedback, we use the Web Audio API when available
      if (typeof window !== 'undefined' && window.AudioContext) {
        const config = SOUND_CONFIG[effect];
        const audioCtx = new AudioContext();
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);

        oscillator.frequency.value = config.frequency;
        oscillator.type = 'sine';

        gainNode.gain.setValueAtTime(0.15, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(
          0.001,
          audioCtx.currentTime + config.duration / 1000
        );

        oscillator.start(audioCtx.currentTime);
        oscillator.stop(audioCtx.currentTime + config.duration / 1000);

        // Clean up after sound finishes
        setTimeout(() => {
          audioCtx.close().catch(() => {});
        }, config.duration + 100);
      }
    } catch {
      // Sound playback failed - non-critical, silently ignore
    }
  }, [soundEnabled]);

  return { playSound };
}
