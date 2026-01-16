import type * as Party from 'partykit/server';
import type {
  ClientMessage,
  ServerMessage,
  Room,
  Player,
  GameState,
  TurnState,
  TabooCard,
  TurnResult,
  Team,
} from '../types';
import { DEFAULT_GAME_SETTINGS } from '../types';
import cardsData from '../data/cards.json';

// Type for the cards data
const cards: TabooCard[] = cardsData.cards;

// Cleanup constants
const RECONNECT_GRACE_PERIOD_MS = 30_000; // 30 seconds before removing disconnected players
const CLEANUP_CHECK_INTERVAL_MS = 10_000; // Check for cleanups every 10 seconds
const BUZZ_TIMEOUT_MS = 10_000; // 10 seconds for clue giver to acknowledge buzz

// Alarm intent types for multiplexing (PartyKit only allows ONE alarm per room)
type AlarmIntent =
  | { type: 'turn_end'; scheduledFor: number }
  | { type: 'player_cleanup'; scheduledFor: number }
  | { type: 'buzz_timeout'; scheduledFor: number };

// Helper to shuffle array
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// Generate UUID
function generateId(): string {
  return crypto.randomUUID();
}

export default class TabooServer implements Party.Server {
  room: Room;
  game: GameState | null = null;
  turnTimer: ReturnType<typeof setTimeout> | null = null;

  // Alarm state for multiplexed scheduling (turn timer + player cleanup)
  alarmState: {
    nextAlarmAt: number | null;
    pendingIntents: AlarmIntent[];
  } = { nextAlarmAt: null, pendingIntents: [] };

  constructor(readonly party: Party.Party) {
    // Initialize empty room
    this.room = {
      code: party.id,
      hostId: '',
      status: 'lobby',
      players: {},
      teams: { A: [], B: [] },
      settings: { ...DEFAULT_GAME_SETTINGS },
      createdAt: Date.now(),
    };
  }

  // Handle HTTP requests (for room validation)
  async onRequest(req: Party.Request): Promise<Response> {
    if (req.method === 'GET') {
      const playerCount = Object.keys(this.room.players).length;
      return Response.json({
        exists: playerCount > 0 || this.room.status !== 'lobby',
        status: this.room.status,
        playerCount,
        canJoin: this.room.status === 'lobby',
      });
    }
    return new Response('Method not allowed', { status: 405 });
  }

  // Handle new WebSocket connections
  onConnect(conn: Party.Connection, ctx: Party.ConnectionContext) {
    // Connection established, wait for JOIN_ROOM message
    console.log(`Connection opened: ${conn.id}`);
  }

  // Handle WebSocket messages
  onMessage(message: string, sender: Party.Connection) {
    try {
      const msg: ClientMessage = JSON.parse(message);

      switch (msg.type) {
        case 'JOIN_ROOM':
          this.handleJoinRoom(msg.payload, sender);
          break;
        case 'SELECT_TEAM':
          this.handleSelectTeam(msg.payload.team, sender);
          break;
        case 'LEAVE_TEAM':
          this.handleLeaveTeam(sender);
          break;
        case 'START_GAME':
          this.handleStartGame(sender);
          break;
        case 'START_TURN':
          this.handleStartTurn(sender);
          break;
        case 'CARD_CORRECT':
          this.handleCardCorrect(sender);
          break;
        case 'CARD_SKIP':
          this.handleCardSkip(sender);
          break;
        case 'BUZZ':
          this.handleBuzz(sender);
          break;
        case 'DISMISS_BUZZ':
          this.handleDismissBuzz(sender);
          break;
        case 'RESTART_GAME':
          this.handleRestartGame(sender);
          break;
        case 'PING':
          sender.send(JSON.stringify({
            type: 'PONG',
            payload: { serverTime: Date.now() },
          } as ServerMessage));
          break;
      }
    } catch (e) {
      console.error('Error handling message:', e);
      this.sendError(sender, 'Invalid message format');
    }
  }

