// Game-related types for Taboo

export interface TabooCard {
  id: number;
  targetWord: string;
  tabooWords: string[]; // 5 forbidden words
  category?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
}

export interface GameState {
  currentRound: number;
  totalRounds: number;
  currentTurn: TurnState;
  scores: {
    A: number;
    B: number;
  };
  // Track clue giver rotation index per team
  clueGiverIndex: {
    A: number;
    B: number;
  };
  turnHistory: TurnResult[];
  cardDeck: number[]; // Shuffled indices of remaining cards
  usedCards: number[]; // Indices of cards already played
}

export interface TurnState {
  activeTeam: 'A' | 'B';
  clueGiverId: string;
  currentCardIndex: number;
  turnScore: number;
  skipsUsed: number;
  timerStartedAt: number; // Server timestamp when timer started
  timerDuration: number; // Duration in milliseconds
  isPaused: boolean;
  status: TurnStatus;
  timerPausedAt: number; // 0 if not paused, timestamp if paused during buzz
  remainingTimeWhenPaused: number; // ms remaining when paused
}

export type TurnStatus = 'waiting' | 'active' | 'buzzing' | 'ended';

export interface TurnResult {
  round: number;
  team: 'A' | 'B';
  clueGiverId: string;
  cardsCorrect: number;
  cardsSkipped: number;
  buzzCount: number;
  finalScore: number;
}

export interface GameSettings {
  turnDuration: number; // Seconds per turn (default: 60)
  maxRounds: number; // Number of rounds (default: 6)
  allowSkips: boolean; // Allow pass/skip (default: true)
  skipPenalty: number; // Points deducted for skip (default: 0)
}

export const DEFAULT_GAME_SETTINGS: GameSettings = {
  turnDuration: 60,
  maxRounds: 6,
  allowSkips: true,
  skipPenalty: 0,
};
