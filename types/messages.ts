// WebSocket message types for Taboo

import type { GameState, TabooCard, TurnResult, TurnState } from './game';
import type { Player, Room, Team } from './room';

// ============ Client -> Server Messages ============

export type ClientMessage =
  | { type: 'JOIN_ROOM'; payload: { playerName: string; playerId?: string } }
  | { type: 'SELECT_TEAM'; payload: { team: Team } }
  | { type: 'LEAVE_TEAM' }
  | { type: 'START_GAME' }
  | { type: 'START_TURN' }
  | { type: 'CARD_CORRECT' }
  | { type: 'CARD_SKIP' }
  | { type: 'BUZZ' }
  | { type: 'DISMISS_BUZZ' }
  | { type: 'END_TURN' }
  | { type: 'RESTART_GAME' }
  | { type: 'PING' };

// ============ Server -> Client Messages ============

export type ServerMessage =
  | { type: 'ROOM_STATE'; payload: { room: Room; game: GameState | null; playerId: string } }
  | { type: 'PLAYER_JOINED'; payload: { player: Player } }
  | { type: 'PLAYER_LEFT'; payload: { playerId: string } }
  | { type: 'PLAYER_RECONNECTED'; payload: { playerId: string } }
  | { type: 'PLAYER_REMOVED'; payload: { playerId: string; reason: 'disconnect_timeout' | 'kicked' } }
  | { type: 'HOST_CHANGED'; payload: { newHostId: string } }
  | { type: 'TEAM_UPDATED'; payload: { playerId: string; team: Team | null } }
  | { type: 'GAME_STARTED'; payload: { game: GameState } }
  | { type: 'TURN_STARTED'; payload: { turn: TurnState; card: TabooCard | null } }
  | { type: 'CARD_CHANGED'; payload: { card: TabooCard | null; turnScore: number } }
  | { type: 'TIMER_SYNC'; payload: { serverTime: number; deadline: number } }
  | { type: 'BUZZER_PRESSED'; payload: { buzzedBy: string; buzzerName: string } }
  | { type: 'BUZZ_DISMISSED' }
  | { type: 'SCORE_UPDATED'; payload: { scores: { A: number; B: number }; turnScore: number } }
  | { type: 'TURN_ENDED'; payload: { result: TurnResult; nextTurn: TurnState | null } }
  | { type: 'GAME_OVER'; payload: { winner: Team | 'tie'; finalScores: { A: number; B: number }; reason?: 'completed' | 'team_forfeit' } }
  | { type: 'RETURNED_TO_LOBBY'; payload: { room: Room } }
  | { type: 'ERROR'; payload: { message: string; code?: string } }
  | { type: 'PONG'; payload: { serverTime: number } };

// Helper type to extract payload from a message type
export type MessagePayload<T extends ServerMessage['type']> = Extract<
  ServerMessage,
  { type: T }
> extends { payload: infer P }
  ? P
  : never;
