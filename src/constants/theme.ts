// ==========================================
// PokerZone - Theme & Design System
// ==========================================

export const Colors = {
  // Primary palette - rich dark with gold accents
  primary: '#D4AF37',       // Gold
  primaryLight: '#F0D060',
  primaryDark: '#B8960C',

  // Background layers
  bgDarkest: '#060A13',     // Deepest background
  bgDark: '#0A0E1A',        // Main background
  bgMedium: '#111827',      // Card/panel background
  bgLight: '#1E293B',       // Elevated surfaces
  bgLighter: '#2D3A4F',     // Hover states

  // Table felt
  feltGreen: '#0D5C2E',
  feltGreenLight: '#1A7A42',
  feltGreenDark: '#0A4A24',
  feltBorder: '#2A8A52',

  // Suits
  suitRed: '#EF4444',       // Hearts & Diamonds
  suitBlack: '#1E293B',     // Clubs & Spades
  suitRedLight: '#FCA5A5',
  suitBlackLight: '#64748B',

  // Text
  textPrimary: '#F1F5F9',
  textSecondary: '#94A3B8',
  textMuted: '#64748B',
  textGold: '#D4AF37',

  // Actions
  success: '#22C55E',
  successDark: '#16A34A',
  danger: '#EF4444',
  dangerDark: '#DC2626',
  warning: '#F59E0B',
  warningDark: '#D97706',
  info: '#3B82F6',
  infoDark: '#2563EB',

  // Chip colors
  chipWhite: '#F8FAFC',
  chipRed: '#EF4444',
  chipBlue: '#3B82F6',
  chipGreen: '#22C55E',
  chipBlack: '#1E293B',
  chipPurple: '#A855F7',
  chipOrange: '#F97316',
  chipYellow: '#EAB308',

  // Card
  cardWhite: '#FFFFFF',
  cardBack: '#1E40AF',
  cardBackPattern: '#1E3A8A',
  cardShadow: 'rgba(0, 0, 0, 0.4)',

  // Overlay
  overlay: 'rgba(0, 0, 0, 0.7)',
  overlayLight: 'rgba(0, 0, 0, 0.4)',

  // Borders
  border: '#1E293B',
  borderLight: '#334155',
  borderGold: 'rgba(212, 175, 55, 0.3)',

  // Status
  online: '#22C55E',
  offline: '#64748B',
  away: '#F59E0B',
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 48,
};

export const BorderRadius = {
  sm: 6,
  md: 10,
  lg: 14,
  xl: 20,
  round: 9999,
};

export const FontSize = {
  xs: 10,
  sm: 12,
  md: 14,
  lg: 16,
  xl: 18,
  xxl: 22,
  xxxl: 28,
  huge: 36,
  display: 48,
};

export const FontFamily = {
  regular: 'System',
  medium: 'System',
  bold: 'System',
  mono: 'monospace',
};

export const Shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  gold: {
    shadowColor: '#D4AF37',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
  },
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 5,
  },
};

export const AVATARS = [
  'wolf', 'eagle', 'shark', 'lion', 'fox',
  'bear', 'hawk', 'panther', 'tiger', 'dragon',
  'phoenix', 'cobra', 'stallion', 'falcon', 'viper',
  'rhino', 'bull', 'ace', 'king', 'joker',
];

export const AVATAR_COLORS: Record<string, string> = {
  wolf: '#6366F1',
  eagle: '#D97706',
  shark: '#0EA5E9',
  lion: '#EAB308',
  fox: '#F97316',
  bear: '#78716C',
  hawk: '#8B5CF6',
  panther: '#1E293B',
  tiger: '#F59E0B',
  dragon: '#DC2626',
  phoenix: '#EF4444',
  cobra: '#22C55E',
  stallion: '#92400E',
  falcon: '#7C3AED',
  viper: '#059669',
  rhino: '#6B7280',
  bull: '#991B1B',
  ace: '#D4AF37',
  king: '#7C2D12',
  joker: '#DB2777',
};

export const EMOJI_REACTIONS = [
  '👍', '👎', '😂', '😱', '🔥', '💰',
  '🎯', '🃏', '♠️', '♥️', '♦️', '♣️',
  '😎', '🤔', '😤', '🎉', '💪', '🙈',
];
