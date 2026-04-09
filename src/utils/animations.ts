// PokerZone - Animation Utilities
// Reusable animated components and helpers for the poker game

import React from 'react';
import { ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withDelay,
  withSequence,
  withRepeat,
  Easing,
  FadeIn,
  FadeOut,
  SlideInDown,
  SlideInUp,
  SlideOutDown,
  ZoomIn,
  ZoomOut,
  FadeInUp,
  FadeInDown,
  FlipInXUp,
  BounceIn,
} from 'react-native-reanimated';

// Re-export commonly used entering/exiting animations with poker-appropriate timing
export const CardDealAnimation = FadeInUp.duration(300).springify().damping(15);
export const CardFlipAnimation = FlipInXUp.duration(400);
export const ChipSlideAnimation = SlideInDown.duration(250).springify();
export const PotWinAnimation = BounceIn.duration(500);
export const FadeInQuick = FadeIn.duration(200);
export const FadeOutQuick = FadeOut.duration(150);
export const ActionBadgeEnter = ZoomIn.duration(200).springify();
export const ActionBadgeExit = ZoomOut.duration(150);
export const WinnerGlowAnimation = FadeIn.duration(300);
export const SlideUpPanel = SlideInDown.duration(300).springify().damping(18);
export const MessageSlideIn = FadeInDown.duration(200);

// Hook: Pulsing glow effect for active player
export function usePulseAnimation() {
  const opacity = useSharedValue(1);

  const startPulse = () => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(0.5, { duration: 800, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 800, easing: Easing.inOut(Easing.ease) })
      ),
      -1, // infinite
      true
    );
  };

  const stopPulse = () => {
    opacity.value = withTiming(1, { duration: 200 });
  };

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return { animatedStyle, startPulse, stopPulse };
}

// Hook: Chip count change animation (scale up briefly on change)
export function useChipCountAnimation() {
  const scale = useSharedValue(1);

  const triggerBounce = () => {
    scale.value = withSequence(
      withSpring(1.3, { damping: 8, stiffness: 200 }),
      withSpring(1, { damping: 12, stiffness: 150 })
    );
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return { animatedStyle, triggerBounce };
}

// Hook: Timer bar countdown
export function useTimerAnimation(durationMs: number) {
  const width = useSharedValue(100);

  const startTimer = () => {
    width.value = 100;
    width.value = withTiming(0, {
      duration: durationMs,
      easing: Easing.linear,
    });
  };

  const resetTimer = () => {
    width.value = withTiming(100, { duration: 200 });
  };

  const animatedStyle = useAnimatedStyle(() => ({
    width: `${width.value}%`,
  }));

  return { animatedStyle, startTimer, resetTimer };
}

// Hook: Win celebration shimmer
export function useWinCelebration() {
  const translateX = useSharedValue(-200);

  const startShimmer = () => {
    translateX.value = withRepeat(
      withTiming(400, { duration: 1500, easing: Easing.linear }),
      3,
      false
    );
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return { animatedStyle, startShimmer };
}
