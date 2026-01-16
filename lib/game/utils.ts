// Game utility functions

import type { Player, Room, Team } from '@/types';

/**
 * Shuffle an array using Fisher-Yates algorithm
 */
export function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Get players on a specific team
 */
export function getTeamPlayers(room: Room, team: Team): Player[] {
  return room.teams[team]
    .map((id) => room.players[id])
    .filter((p): p is Player => p !== undefined);
}

/**
 * Get the next clue giver for a team (round-robin)
 */
export function getNextClueGiver(
  room: Room,
  team: Team,
  currentClueGiverId?: string
): string | null {
  const teamPlayers = room.teams[team];
  if (teamPlayers.length === 0) return null;

  if (!currentClueGiverId) {
    return teamPlayers[0];
  }

  const currentIndex = teamPlayers.indexOf(currentClueGiverId);
  if (currentIndex === -1) {
    return teamPlayers[0];
  }

  const nextIndex = (currentIndex + 1) % teamPlayers.length;
  return teamPlayers[nextIndex];
}

/**
 * Check if game can start (valid teams)
 */
export function canStartGame(room: Room): { canStart: boolean; reason?: string } {
  if (room.teams.A.length === 0) {
    return { canStart: false, reason: 'Team Blue needs at least one player' };
  }
  if (room.teams.B.length === 0) {
    return { canStart: false, reason: 'Team Red needs at least one player' };
  }

  // Check for connected players
  const connectedA = room.teams.A.filter((id) => room.players[id]?.isConnected).length;
  const connectedB = room.teams.B.filter((id) => room.players[id]?.isConnected).length;

  if (connectedA === 0) {
    return { canStart: false, reason: 'Team Blue has no connected players' };
  }
  if (connectedB === 0) {
    return { canStart: false, reason: 'Team Red has no connected players' };
  }

  return { canStart: true };
}

/**
 * Format time remaining as MM:SS
 */
export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Calculate time remaining from deadline
 */
export function calculateTimeRemaining(deadline: number, serverTime: number): number {
  const clientOffset = Date.now() - serverTime;
  const adjustedNow = Date.now() - clientOffset;
  return Math.max(0, Math.ceil((deadline - adjustedNow) / 1000));
}

/**
 * Get opposite team
 */
export function getOppositeTeam(team: Team): Team {
  return team === 'A' ? 'B' : 'A';
}

/**
 * Check if player is the clue giver for current turn
 */
export function isClueGiver(playerId: string, clueGiverId: string): boolean {
  return playerId === clueGiverId;
}

/**
 * Check if player is on the guessing team
 */
export function isGuesser(
  playerId: string,
  room: Room,
  activeTeam: Team,
  clueGiverId: string
): boolean {
  if (playerId === clueGiverId) return false;
  const player = room.players[playerId];
  return player?.team === activeTeam;
}

/**
 * Check if player is on the opposing team (can buzz)
 */
export function isOpponent(playerId: string, room: Room, activeTeam: Team): boolean {
  const player = room.players[playerId];
  return player?.team !== null && player.team !== activeTeam;
}