  // Handle disconnections
  onClose(conn: Party.Connection) {
    const player = this.findPlayerByConnection(conn.id);
    if (!player) return;

    player.isConnected = false;
    player.lastSeen = Date.now();

    // Notify others
    this.broadcast({
      type: 'PLAYER_LEFT',
      payload: { playerId: player.id },
    });

    // If host disconnected, assign new host
    if (player.id === this.room.hostId) {
      this.assignNewHost();
    }

    // CRITICAL: If this player is the active clue giver during an active turn,
    // end turn immediately - don't waste 60 seconds of everyone's time
    if (
      this.game &&
      this.game.currentTurn.clueGiverId === player.id &&
      (this.game.currentTurn.status === 'active' || this.game.currentTurn.status === 'buzzing')
    ) {
      this.endTurn();
    }

    // Schedule cleanup after grace period (30 seconds)
    this.scheduleAlarm({
      type: 'player_cleanup',
      scheduledFor: Date.now() + RECONNECT_GRACE_PERIOD_MS,
    });
  }

  // Handle PartyKit alarms (multiplexed for turn timer + cleanup)
  async onAlarm() {
    const now = Date.now();

    // Process all intents that are due
    const dueIntents = this.alarmState.pendingIntents.filter(
      (i) => i.scheduledFor <= now
    );
    this.alarmState.pendingIntents = this.alarmState.pendingIntents.filter(
      (i) => i.scheduledFor > now
    );

    for (const intent of dueIntents) {
      switch (intent.type) {
        case 'turn_end':
          this.endTurn();
          break;
        case 'player_cleanup':
          this.processPlayerCleanup();
          break;
        case 'buzz_timeout':
          await this.handleBuzzTimeout();
          break;
      }
    }

    // Schedule next alarm if there are pending intents
    if (this.alarmState.pendingIntents.length > 0) {
      const nextTime = Math.min(
        ...this.alarmState.pendingIntents.map((i) => i.scheduledFor)
      );
      this.alarmState.nextAlarmAt = nextTime;
      await this.party.storage.setAlarm(nextTime);
    } else {
      this.alarmState.nextAlarmAt = null;
    }
  }

  // ============ Message Handlers ============

  private handleJoinRoom(
    payload: { playerName: string; playerId?: string },
    conn: Party.Connection
  ) {
    const { playerName, playerId } = payload;

    // Check if reconnecting
    if (playerId && this.room.players[playerId]) {
      const existingPlayer = this.room.players[playerId];
      existingPlayer.isConnected = true;
      existingPlayer.lastSeen = Date.now();

      // Cancel any pending cleanup for this player (they reconnected in time)
      // Note: We don't remove the cleanup intent since it will just no-op when it fires
      // (processPlayerCleanup checks isConnected before removing)

      // Update connection mapping
      (conn as Party.Connection & { playerId?: string }).playerId = playerId;

      // Send current state
      this.sendRoomState(conn, playerId);

      // Notify others
      this.broadcast({
        type: 'PLAYER_RECONNECTED',
        payload: { playerId },
      }, [conn.id]);

      return;
    }

    // New player
    const newPlayerId = generateId();
    const isFirstPlayer = Object.keys(this.room.players).length === 0;

    const newPlayer: Player = {
      id: newPlayerId,
      name: playerName,
      team: null,
      isHost: isFirstPlayer,
      isConnected: true,
      lastSeen: Date.now(),
    };

    this.room.players[newPlayerId] = newPlayer;

    if (isFirstPlayer) {
      this.room.hostId = newPlayerId;
    }

    // Store player ID on connection for later reference
    (conn as Party.Connection & { playerId?: string }).playerId = newPlayerId;

    // Send state to new player
    this.sendRoomState(conn, newPlayerId);

    // Notify others
    this.broadcast({
      type: 'PLAYER_JOINED',
      payload: { player: newPlayer },
    }, [conn.id]);
  }

