// ==========================================
// PokerZone - Utility Functions
// ==========================================

export function formatChips(amount: number): string {
  if (amount >= 1000000) {
    return `${(amount / 1000000).toFixed(1)}M`;
  }
  if (amount >= 10000) {
    return `${(amount / 1000).toFixed(1)}K`;
  }
  if (amount >= 1000) {
    return `${(amount / 1000).toFixed(1)}K`;
  }
  return amount.toLocaleString();
}

export function formatBlinds(small: number, big: number): string {
  return `${formatChips(small)}/${formatChips(big)}`;
}

export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function formatTimeAgo(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return 'just now';
}

export function getAvatarInitials(name: string): string {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function generateGuestName(): string {
  const adjectives = [
    'Lucky', 'Bold', 'Swift', 'Clever', 'Sharp',
    'Wild', 'Cool', 'Mystic', 'Royal', 'Blazing',
    'Silent', 'Neon', 'Thunder', 'Shadow', 'Golden',
  ];
  const nouns = [
    'Ace', 'King', 'Queen', 'Jack', 'Dealer',
    'Shark', 'Wolf', 'Fox', 'Eagle', 'Tiger',
    'Bluffer', 'River', 'Flush', 'Chip', 'Stack',
  ];
  const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  const num = Math.floor(Math.random() * 100);
  return `${adj}${noun}${num}`;
}

export function generateRoomName(): string {
  const themes = [
    'Diamond Lounge', 'Royal Suite', 'High Roller', 'The Felt',
    'Ace Room', 'Gold Table', 'VIP Pit', 'River Room',
    'Spade Club', 'Heart Lounge', 'Club House', 'The Stakes',
  ];
  return themes[Math.floor(Math.random() * themes.length)];
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}
