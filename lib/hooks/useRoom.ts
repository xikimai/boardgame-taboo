'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import PartySocket from 'partysocket';
import type {
  ServerMessage,
  ClientMessage,
  Room,
  GameState,
  TabooCard,
  TurnResult,
  Team,
} from '@/types';
import { analytics, identifyPlayer } from '@/lib/analytics/posthog';

const PARTYKIT_HOST = process.env.NEXT_PUBLIC_PARTYKIT_HOST || 'localhost:1999';

export interface UseRoomState {
  room: Room | null;
  game: GameState | null;
  currentPlayerId: string | null;
  currentCard: TabooCard | null;
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'reconnecting';
  error: string | null;
  buzzAlert: { buzzedBy: string; buzzerName: string } | null;
  turnResult: TurnResult | null;
  gameOver: { winner: Team | 'tie'; finalScores: { A: number; B: number } } | null;
}

export interface UseRoomActions {
  joinRoom: (playerName: string) => void;
  selectTeam: (team: Team) => void;
  leaveTeam: () => void;
  startGame: () => void;
  startTurn: () => void;
  cardCorrect: () => void;
  cardSkip: () => void;
  buzz: () => void;
  dismissBuzz: () => void;
  restartGame: () => void;
  clearBuzzAlert: () => void;
  clearTurnResult: () => void;
}

