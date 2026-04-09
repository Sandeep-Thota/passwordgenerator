// Table theme definitions for felt color and card back design

export interface TableTheme {
  id: string;
  name: string;
  feltColor: string;
  feltColorLight: string;
  feltColorDark: string;
  feltBorder: string;
  cardBack: string;
  cardBackAccent: string;
  cardBackLogo: string;
}

export const TABLE_THEMES: TableTheme[] = [
  {
    id: 'classic-green',
    name: 'Classic Green',
    feltColor: '#0D5C2E',
    feltColorLight: '#1A7A42',
    feltColorDark: '#0A4A24',
    feltBorder: '#2A8A52',
    cardBack: '#1E40AF',
    cardBackAccent: '#3B82F6',
    cardBackLogo: '#60A5FA',
  },
  {
    id: 'royal-blue',
    name: 'Royal Blue',
    feltColor: '#1E3A5F',
    feltColorLight: '#2A5080',
    feltColorDark: '#152D4A',
    feltBorder: '#3B6EA0',
    cardBack: '#7C2D12',
    cardBackAccent: '#B45309',
    cardBackLogo: '#F59E0B',
  },
  {
    id: 'midnight-purple',
    name: 'Midnight Purple',
    feltColor: '#3B1F5E',
    feltColorLight: '#5B2D8E',
    feltColorDark: '#2D1748',
    feltBorder: '#7C3AED',
    cardBack: '#1E293B',
    cardBackAccent: '#475569',
    cardBackLogo: '#94A3B8',
  },
  {
    id: 'crimson-red',
    name: 'Crimson Red',
    feltColor: '#5C1A1A',
    feltColorLight: '#7A2A2A',
    feltColorDark: '#4A1414',
    feltBorder: '#DC2626',
    cardBack: '#1E3A5F',
    cardBackAccent: '#2563EB',
    cardBackLogo: '#60A5FA',
  },
  {
    id: 'dark-noir',
    name: 'Dark Noir',
    feltColor: '#1A1A2E',
    feltColorLight: '#252540',
    feltColorDark: '#111122',
    feltBorder: '#4A4A6A',
    cardBack: '#D4AF37',
    cardBackAccent: '#B8960C',
    cardBackLogo: '#F0D060',
  },
  {
    id: 'emerald',
    name: 'Emerald',
    feltColor: '#065F46',
    feltColorLight: '#059669',
    feltColorDark: '#064E3B',
    feltBorder: '#34D399',
    cardBack: '#312E81',
    cardBackAccent: '#4338CA',
    cardBackLogo: '#818CF8',
  },
];

export function getTableTheme(id: string): TableTheme {
  return TABLE_THEMES.find(t => t.id === id) || TABLE_THEMES[0];
}