  private handleSelectTeam(team: Team, conn: Party.Connection) {
    const playerId = this.getPlayerId(conn);
    if (!playerId) return;

    const player = this.room.players[playerId];
    if (!player) return;

    // Remove from current team if any
    if (player.team) {
      const currentTeam = this.room.teams[player.team];
      const index = currentTeam.indexOf(playerId);
      if (index > -1) {
        currentTeam.splice(index, 1);
      }
    }

    // Add to new team
    player.team = team;
    this.room.teams[team].push(playerId);

    // Notify all
    this.broadcast({
      type: 'TEAM_UPDATED',
      payload: { playerId, team },
    });
  }

  private handleLeaveTeam(conn: Party.Connection) {
    const playerId = this.getPlayerId(conn);
    if (!playerId) return;

    const player = this.room.players[playerId];
    if (!player || !player.team) return;

    // Remove from team
    const team = player.team;
    const index = this.room.teams[team].indexOf(playerId);
    if (index > -1) {
      this.room.teams[team].splice(index, 1);
    }
    player.team = null;

    // Notify all
    this.broadcast({
      type: 'TEAM_UPDATED',
      payload: { playerId, team: null },
    });
  }

  private handleStartGame(conn: Party.Connection) {
    const playerId = this.getPlayerId(conn);
    if (!playerId) return;

    // Only host can start
    if (playerId !== this.room.hostId) {
      this.sendError(conn, 'Only the host can start the game');
      return;
    }

    // Guard against double game start
    if (this.game || this.room.status === 'playing') {
      this.sendError(conn, 'Game is already in progress');
      return;
    }

    // Validate teams
    if (this.room.teams.A.length === 0 || this.room.teams.B.length === 0) {
      this.sendError(conn, 'Each team needs at least one player');
      return;
    }

    // Initialize game
    this.initializeGame();
    this.room.status = 'playing';

    // Broadcast game started
    this.broadcast({
      type: 'GAME_STARTED',
      payload: { game: this.game! },
    });

    // Send card to appropriate players
    this.sendCardToPlayers();
  }

  private handleStartTurn(conn: Party.Connection) {
    const playerId = this.getPlayerId(conn);
    if (!playerId || !this.game) return;

    // Only clue giver can start turn
    if (playerId !== this.game.currentTurn.clueGiverId) {
      return;
    }

    if (this.game.currentTurn.status !== 'waiting') {
      return;
    }

    // Start the turn
    this.game.currentTurn.status = 'active';
    this.game.currentTurn.timerStartedAt = Date.now();
    this.game.currentTurn.timerDuration = this.room.settings.turnDuration * 1000;

    // Set timer
    this.setTurnTimer();

    // Broadcast turn started
    this.broadcastTurnState();
  }

  private handleCardCorrect(conn: Party.Connection) {
    const playerId = this.getPlayerId(conn);
    if (!playerId || !this.game) return;

    // Only clue giver can mark correct
    if (playerId !== this.game.currentTurn.clueGiverId) {
      return;
    }

    if (this.game.currentTurn.status !== 'active') {
      return;
    }

    // Increment score
    this.game.currentTurn.turnScore++;
    this.game.scores[this.game.currentTurn.activeTeam]++;

    // Draw next card
    this.drawNextCard();

    // Broadcast update
    this.broadcast({
      type: 'SCORE_UPDATED',
      payload: {
        scores: this.game.scores,
        turnScore: this.game.currentTurn.turnScore,
      },
    });

    this.sendCardToPlayers();
  }

