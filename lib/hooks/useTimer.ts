'use client';

import { useState, useEffect, useCallback } from 'react';
import { TIMER_WARNING_THRESHOLD, TIMER_CRITICAL_THRESHOLD } from '@/lib/game';

export interface UseTimerState {
  timeLeft: number;
  isRunning: boolean;
  timerClass: 'timer-normal' | 'timer-warning' | 'timer-critical';
}

export function useTimer(
  startedAt: number,
  duration: number,
  status: 'waiting' | 'active' | 'buzzing' | 'ended'
): UseTimerState {
  const [timeLeft, setTimeLeft] = useState<number>(Math.ceil(duration / 1000));

  const calculateTimeLeft = useCallback(() => {
    if (status !== 'active' && status !== 'buzzing') {
      return Math.ceil(duration / 1000);
    }

    if (startedAt === 0) {
      return Math.ceil(duration / 1000);
    }

    const elapsed = Date.now() - startedAt;
    const remaining = Math.max(0, duration - elapsed);
    return Math.ceil(remaining / 1000);
  }, [startedAt, duration, status]);

  useEffect(() => {
    // Update immediately
    setTimeLeft(calculateTimeLeft());

    // Only run interval if active
    if (status !== 'active' && status !== 'buzzing') {
      return;
    }

    const interval = setInterval(() => {
      const newTimeLeft = calculateTimeLeft();
      setTimeLeft(newTimeLeft);

      if (newTimeLeft <= 0) {
        clearInterval(interval);
      }
    }, 100);

    return () => clearInterval(interval);
  }, [calculateTimeLeft, status]);

  // Determine timer class based on time left
  let timerClass: 'timer-normal' | 'timer-warning' | 'timer-critical' = 'timer-normal';
  if (timeLeft <= TIMER_CRITICAL_THRESHOLD) {
    timerClass = 'timer-critical';
  } else if (timeLeft <= TIMER_WARNING_THRESHOLD) {
    timerClass = 'timer-warning';
  }

  return {
    timeLeft,
    isRunning: status === 'active' || status === 'buzzing',
    timerClass,
  };
}

// Format seconds as MM:SS
export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}
