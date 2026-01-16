const DICEBEAR_BASE_URL = 'https://api.dicebear.com/7.x';

/**
 * Available DiceBear avatar styles.
 * Different rooms will use different styles for visual variety.
 */
export const DICEBEAR_STYLES = [
  'adventurer',
  'avataaars',
  'bottts',
  'fun-emoji',
  'lorelei',
  'thumbs',
  'big-ears',
  'big-smile',
  'micah',
] as const;

export type DiceBearStyle = (typeof DICEBEAR_STYLES)[number];

/**
 * Derive a DiceBear style deterministically from a seed (e.g., room code).
 * All players in the same room will see the same style.
 */
export function getStyleFromSeed(seed: string): DiceBearStyle {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = ((hash << 5) - hash) + seed.charCodeAt(i);
    hash = hash & hash; // Convert to 32-bit integer
  }
  return DICEBEAR_STYLES[Math.abs(hash) % DICEBEAR_STYLES.length];
}

/**
 * Generate a DiceBear avatar URL for a player.
 * Same seed always produces the same avatar (deterministic).
 */
export function getAvatarUrl(
  seed: string,
  size: number = 64,
  style: DiceBearStyle = 'adventurer'
): string {
  return `${DICEBEAR_BASE_URL}/${style}/svg?seed=${encodeURIComponent(seed)}&size=${size}`;
}

/**
 * Avatar size presets (in pixels)
 */
export const AVATAR_SIZES = {
  sm: 24,
  md: 32,
  lg: 48,
} as const;

export type AvatarSize = keyof typeof AVATAR_SIZES;