  private handleCardSkip(conn: Party.Connection) {
    const playerId = this.getPlayerId(conn);
    if (!playerId || !this.game) return;

    if (playerId !== this.game.currentTurn.clueGiverId) {
      return;
    }

    if (this.game.currentTurn.status !== 'active') {
      return;
    }

    if (!this.room.settings.allowSkips) {
      this.sendError(conn, 'Skipping is not allowed');
      return;
    }

    // Apply skip penalty if any
    this.game.currentTurn.skipsUsed++;
    if (this.room.settings.skipPenalty > 0) {
      this.game.scores[this.game.currentTurn.activeTeam] -= this.room.settings.skipPenalty;
    }

    // Draw next card
    this.drawNextCard();

    // Broadcast update
    this.sendCardToPlayers();
  }

  private async handleBuzz(conn: Party.Connection) {
    const playerId = this.getPlayerId(conn);
    if (!playerId || !this.game) return;

    const player = this.room.players[playerId];
    if (!player) return;

    // Only opposing team can buzz
    if (player.team === this.game.currentTurn.activeTeam) {
      return;
    }

    if (this.game.currentTurn.status !== 'active') {
      return;
    }

    const now = Date.now();
    const { timerStartedAt, timerDuration } = this.game.currentTurn;

    // Calculate remaining time
    const elapsed = now - timerStartedAt;
    const remainingTime = Math.max(0, timerDuration - elapsed);

    // Pause timer: store when paused and remaining time
    this.game.currentTurn.timerPausedAt = now;
    this.game.currentTurn.remainingTimeWhenPaused = remainingTime;
    this.game.currentTurn.status = 'buzzing';

    // Cancel turn_end alarm (timer is paused)
    this.cancelAlarmIntent('turn_end');

    // Schedule buzz_timeout alarm (10 seconds for clue giver to acknowledge)
    await this.scheduleAlarm({
      type: 'buzz_timeout',
      scheduledFor: now + BUZZ_TIMEOUT_MS,
    });

    // Broadcast buzz with timer pause info
    this.broadcast({
      type: 'BUZZER_PRESSED',
      payload: {
        buzzedBy: playerId,
        buzzerName: player.name,
        timerPausedAt: now,
        remainingTimeWhenPaused: remainingTime,
      },
    });
  }

  private async handleDismissBuzz(conn: Party.Connection) {
    const playerId = this.getPlayerId(conn);
    if (!playerId || !this.game) return;

    // Only clue giver can dismiss buzz
    if (playerId !== this.game.currentTurn.clueGiverId) {
      return;
    }

    if (this.game.currentTurn.status !== 'buzzing') {
      return;
    }

    // Deduct point and move to next card
    this.game.currentTurn.turnScore = Math.max(0, this.game.currentTurn.turnScore);
    this.game.scores[this.game.currentTurn.activeTeam] = Math.max(
      0,
      this.game.scores[this.game.currentTurn.activeTeam] - 1
    );

    const now = Date.now();
    const remainingTime = this.game.currentTurn.remainingTimeWhenPaused;

    // Resume timer with remaining time
    this.game.currentTurn.timerStartedAt = now;
    this.game.currentTurn.timerDuration = remainingTime;
    this.game.currentTurn.timerPausedAt = 0;
    this.game.currentTurn.remainingTimeWhenPaused = 0;
    this.game.currentTurn.status = 'active';

    // Cancel buzz_timeout alarm
    this.cancelAlarmIntent('buzz_timeout');

    // Schedule new turn_end alarm for remaining time
    if (remainingTime > 0) {
      await this.scheduleAlarm({
        type: 'turn_end',
        scheduledFor: now + remainingTime,
      });
    } else {
      // No time remaining, end turn immediately
      this.endTurn();
      return;
    }

    // Draw next card
    this.drawNextCard();

    // Broadcast with new timer info
    this.broadcast({
      type: 'BUZZ_DISMISSED',
      payload: {
        timerStartedAt: now,
        timerDuration: remainingTime,
      },
    });
    this.broadcast({
      type: 'SCORE_UPDATED',
      payload: {
        scores: this.game.scores,
        turnScore: this.game.currentTurn.turnScore,
      },
    });
    this.sendCardToPlayers();
  }

