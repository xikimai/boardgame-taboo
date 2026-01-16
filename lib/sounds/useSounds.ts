'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  unlockAudio,
  playBuzz as enginePlayBuzz,
  playCorrect as enginePlayCorrect,
  playSkip as enginePlaySkip,
  playTick as enginePlayTick,
  playClick as enginePlayClick,
  playGameOver as enginePlayGameOver,
  playJoin as enginePlayJoin,
  playStart as enginePlayStart,
} from './soundEngine';

const MUTE_STORAGE_KEY = 'taboo-sound-muted';

export interface UseSoundsReturn {
  playBuzz: () => void;
  playCorrect: () => void;
  playSkip: () => void;
  playTick: () => void;
  playClick: () => void;
  playGameOver: () => void;
  playJoin: () => void;
  playStart: () => void;
  setMuted: (muted: boolean) => void;
  toggleMuted: () => void;
  isMuted: boolean;
  isUnlocked: boolean;
}

/**
 * React hook for playing game sounds with mute support.
 * Handles browser audio autoplay restrictions and persists mute preference.
 */
export function useSounds(): UseSoundsReturn {
  const [isMuted, setIsMuted] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const hasInitialized = useRef(false);

  // Load mute preference from localStorage on mount
  useEffect(() => {
    if (hasInitialized.current) return;
    hasInitialized.current = true;

    const stored = localStorage.getItem(MUTE_STORAGE_KEY);
    if (stored !== null) {
      setIsMuted(stored === 'true');
    }
  }, []);

  // Save mute preference to localStorage
  const setMuted = useCallback((muted: boolean) => {
    setIsMuted(muted);
    localStorage.setItem(MUTE_STORAGE_KEY, String(muted));
  }, []);

  const toggleMuted = useCallback(() => {
    setMuted(!isMuted);
  }, [isMuted, setMuted]);

  // Unlock audio on first interaction
  const ensureUnlocked = useCallback(() => {
    if (!isUnlocked) {
      unlockAudio();
      setIsUnlocked(true);
    }
  }, [isUnlocked]);

  // Wrapper to check mute state before playing
  const wrapPlay = useCallback(
    (playFn: () => void) => {
      return () => {
        ensureUnlocked();
        if (!isMuted) {
          playFn();
        }
      };
    },
    [isMuted, ensureUnlocked]
  );

  return {
    playBuzz: wrapPlay(enginePlayBuzz),
    playCorrect: wrapPlay(enginePlayCorrect),
    playSkip: wrapPlay(enginePlaySkip),
    playTick: wrapPlay(enginePlayTick),
    playClick: wrapPlay(enginePlayClick),
    playGameOver: wrapPlay(enginePlayGameOver),
    playJoin: wrapPlay(enginePlayJoin),
    playStart: wrapPlay(enginePlayStart),
    setMuted,
    toggleMuted,
    isMuted,
    isUnlocked,
  };
}
