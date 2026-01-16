// Room and Player types for Taboo

import type { GameSettings, GameState } from './game';

export type Team = 'A' | 'B';

export type RoomStatus = 'lobby' | 'playing' | 'finished';

export interface Player {
  id: string;
  name: string;
  team: Team | null;
  isHost: boolean;
  isConnected: boolean;
  lastSeen: number;
}

export interface Room {
  code: string;
  hostId: string;
  status: RoomStatus;
  players: Record<string, Player>; // Using Record for JSON serialization
  teams: {
    A: string[]; // Player IDs on Team A
    B: string[]; // Player IDs on Team B
  };
  settings: GameSettings;
  createdAt: number;
}

export interface RoomState {
  room: Room;
  game: GameState | null;
}

// For client-side state
export interface ClientRoomState {
  room: Room;
  game: GameState | null;
  currentPlayerId: string | null;
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'reconnecting';
}