  // Auto-dismiss buzz after timeout if clue giver doesn't respond
  private async handleBuzzTimeout() {
    if (!this.game || this.game.currentTurn.status !== 'buzzing') {
      return;
    }

    // Apply -1 penalty
    this.game.scores[this.game.currentTurn.activeTeam] = Math.max(
      0,
      this.game.scores[this.game.currentTurn.activeTeam] - 1
    );

    const now = Date.now();
    const remainingTime = this.game.currentTurn.remainingTimeWhenPaused;

    // Resume timer with remaining time
    this.game.currentTurn.timerStartedAt = now;
    this.game.currentTurn.timerDuration = remainingTime;
    this.game.currentTurn.timerPausedAt = 0;
    this.game.currentTurn.remainingTimeWhenPaused = 0;
    this.game.currentTurn.status = 'active';

    // Schedule new turn_end alarm for remaining time
    if (remainingTime > 0) {
      await this.scheduleAlarm({
        type: 'turn_end',
        scheduledFor: now + remainingTime,
      });
    } else {
      // No time remaining, end turn immediately
      this.endTurn();
      return;
    }

    // Draw next card
    this.drawNextCard();

    // Broadcast auto-dismiss with timer info
    this.broadcast({
      type: 'BUZZ_DISMISSED',
      payload: {
        timerStartedAt: now,
        timerDuration: remainingTime,
        autoDismissed: true,
      },
    });
    this.broadcast({
      type: 'SCORE_UPDATED',
      payload: {
        scores: this.game.scores,
        turnScore: this.game.currentTurn.turnScore,
      },
    });
    this.sendCardToPlayers();
  }

  private handleRestartGame(conn: Party.Connection) {
    const playerId = this.getPlayerId(conn);
    if (!playerId) return;

    // Only host can restart
    if (playerId !== this.room.hostId) {
      this.sendError(conn, 'Only the host can restart the game');
      return;
    }

    // Reset to lobby
    this.room.status = 'lobby';
    this.game = null;

    // Clear all timers and alarms
    if (this.turnTimer) {
      clearTimeout(this.turnTimer);
      this.turnTimer = null;
    }
    this.alarmState.pendingIntents = [];
    this.alarmState.nextAlarmAt = null;

    // Broadcast
    this.broadcast({
      type: 'RETURNED_TO_LOBBY',
      payload: { room: this.room },
    });
  }

  // ============ Game Logic Helpers ============

  private initializeGame() {
    // Shuffle all card indices
    const cardIndices = shuffleArray(
      Array.from({ length: cards.length }, (_, i) => i)
    );

    // Determine starting team (random)
    const startingTeam: Team = Math.random() < 0.5 ? 'A' : 'B';

    // Get first clue giver (index 0 for starting team)
    const firstClueGiver = this.room.teams[startingTeam][0];

    this.game = {
      currentRound: 1,
      totalRounds: this.room.settings.maxRounds,
      currentTurn: {
        activeTeam: startingTeam,
        clueGiverId: firstClueGiver,
        currentCardIndex: cardIndices[0],
        turnScore: 0,
        skipsUsed: 0,
        timerStartedAt: 0,
        timerDuration: this.room.settings.turnDuration * 1000,
        isPaused: false,
        status: 'waiting',
        timerPausedAt: 0,
        remainingTimeWhenPaused: 0,
      },
      scores: { A: 0, B: 0 },
      // Track rotation index per team (starting team begins at 0, other at 0)
      clueGiverIndex: {
        A: startingTeam === 'A' ? 0 : 0,
        B: startingTeam === 'B' ? 0 : 0,
      },
      turnHistory: [],
      cardDeck: cardIndices.slice(1),
      usedCards: [cardIndices[0]],
    };
  }

