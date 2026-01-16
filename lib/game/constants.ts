// Game constants for Taboo

// Timer
export const DEFAULT_TURN_DURATION = 60; // seconds
export const TIMER_WARNING_THRESHOLD = 10; // seconds - show warning color
export const TIMER_CRITICAL_THRESHOLD = 5; // seconds - show critical color

// Teams
export const TEAM_COLORS = {
  A: {
    primary: '#3B82F6', // blue-500
    secondary: '#DBEAFE', // blue-100
    name: 'Blue Team',
  },
  B: {
    primary: '#EF4444', // red-500
    secondary: '#FEE2E2', // red-100
    name: 'Red Team',
  },
} as const;

// Room
export const MIN_PLAYERS_TO_START = 2; // At least 1 per team
export const MAX_PLAYERS_PER_ROOM = 10;
export const ROOM_CODE_LENGTH = 5;
// Unambiguous characters (no O/0, I/1/l)
export const ROOM_CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

// Game
export const DEFAULT_ROUNDS = 6;
export const CARDS_PER_DECK = 200;
export const TABOO_WORDS_PER_CARD = 5;

// Reconnection
export const RECONNECT_TIMEOUT = 30000; // 30 seconds to reconnect
export const MAX_RECONNECT_ATTEMPTS = 5;
export const RECONNECT_BASE_DELAY = 1000; // 1 second, exponential backoff

// Buzz
export const BUZZ_DISPLAY_DURATION = 2000; // 2 seconds

// Debouncing
export const BUTTON_DEBOUNCE_MS = 300;
