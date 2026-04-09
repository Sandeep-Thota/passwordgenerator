// ==========================================
// PokerZone - Avatar Component
// ==========================================

import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Colors, BorderRadius, Shadows } from '../../constants/theme';
import { AVATAR_COLORS } from '../../constants/theme';
import { getAvatarInitials } from '../../utils/formatters';

interface AvatarProps {
  name: string;
  avatar?: string;
  size?: number;
  isOnline?: boolean;
  isDealer?: boolean;
  isTurn?: boolean;
  style?: ViewStyle;
}

export function Avatar({
  name,
  avatar,
  size = 48,
  isOnline,
  isDealer,
  isTurn,
  style,
}: AvatarProps) {
  const bgColor = avatar ? (AVATAR_COLORS[avatar] || Colors.bgLight) : Colors.bgLight;
  const initials = getAvatarInitials(name);

  return (
    <View style={[
      styles.container,
      {
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: bgColor,
      },
      isTurn && styles.turnGlow,
      style,
    ]}>
      <Text style={[styles.initials, { fontSize: size * 0.38 }]}>
        {initials}
      </Text>
      {isOnline !== undefined && (
        <View style={[
          styles.statusDot,
          {
            backgroundColor: isOnline ? Colors.online : Colors.offline,
            width: size * 0.25,
            height: size * 0.25,
            borderRadius: size * 0.125,
          },
        ]} />
      )}
      {isDealer && (
        <View style={[styles.dealerBadge, { width: size * 0.38, height: size * 0.38 }]}>
          <Text style={[styles.dealerText, { fontSize: size * 0.2 }]}>D</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.md,
  },
  initials: {
    color: '#FFFFFF',
    fontWeight: '800',
    letterSpacing: 1,
  },
  statusDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    borderWidth: 2,
    borderColor: Colors.bgDark,
  },
  turnGlow: {
    borderWidth: 2,
    borderColor: Colors.primary,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 8,
    elevation: 8,
  },
  dealerBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.round,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.bgDark,
  },
  dealerText: {
    color: Colors.bgDarkest,
    fontWeight: '900',
  },
});
