// Room code generation utilities

import { ROOM_CODE_CHARS, ROOM_CODE_LENGTH } from './constants';

/**
 * Generate a random room code using unambiguous characters
 */
export function generateRoomCode(length: number = ROOM_CODE_LENGTH): string {
  let code = '';
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * ROOM_CODE_CHARS.length);
    code += ROOM_CODE_CHARS[randomIndex];
  }
  return code;
}

/**
 * Validate a room code format
 */
export function isValidRoomCode(code: string): boolean {
  if (code.length !== ROOM_CODE_LENGTH) {
    return false;
  }

  const upperCode = code.toUpperCase();
  for (const char of upperCode) {
    if (!ROOM_CODE_CHARS.includes(char)) {
      return false;
    }
  }

  return true;
}

/**
 * Normalize room code (uppercase, trim)
 */
export function normalizeRoomCode(code: string): string {
  return code.trim().toUpperCase();
}