  private drawNextCard() {
    if (!this.game) return;

    // If deck is empty, reshuffle used cards
    if (this.game.cardDeck.length === 0) {
      this.game.cardDeck = shuffleArray(this.game.usedCards);
      this.game.usedCards = [];
    }

    const nextCardIndex = this.game.cardDeck.shift()!;
    this.game.currentTurn.currentCardIndex = nextCardIndex;
    this.game.usedCards.push(nextCardIndex);
  }

  private async setTurnTimer() {
    if (!this.game) return;

    // Clear any existing turn_end alarm intents
    this.cancelAlarmIntent('turn_end');

    // Also clear legacy setTimeout if present (for backward compatibility during migration)
    if (this.turnTimer) {
      clearTimeout(this.turnTimer);
      this.turnTimer = null;
    }

    // Schedule turn end using PartyKit alarm (survives server hibernation)
    await this.scheduleAlarm({
      type: 'turn_end',
      scheduledFor: Date.now() + this.game.currentTurn.timerDuration,
    });
  }

  private endTurn() {
    if (!this.game) return;

    // Guard: don't end turn while buzzing - wait for buzz to be dismissed
    if (this.game.currentTurn.status === 'buzzing') {
      console.warn('endTurn called while buzzing - ignoring');
      return;
    }

    // Clear turn timer (both alarm-based and legacy setTimeout)
    this.cancelAlarmIntent('turn_end');
    if (this.turnTimer) {
      clearTimeout(this.turnTimer);
      this.turnTimer = null;
    }

    // Record turn result
    const result: TurnResult = {
      round: this.game.currentRound,
      team: this.game.currentTurn.activeTeam,
      clueGiverId: this.game.currentTurn.clueGiverId,
      cardsCorrect: this.game.currentTurn.turnScore,
      cardsSkipped: this.game.currentTurn.skipsUsed,
      buzzCount: 0, // Could track this
      finalScore: this.game.currentTurn.turnScore,
    };
    this.game.turnHistory.push(result);

    // Check if game should end
    const turnsPerRound = 2; // Each team plays once per round
    const totalTurns = this.game.turnHistory.length;

    if (totalTurns >= this.game.totalRounds * turnsPerRound) {
      this.endGame();
      return;
    }

    // Set up next turn
    const nextTeam: Team = this.game.currentTurn.activeTeam === 'A' ? 'B' : 'A';

    // If we've completed a full round, increment
    if (nextTeam === 'A') {
      this.game.currentRound++;
    }

    // Get next clue giver using per-team rotation index
    const teamPlayers = this.room.teams[nextTeam];

    // Increment the rotation index for this team
    this.game.clueGiverIndex[nextTeam] =
      (this.game.clueGiverIndex[nextTeam] + 1) % Math.max(1, teamPlayers.length);

    const nextClueGiverIndex = this.game.clueGiverIndex[nextTeam];
    const nextClueGiver = teamPlayers.length > 0
      ? teamPlayers[nextClueGiverIndex] || teamPlayers[0]
      : '';

    // Draw new card
    this.drawNextCard();

    // Set up next turn
    const nextTurn: TurnState = {
      activeTeam: nextTeam,
      clueGiverId: nextClueGiver,
      currentCardIndex: this.game.currentTurn.currentCardIndex,
      turnScore: 0,
      skipsUsed: 0,
      timerStartedAt: 0,
      timerDuration: this.room.settings.turnDuration * 1000,
      isPaused: false,
      status: 'waiting',
      timerPausedAt: 0,
      remainingTimeWhenPaused: 0,
    };

    this.game.currentTurn = nextTurn;

    // Broadcast turn ended
    this.broadcast({
      type: 'TURN_ENDED',
      payload: { result, nextTurn },
    });

    // Send card to appropriate players
    this.sendCardToPlayers();
  }