export function useRoom(roomCode: string): UseRoomState & UseRoomActions {
  const [state, setState] = useState<UseRoomState>({
    room: null,
    game: null,
    currentPlayerId: null,
    currentCard: null,
    connectionStatus: 'connecting',
    error: null,
    buzzAlert: null,
    turnResult: null,
    gameOver: null,
  });

  const socketRef = useRef<PartySocket | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;

  // Send message helper
  const sendMessage = useCallback((message: ClientMessage) => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify(message));
    }
  }, []);

  // Handle incoming messages
  const handleMessage = useCallback((event: MessageEvent) => {
    try {
      const message: ServerMessage = JSON.parse(event.data);

      switch (message.type) {
        case 'ROOM_STATE':
          setState((prev) => ({
            ...prev,
            room: message.payload.room,
            game: message.payload.game,
            currentPlayerId: message.payload.playerId,
            connectionStatus: 'connected',
            error: null,
          }));
          break;

        case 'PLAYER_JOINED':
          setState((prev) => {
            if (!prev.room) return prev;
            return {
              ...prev,
              room: {
                ...prev.room,
                players: {
                  ...prev.room.players,
                  [message.payload.player.id]: message.payload.player,
                },
              },
            };
          });
          break;

        case 'PLAYER_LEFT':
          setState((prev) => {
            if (!prev.room) return prev;
            const player = prev.room.players[message.payload.playerId];
            if (player) {
              player.isConnected = false;
            }
            return { ...prev, room: { ...prev.room } };
          });
          break;

        case 'PLAYER_RECONNECTED':
          setState((prev) => {
            if (!prev.room) return prev;
            const player = prev.room.players[message.payload.playerId];
            if (player) {
              player.isConnected = true;
            }
            return { ...prev, room: { ...prev.room } };
          });
          break;

        case 'PLAYER_REMOVED':
          setState((prev) => {
            if (!prev.room) return prev;
            const { playerId } = message.payload;
            const player = prev.room.players[playerId];

            // Remove from team array if present
            if (player?.team) {
              const teamArray = prev.room.teams[player.team];
              const index = teamArray.indexOf(playerId);
              if (index > -1) teamArray.splice(index, 1);
            }

            // Remove from players
            const { [playerId]: removed, ...remainingPlayers } = prev.room.players;

            return {
              ...prev,
              room: {
                ...prev.room,
                players: remainingPlayers,
              },
            };
          });
          break;

        case 'HOST_CHANGED':
          setState((prev) => {
            if (!prev.room) return prev;
            const { newHostId } = message.payload;

            // Update old host
            const oldHost = Object.values(prev.room.players).find((p) => p.isHost);
            if (oldHost) {
              oldHost.isHost = false;
            }

            // Update new host
            const newHost = prev.room.players[newHostId];
            if (newHost) {
              newHost.isHost = true;
            }

            return {
              ...prev,
              room: {
                ...prev.room,
                hostId: newHostId,
              },
            };
          });
          break;

        case 'TEAM_UPDATED':
          setState((prev) => {
            if (!prev.room) return prev;
            const { playerId, team } = message.payload;
            const player = prev.room.players[playerId];

            // Remove from old team
            if (player?.team) {
              const oldTeam = prev.room.teams[player.team];
              const index = oldTeam.indexOf(playerId);
              if (index > -1) oldTeam.splice(index, 1);
            }

            // Add to new team
            if (player) {
              player.team = team;
              if (team) {
                prev.room.teams[team].push(playerId);
              }
            }

            return { ...prev, room: { ...prev.room } };
          });
          break;

        case 'GAME_STARTED':
          setState((prev) => {
            // Track game start
            if (prev.room) {
              analytics.gameStarted(
                prev.room.code,
                prev.room.teams.A.length,
                prev.room.teams.B.length
              );
            }
            return {
              ...prev,
              game: message.payload.game,
              room: prev.room ? { ...prev.room, status: 'playing' } : null,
              gameOver: null,
            };
          });
          break;

        case 'TURN_STARTED':
          setState((prev) => ({
            ...prev,
            game: prev.game
              ? { ...prev.game, currentTurn: message.payload.turn }
              : null,
            currentCard: message.payload.card,
            turnResult: null,
          }));
          break;

        case 'CARD_CHANGED':
          setState((prev) => ({
            ...prev,
            currentCard: message.payload.card,
            game: prev.game
              ? {
                  ...prev.game,
                  currentTurn: {
                    ...prev.game.currentTurn,
                    turnScore: message.payload.turnScore,
                  },
                }
              : null,
          }));
          break;

        case 'SCORE_UPDATED':
          setState((prev) => ({
            ...prev,
            game: prev.game
              ? {
                  ...prev.game,
                  scores: message.payload.scores,
                  currentTurn: {
                    ...prev.game.currentTurn,
                    turnScore: message.payload.turnScore,
                  },
                }
              : null,
          }));
          break;

        case 'BUZZER_PRESSED':
          setState((prev) => ({
            ...prev,
            buzzAlert: {
              buzzedBy: message.payload.buzzedBy,
              buzzerName: message.payload.buzzerName,
            },
            game: prev.game
              ? {
                  ...prev.game,
                  currentTurn: { ...prev.game.currentTurn, status: 'buzzing' },
                }
              : null,
          }));
          break;

        case 'BUZZ_DISMISSED':
          setState((prev) => ({
            ...prev,
            buzzAlert: null,
            game: prev.game
              ? {
                  ...prev.game,
                  currentTurn: { ...prev.game.currentTurn, status: 'active' },
                }
              : null,
          }));
          break;

        case 'TURN_ENDED':
          setState((prev) => ({
            ...prev,
            turnResult: message.payload.result,
            game: prev.game
              ? {
                  ...prev.game,
                  currentTurn: message.payload.nextTurn || prev.game.currentTurn,
                }
              : null,
          }));
          break;

        case 'GAME_OVER':
          // Track game over
          analytics.gameOver(
            message.payload.winner,
            message.payload.finalScores.A,
            message.payload.finalScores.B
          );
          setState((prev) => ({
            ...prev,
            gameOver: {
              winner: message.payload.winner,
              finalScores: message.payload.finalScores,
            },
            room: prev.room ? { ...prev.room, status: 'finished' } : null,
          }));
          break;

        case 'RETURNED_TO_LOBBY':
          setState((prev) => ({
            ...prev,
            room: message.payload.room,
            game: null,
            currentCard: null,
            turnResult: null,
            gameOver: null,
          }));
          break;

        case 'ERROR':
          setState((prev) => ({
            ...prev,
            error: message.payload.message,
          }));
          break;

        case 'PONG':
          // Could use for latency calculation
          break;
      }
    } catch (e) {
      console.error('Error parsing message:', e);
    }
  }, []);

  // Initialize WebSocket connection
  useEffect(() => {
    const connect = () => {
      const socket = new PartySocket({
        host: PARTYKIT_HOST,
        room: roomCode,
      });

      socket.onopen = () => {
        reconnectAttempts.current = 0;
        setState((prev) => ({ ...prev, connectionStatus: 'connected' }));
      };

      socket.onclose = () => {
        setState((prev) => ({ ...prev, connectionStatus: 'disconnected' }));

        // Attempt reconnection
        if (reconnectAttempts.current < maxReconnectAttempts) {
          reconnectAttempts.current++;
          const delay = Math.min(1000 * 2 ** reconnectAttempts.current, 30000);
          setState((prev) => ({ ...prev, connectionStatus: 'reconnecting' }));
          setTimeout(connect, delay);
        }
      };

      socket.onerror = () => {
        setState((prev) => ({
          ...prev,
          error: 'Connection error. Please try again.',
        }));
      };

      socket.onmessage = handleMessage;

      socketRef.current = socket;
    };

    connect();

    return () => {
      socketRef.current?.close();
    };
  }, [roomCode, handleMessage]);

  // Actions
  const joinRoom = useCallback(
    (playerName: string) => {
      const existingPlayerId = sessionStorage.getItem(`playerId_${roomCode}`);
      sendMessage({
        type: 'JOIN_ROOM',
        payload: { playerName, playerId: existingPlayerId || undefined },
      });
    },
    [roomCode, sendMessage]
  );

  const selectTeam = useCallback(
    (team: Team) => {
      sendMessage({ type: 'SELECT_TEAM', payload: { team } });
    },
    [sendMessage]
  );

  const leaveTeam = useCallback(() => {
    sendMessage({ type: 'LEAVE_TEAM' });
  }, [sendMessage]);

  const startGame = useCallback(() => {
    sendMessage({ type: 'START_GAME' });
  }, [sendMessage]);

  const startTurn = useCallback(() => {
    sendMessage({ type: 'START_TURN' });
  }, [sendMessage]);

  const cardCorrect = useCallback(() => {
    sendMessage({ type: 'CARD_CORRECT' });
  }, [sendMessage]);

  const cardSkip = useCallback(() => {
    sendMessage({ type: 'CARD_SKIP' });
  }, [sendMessage]);

  const buzz = useCallback(() => {
    sendMessage({ type: 'BUZZ' });
  }, [sendMessage]);

  const dismissBuzz = useCallback(() => {
    sendMessage({ type: 'DISMISS_BUZZ' });
  }, [sendMessage]);

  const restartGame = useCallback(() => {
    sendMessage({ type: 'RESTART_GAME' });
  }, [sendMessage]);

  const clearBuzzAlert = useCallback(() => {
    setState((prev) => ({ ...prev, buzzAlert: null }));
  }, []);

  const clearTurnResult = useCallback(() => {
    setState((prev) => ({ ...prev, turnResult: null }));
  }, []);

  // Store player ID when received
  useEffect(() => {
    if (state.currentPlayerId) {
      sessionStorage.setItem(`playerId_${roomCode}`, state.currentPlayerId);
    }
  }, [state.currentPlayerId, roomCode]);

  return {
    ...state,
    joinRoom,
    selectTeam,
    leaveTeam,
    startGame,
    startTurn,
    cardCorrect,
    cardSkip,
    buzz,
    dismissBuzz,
    restartGame,
    clearBuzzAlert,
    clearTurnResult,
  };
}
