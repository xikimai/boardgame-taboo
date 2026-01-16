'use client';

import React, { useEffect } from 'react';
import posthog from 'posthog-js';

// Initialize PostHog
let initialized = false;

export function initPostHog() {
  if (
    typeof window !== 'undefined' &&
    !initialized &&
    process.env.NEXT_PUBLIC_POSTHOG_KEY
  ) {
    posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
      api_host: 'https://app.posthog.com',
      capture_pageview: true,
      capture_pageleave: true,
      // Disable in development unless explicitly enabled
      loaded: (posthog) => {
        if (process.env.NODE_ENV === 'development') {
          posthog.opt_out_capturing();
        }
      },
    });
    initialized = true;
  }
}

// PostHog Provider component
export function PostHogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    initPostHog();
  }, []);

  return <>{children}</>;
}

// Track custom events
export function trackEvent(
  event: string,
  properties?: Record<string, unknown>
) {
  if (typeof window !== 'undefined' && initialized) {
    posthog.capture(event, properties);
  }
}

// Identify user (for player tracking)
export function identifyPlayer(playerId: string, properties?: Record<string, unknown>) {
  if (typeof window !== 'undefined' && initialized) {
    posthog.identify(playerId, properties);
  }
}

// Game-specific tracking helpers
export const analytics = {
  roomJoined: (roomCode: string, playerName: string) => {
    trackEvent('room_joined', { room_code: roomCode, player_name: playerName });
  },

  gameStarted: (roomCode: string, teamACount: number, teamBCount: number) => {
    trackEvent('game_started', {
      room_code: roomCode,
      team_a_players: teamACount,
      team_b_players: teamBCount,
      total_players: teamACount + teamBCount,
    });
  },

  turnCompleted: (team: 'A' | 'B', score: number, skips: number) => {
    trackEvent('turn_completed', {
      team,
      turn_score: score,
      skips_used: skips,
    });
  },

  gameOver: (winner: 'A' | 'B' | 'tie', scoreA: number, scoreB: number) => {
    trackEvent('game_over', {
      winner,
      score_a: scoreA,
      score_b: scoreB,
      margin: Math.abs(scoreA - scoreB),
    });
  },

  buzzPressed: (roomCode: string) => {
    trackEvent('buzz_pressed', { room_code: roomCode });
  },
};