  private endGame() {
    if (!this.game) return;

    this.room.status = 'finished';

    let winner: Team | 'tie';
    if (this.game.scores.A > this.game.scores.B) {
      winner = 'A';
    } else if (this.game.scores.B > this.game.scores.A) {
      winner = 'B';
    } else {
      winner = 'tie';
    }

    this.broadcast({
      type: 'GAME_OVER',
      payload: {
        winner,
        finalScores: this.game.scores,
      },
    });
  }

  // ============ Communication Helpers ============

  private broadcast(message: ServerMessage, excludeConnIds: string[] = []) {
    const msg = JSON.stringify(message);
    for (const conn of this.party.getConnections()) {
      if (!excludeConnIds.includes(conn.id)) {
        conn.send(msg);
      }
    }
  }

  private sendError(conn: Party.Connection, message: string) {
    conn.send(JSON.stringify({
      type: 'ERROR',
      payload: { message },
    } as ServerMessage));
  }

  private sendRoomState(conn: Party.Connection, playerId: string) {
    conn.send(JSON.stringify({
      type: 'ROOM_STATE',
      payload: {
        room: this.room,
        game: this.game,
        playerId,
      },
    } as ServerMessage));

    // If game is active, also send card
    if (this.game && this.room.status === 'playing') {
      this.sendCardToPlayer(conn, playerId);
    }
  }

  private sendCardToPlayers() {
    if (!this.game) return;

    for (const conn of this.party.getConnections()) {
      const playerId = this.getPlayerId(conn);
      if (playerId) {
        this.sendCardToPlayer(conn, playerId);
      }
    }
  }

  private sendCardToPlayer(conn: Party.Connection, playerId: string) {
    if (!this.game) return;

    const player = this.room.players[playerId];
    if (!player) return;

    // Determine what card data to send
    let card: TabooCard | null = null;

    // Clue giver and opponents can see the card
    // Guessers (same team but not clue giver) cannot
    const isClueGiver = playerId === this.game.currentTurn.clueGiverId;
    const isOpponent = player.team !== null && player.team !== this.game.currentTurn.activeTeam;

    if (isClueGiver || isOpponent) {
      card = cards[this.game.currentTurn.currentCardIndex];
    }

    conn.send(JSON.stringify({
      type: 'CARD_CHANGED',
      payload: { card, turnScore: this.game.currentTurn.turnScore },
    } as ServerMessage));
  }

  private broadcastTurnState() {
    if (!this.game) return;

    for (const conn of this.party.getConnections()) {
      const playerId = this.getPlayerId(conn);
      if (!playerId) continue;

      const player = this.room.players[playerId];
      if (!player) continue;

      // Determine card visibility
      let card: TabooCard | null = null;
      const isClueGiver = playerId === this.game.currentTurn.clueGiverId;
      const isOpponent = player.team !== null && player.team !== this.game.currentTurn.activeTeam;

      if (isClueGiver || isOpponent) {
        card = cards[this.game.currentTurn.currentCardIndex];
      }

      conn.send(JSON.stringify({
        type: 'TURN_STARTED',
        payload: { turn: this.game.currentTurn, card },
      } as ServerMessage));
    }
  }

  // ============ Utility Helpers ============

  private getPlayerId(conn: Party.Connection): string | undefined {
    return (conn as Party.Connection & { playerId?: string }).playerId;
  }

  private findPlayerByConnection(connId: string): Player | undefined {
    for (const conn of this.party.getConnections()) {
      if (conn.id === connId) {
        const playerId = this.getPlayerId(conn);
        if (playerId) {
          return this.room.players[playerId];
        }
      }
    }
    return undefined;
  }

  private assignNewHost() {
    // Find first connected player
    for (const player of Object.values(this.room.players)) {
      if (player.isConnected && player.id !== this.room.hostId) {
        this.room.hostId = player.id;
        player.isHost = true;

        // Update old host
        const oldHost = Object.values(this.room.players).find(
          (p) => p.isHost && p.id !== player.id
        );
        if (oldHost) {
          oldHost.isHost = false;
        }

        // Broadcast host change
        this.broadcast({
          type: 'HOST_CHANGED',
          payload: { newHostId: player.id },
        });

        return;
      }
    }
  }

