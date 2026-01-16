'use client';

import { getAvatarUrl, AVATAR_SIZES, type AvatarSize, type DiceBearStyle } from '@/lib/avatars';

interface PlayerAvatarProps {
  playerId: string;
  size?: AvatarSize;
  style?: DiceBearStyle;
  className?: string;
}

/**
 * Displays a deterministic DiceBear avatar for a player.
 * Same player ID always produces the same avatar.
 * Style can be customized per-room for visual variety.
 */
export function PlayerAvatar({
  playerId,
  size = 'md',
  style = 'adventurer',
  className = '',
}: PlayerAvatarProps) {
  const pixelSize = AVATAR_SIZES[size];

  return (
    <img
      src={getAvatarUrl(playerId, pixelSize, style)}
      alt="Player avatar"
      className={`rounded-full flex-shrink-0 ${className}`}
      width={pixelSize}
      height={pixelSize}
      loading="lazy"
    />
  );
}