  // ============ Alarm & Cleanup Helpers ============

  private async scheduleAlarm(intent: AlarmIntent) {
    // Add to pending intents
    this.alarmState.pendingIntents.push(intent);

    // Find the earliest scheduled time
    const earliestTime = Math.min(
      ...this.alarmState.pendingIntents.map((i) => i.scheduledFor)
    );

    // Only reschedule if this is earlier than current alarm
    if (!this.alarmState.nextAlarmAt || earliestTime < this.alarmState.nextAlarmAt) {
      this.alarmState.nextAlarmAt = earliestTime;
      await this.party.storage.setAlarm(earliestTime);
    }
  }

  private cancelAlarmIntent(type: AlarmIntent['type']) {
    // Remove all intents of the specified type
    this.alarmState.pendingIntents = this.alarmState.pendingIntents.filter(
      (intent) => intent.type !== type
    );
  }

  private processPlayerCleanup() {
    const now = Date.now();

    // Find players who are still disconnected past grace period
    const playersToRemove = Object.values(this.room.players).filter(
      (p) => !p.isConnected && now - p.lastSeen >= RECONNECT_GRACE_PERIOD_MS
    );

    for (const player of playersToRemove) {
      this.removePlayer(player.id);
    }

    // If there are still disconnected players (but within grace period),
    // schedule another cleanup check
    const stillDisconnected = Object.values(this.room.players).filter(
      (p) => !p.isConnected
    );
    if (stillDisconnected.length > 0) {
      this.scheduleAlarm({
        type: 'player_cleanup',
        scheduledFor: now + CLEANUP_CHECK_INTERVAL_MS,
      });
    }
  }

  private removePlayer(playerId: string) {
    const player = this.room.players[playerId];
    if (!player) return;

    // Remove from team array if on a team
    if (player.team) {
      const teamArray = this.room.teams[player.team];
      const index = teamArray.indexOf(playerId);
      if (index > -1) {
        teamArray.splice(index, 1);

        // Adjust clueGiverIndex if game is active
        if (this.game) {
          const currentIndex = this.game.clueGiverIndex[player.team];
          if (index < currentIndex) {
            // Removed player was before current index, decrement
            this.game.clueGiverIndex[player.team] = Math.max(0, currentIndex - 1);
          } else if (teamArray.length > 0 && currentIndex >= teamArray.length) {
            // Index is now out of bounds, wrap it
            this.game.clueGiverIndex[player.team] = currentIndex % teamArray.length;
          }
        }
      }

      // Handle empty team during gameplay
      if (teamArray.length === 0 && this.room.status === 'playing') {
        this.handleEmptyTeam(player.team);
        return; // Don't continue with normal removal, game is ending
      }
    }

    // Remove from players record
    delete this.room.players[playerId];

    // If removed player was host, assign new host
    if (playerId === this.room.hostId) {
      this.assignNewHost();
    }

    // Broadcast removal
    this.broadcast({
      type: 'PLAYER_REMOVED',
      payload: { playerId, reason: 'disconnect_timeout' },
    });
  }

  private handleEmptyTeam(emptyTeam: Team) {
    // End game with forfeit - the other team wins
    const winner: Team = emptyTeam === 'A' ? 'B' : 'A';
    this.room.status = 'finished';

    // Clear turn timer
    if (this.turnTimer) {
      clearTimeout(this.turnTimer);
      this.turnTimer = null;
    }

    // Clear pending alarms
    this.alarmState.pendingIntents = [];
    this.alarmState.nextAlarmAt = null;

    this.broadcast({
      type: 'GAME_OVER',
      payload: {
        winner,
        finalScores: this.game?.scores || { A: 0, B: 0 },
        reason: 'team_forfeit',
      },
    });
  }
}
