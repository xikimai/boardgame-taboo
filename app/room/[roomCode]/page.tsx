'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useRoom } from '@/lib/hooks/useRoom';
import { useTimer, formatTime } from '@/lib/hooks/useTimer';
import { useDebounceAction } from '@/lib/hooks/useDebounce';
import { TEAM_COLORS } from '@/lib/game';
import type { Team } from '@/types';

export default function RoomPage() {
  const params = useParams();
  const router = useRouter();
  const roomCode = params.roomCode as string;

  const [hasJoined, setHasJoined] = useState(false);

  const {
    room,
    game,
    currentPlayerId,
    currentCard,
    connectionStatus,
    error,
    buzzAlert,
    turnResult,
    gameOver,
    joinRoom,
    selectTeam,
    startGame,
    startTurn,
    cardCorrect,
    cardSkip,
    buzz,
    dismissBuzz,
    restartGame,
    clearBuzzAlert,
    clearTurnResult,
  } = useRoom(roomCode);

  // Join room on connect
  useEffect(() => {
    if (connectionStatus === 'connected' && !hasJoined) {
      const playerName = sessionStorage.getItem('playerName') || 'Player';
      joinRoom(playerName);
      setHasJoined(true);
    }
  }, [connectionStatus, hasJoined, joinRoom]);

  // Auto-dismiss buzz alert after 2 seconds
  useEffect(() => {
    if (buzzAlert) {
      const timer = setTimeout(clearBuzzAlert, 2000);
      return () => clearTimeout(timer);
    }
  }, [buzzAlert, clearBuzzAlert]);

  // Auto-clear turn result after 3 seconds
  useEffect(() => {
    if (turnResult) {
      const timer = setTimeout(clearTurnResult, 3000);
      return () => clearTimeout(timer);
    }
  }, [turnResult, clearTurnResult]);

  // Loading state
  if (connectionStatus === 'connecting' || !room) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-slate-100 dark:bg-slate-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-slate-400">Connecting to room...</p>
        </div>
      </main>
    );
  }

  // Error state
  if (error) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-slate-100 dark:bg-slate-900">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <button
            onClick={() => router.push('/')}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg"
          >
            Back to Home
          </button>
        </div>
      </main>
    );
  }

  const currentPlayer = currentPlayerId ? room.players[currentPlayerId] : null;
  const isHost = currentPlayer?.isHost || false;

  // Render based on room status
  if (room.status === 'lobby') {
    return (
      <LobbyView
        room={room}
        currentPlayerId={currentPlayerId}
        isHost={isHost}
        roomCode={roomCode}
        onSelectTeam={selectTeam}
        onStartGame={startGame}
      />
    );
  }

  if (room.status === 'finished' || gameOver) {
    return (
      <GameOverView
        gameOver={gameOver}
        room={room}
        isHost={isHost}
        onRestart={restartGame}
        onBackToHome={() => router.push('/')}
      />
    );
  }

  if (room.status === 'playing' && game) {
    return (
      <GameView
        room={room}
        game={game}
        currentPlayerId={currentPlayerId}
        currentCard={currentCard}
        buzzAlert={buzzAlert}
        turnResult={turnResult}
        onStartTurn={startTurn}
        onCardCorrect={cardCorrect}
        onCardSkip={cardSkip}
        onBuzz={buzz}
        onDismissBuzz={dismissBuzz}
      />
    );
  }

  return null;
}

// ============ Lobby View ============

interface LobbyViewProps {
  room: NonNullable<ReturnType<typeof useRoom>['room']>;
  currentPlayerId: string | null;
  isHost: boolean;
  roomCode: string;
  onSelectTeam: (team: Team) => void;
  onStartGame: () => void;
}

function LobbyView({
  room,
  currentPlayerId,
  isHost,
  roomCode,
  onSelectTeam,
  onStartGame,
}: LobbyViewProps) {
  const currentPlayer = currentPlayerId ? room.players[currentPlayerId] : null;
  const canStart = room.teams.A.length > 0 && room.teams.B.length > 0;

  const copyRoomCode = () => {
    navigator.clipboard.writeText(roomCode);
  };

  return (
    <main className="min-h-screen bg-slate-100 dark:bg-slate-900 p-4">
      <div className="max-w-2xl mx-auto">
        {/* Room Code Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2 text-slate-800 dark:text-slate-200">
            Game Lobby
          </h1>
          <div className="flex items-center justify-center gap-2">
            <span className="text-slate-600 dark:text-slate-400">Room Code:</span>
            <button
              onClick={copyRoomCode}
              className="text-2xl font-mono font-bold text-blue-500 hover:text-blue-600 tracking-widest"
              title="Click to copy"
            >
              {roomCode}
            </button>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Share this code with friends to join
          </p>
        </div>

        {/* Team Selection */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          {/* Team A */}
          <TeamPanel
            team="A"
            teamName={TEAM_COLORS.A.name}
            players={room.teams.A.map((id) => room.players[id]).filter(Boolean)}
            currentPlayerId={currentPlayerId}
            currentPlayerTeam={currentPlayer?.team}
            color={TEAM_COLORS.A.primary}
            bgColor={TEAM_COLORS.A.secondary}
            onJoin={() => onSelectTeam('A')}
          />

          {/* Team B */}
          <TeamPanel
            team="B"
            teamName={TEAM_COLORS.B.name}
            players={room.teams.B.map((id) => room.players[id]).filter(Boolean)}
            currentPlayerId={currentPlayerId}
            currentPlayerTeam={currentPlayer?.team}
            color={TEAM_COLORS.B.primary}
            bgColor={TEAM_COLORS.B.secondary}
            onJoin={() => onSelectTeam('B')}
          />
        </div>

        {/* Unassigned Players */}
        <div className="bg-white dark:bg-slate-800 rounded-xl p-4 mb-8">
          <h3 className="text-sm font-medium text-slate-500 mb-2">
            Waiting to join a team:
          </h3>
          <div className="flex flex-wrap gap-2">
            {Object.values(room.players)
              .filter((p) => !p.team)
              .map((player) => (
                <span
                  key={player.id}
                  className={`px-3 py-1 rounded-full text-sm ${
                    player.id === currentPlayerId
                      ? 'bg-blue-100 text-blue-700 font-medium'
                      : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {player.name}
                  {player.isHost && ' (Host)'}
                  {player.id === currentPlayerId && ' (You)'}
                </span>
              ))}
          </div>
        </div>

        {/* Start Game Button */}
        {isHost && (
          <button
            onClick={onStartGame}
            disabled={!canStart}
            className={`w-full py-4 rounded-xl font-bold text-lg transition-all ${
              canStart
                ? 'bg-green-500 hover:bg-green-600 text-white'
                : 'bg-slate-300 dark:bg-slate-700 text-slate-500 cursor-not-allowed'
            }`}
          >
            {canStart ? 'Start Game' : 'Each team needs at least 1 player'}
          </button>
        )}

        {!isHost && (
          <p className="text-center text-slate-500">
            Waiting for host to start the game...
          </p>
        )}
      </div>
    </main>
  );
}

// ============ Team Panel Component ============

interface TeamPanelProps {
  team: Team;
  teamName: string;
  players: NonNullable<ReturnType<typeof useRoom>['room']>['players'][string][];
  currentPlayerId: string | null;
  currentPlayerTeam: Team | null | undefined;
  color: string;
  bgColor: string;
  onJoin: () => void;
}

function TeamPanel({
  team,
  teamName,
  players,
  currentPlayerId,
  currentPlayerTeam,
  color,
  bgColor,
  onJoin,
}: TeamPanelProps) {
  const isOnThisTeam = currentPlayerTeam === team;

  return (
    <div
      className="rounded-xl p-4 border-2"
      style={{ borderColor: color, backgroundColor: bgColor }}
    >
      <h2 className="text-lg font-bold mb-3" style={{ color }}>
        {teamName}
      </h2>

      <div className="space-y-2 mb-4 min-h-[100px]">
        {players.map((player) => (
          <div
            key={player.id}
            className={`px-3 py-2 rounded-lg bg-white dark:bg-slate-800 text-sm flex items-center justify-between ${
              !player.isConnected ? 'opacity-50' : ''
            }`}
          >
            <span>
              {player.name}
              {player.isHost && ' (Host)'}
            </span>
            {player.id === currentPlayerId && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                You
              </span>
            )}
          </div>
        ))}
        {players.length === 0 && (
          <p className="text-sm text-slate-500 text-center py-4">No players yet</p>
        )}
      </div>

      {!isOnThisTeam && (
        <button
          onClick={onJoin}
          className="w-full py-2 rounded-lg text-white font-medium transition-opacity hover:opacity-90"
          style={{ backgroundColor: color }}
        >
          Join {teamName}
        </button>
      )}

      {isOnThisTeam && (
        <p className="text-center text-sm" style={{ color }}>
          You&apos;re on this team
        </p>
      )}
    </div>
  );
}

// ============ Game View ============

interface GameViewProps {
  room: NonNullable<ReturnType<typeof useRoom>['room']>;
  game: NonNullable<ReturnType<typeof useRoom>['game']>;
  currentPlayerId: string | null;
  currentCard: ReturnType<typeof useRoom>['currentCard'];
  buzzAlert: ReturnType<typeof useRoom>['buzzAlert'];
  turnResult: ReturnType<typeof useRoom>['turnResult'];
  onStartTurn: () => void;
  onCardCorrect: () => void;
  onCardSkip: () => void;
  onBuzz: () => void;
  onDismissBuzz: () => void;
}

function GameView({
  room,
  game,
  currentPlayerId,
  currentCard,
  buzzAlert,
  turnResult,
  onStartTurn,
  onCardCorrect,
  onCardSkip,
  onBuzz,
  onDismissBuzz,
}: GameViewProps) {
  const { timeLeft, timerClass } = useTimer(
    game.currentTurn.timerStartedAt,
    game.currentTurn.timerDuration,
    game.currentTurn.status
  );

  const currentPlayer = currentPlayerId ? room.players[currentPlayerId] : null;
  const isClueGiver = currentPlayerId === game.currentTurn.clueGiverId;
  const isGuesser =
    currentPlayer?.team === game.currentTurn.activeTeam && !isClueGiver;
  const isOpponent =
    currentPlayer?.team !== null &&
    currentPlayer?.team !== game.currentTurn.activeTeam;

  const clueGiver = room.players[game.currentTurn.clueGiverId];
  const activeTeamColor =
    game.currentTurn.activeTeam === 'A'
      ? TEAM_COLORS.A.primary
      : TEAM_COLORS.B.primary;

  return (
    <main className="min-h-screen bg-slate-100 dark:bg-slate-900 p-4">
      <div className="max-w-lg mx-auto">
        {/* Score Board */}
        <div className="flex justify-between items-center mb-4 bg-white dark:bg-slate-800 rounded-xl p-4">
          <div className="text-center">
            <p className="text-xs text-slate-500 uppercase">{TEAM_COLORS.A.name}</p>
            <p
              className="text-3xl font-bold"
              style={{ color: TEAM_COLORS.A.primary }}
            >
              {game.scores.A}
            </p>
          </div>

          <div className="text-center">
            <p className="text-sm text-slate-500">
              Round {game.currentRound} / {game.totalRounds}
            </p>
            <p
              className={`text-4xl font-mono font-bold ${timerClass}`}
            >
              {formatTime(timeLeft)}
            </p>
          </div>

          <div className="text-center">
            <p className="text-xs text-slate-500 uppercase">{TEAM_COLORS.B.name}</p>
            <p
              className="text-3xl font-bold"
              style={{ color: TEAM_COLORS.B.primary }}
            >
              {game.scores.B}
            </p>
          </div>
        </div>

        {/* Turn Info */}
        <div
          className="text-center mb-4 py-2 rounded-lg text-white"
          style={{ backgroundColor: activeTeamColor }}
        >
          <p className="text-sm opacity-90">
            {clueGiver?.name || 'Player'} is giving clues
          </p>
          <p className="font-medium">Turn Score: {game.currentTurn.turnScore}</p>
        </div>

        {/* Buzz Alert */}
        {buzzAlert && (
          <div className="bg-red-500 text-white text-center py-4 rounded-xl mb-4 animate-buzz">
            <p className="text-2xl font-bold">BUZZ!</p>
            <p>{buzzAlert.buzzerName} pressed the buzzer</p>
            {isClueGiver && (
              <button
                onClick={onDismissBuzz}
                className="mt-2 px-4 py-2 bg-white text-red-500 rounded-lg font-medium"
              >
                Accept (-1 point) & Continue
              </button>
            )}
          </div>
        )}

        {/* Turn Result */}
        {turnResult && (
          <div className="bg-slate-800 text-white text-center py-4 rounded-xl mb-4">
            <p className="text-lg font-bold">Turn Ended!</p>
            <p>
              {room.players[turnResult.clueGiverId]?.name} scored{' '}
              {turnResult.cardsCorrect} points
            </p>
          </div>
        )}

        {/* Main Content based on role */}
        {game.currentTurn.status === 'waiting' && isClueGiver && (
          <div className="bg-white dark:bg-slate-800 rounded-xl p-8 text-center">
            <p className="text-lg mb-4 text-slate-600 dark:text-slate-300">
              You&apos;re the clue giver!
            </p>
            <button
              onClick={onStartTurn}
              className="px-8 py-4 bg-green-500 hover:bg-green-600 text-white font-bold text-xl rounded-xl"
            >
              Start Turn
            </button>
          </div>
        )}

        {game.currentTurn.status === 'waiting' && !isClueGiver && (
          <div className="bg-white dark:bg-slate-800 rounded-xl p-8 text-center">
            <p className="text-lg text-slate-600 dark:text-slate-300">
              Waiting for {clueGiver?.name} to start their turn...
            </p>
          </div>
        )}

        {(game.currentTurn.status === 'active' ||
          game.currentTurn.status === 'buzzing') && (
          <>
            {/* Clue Giver View */}
            {isClueGiver && currentCard && (
              <ClueGiverCard
                card={currentCard}
                onCorrect={onCardCorrect}
                onSkip={onCardSkip}
                disabled={game.currentTurn.status === 'buzzing'}
              />
            )}

            {/* Guesser View */}
            {isGuesser && (
              <div className="bg-white dark:bg-slate-800 rounded-xl p-8 text-center">
                <p className="text-2xl mb-4">Your turn to guess!</p>
                <p className="text-slate-500">
                  Listen to {clueGiver?.name}&apos;s clues
                </p>
              </div>
            )}

            {/* Opponent View */}
            {isOpponent && currentCard && (
              <OpponentCard card={currentCard} onBuzz={onBuzz} />
            )}
          </>
        )}
      </div>
    </main>
  );
}

// ============ Clue Giver Card ============

interface ClueGiverCardProps {
  card: NonNullable<ReturnType<typeof useRoom>['currentCard']>;
  onCorrect: () => void;
  onSkip: () => void;
  disabled: boolean;
}

function ClueGiverCard({ card, onCorrect, onSkip, disabled }: ClueGiverCardProps) {
  const [handleCorrect, isCorrectDisabled] = useDebounceAction(onCorrect);
  const [handleSkip, isSkipDisabled] = useDebounceAction(onSkip);

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl overflow-hidden shadow-lg">
      {/* Target Word */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-500 p-6 text-center">
        <p className="text-3xl font-bold text-white">{card.targetWord}</p>
      </div>

      {/* Taboo Words */}
      <div className="p-4 bg-red-50 dark:bg-red-900/20">
        <p className="text-xs text-red-500 font-medium uppercase mb-2 text-center">
          Don&apos;t Say:
        </p>
        <div className="space-y-1">
          {card.tabooWords.map((word, index) => (
            <p
              key={index}
              className="text-center text-lg font-medium text-red-600 dark:text-red-400"
            >
              {word}
            </p>
          ))}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="p-4 flex gap-4">
        <button
          onClick={handleCorrect}
          disabled={disabled || isCorrectDisabled}
          className="flex-1 py-4 bg-green-500 hover:bg-green-600 disabled:bg-green-300 text-white font-bold text-lg rounded-xl transition-colors"
        >
          Got It!
        </button>
        <button
          onClick={handleSkip}
          disabled={disabled || isSkipDisabled}
          className="flex-1 py-4 bg-yellow-500 hover:bg-yellow-600 disabled:bg-yellow-300 text-white font-bold text-lg rounded-xl transition-colors"
        >
          Skip
        </button>
      </div>
    </div>
  );
}

// ============ Opponent Card ============

interface OpponentCardProps {
  card: NonNullable<ReturnType<typeof useRoom>['currentCard']>;
  onBuzz: () => void;
}

function OpponentCard({ card, onBuzz }: OpponentCardProps) {
  const [handleBuzz, isBuzzDisabled] = useDebounceAction(onBuzz);

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl overflow-hidden shadow-lg">
      {/* Target Word */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-500 p-6 text-center">
        <p className="text-3xl font-bold text-white">{card.targetWord}</p>
      </div>

      {/* Taboo Words */}
      <div className="p-4 bg-red-50 dark:bg-red-900/20">
        <p className="text-xs text-red-500 font-medium uppercase mb-2 text-center">
          Taboo Words:
        </p>
        <div className="space-y-1">
          {card.tabooWords.map((word, index) => (
            <p
              key={index}
              className="text-center text-lg font-medium text-red-600 dark:text-red-400"
            >
              {word}
            </p>
          ))}
        </div>
      </div>

      {/* Buzz Button */}
      <div className="p-4">
        <button
          onClick={handleBuzz}
          disabled={isBuzzDisabled}
          className="w-full py-6 bg-red-500 hover:bg-red-600 disabled:bg-red-300 active:scale-95 text-white font-bold text-2xl rounded-xl transition-all"
        >
          BUZZ!
        </button>
        <p className="text-center text-sm text-slate-500 mt-2">
          Press if they say a taboo word
        </p>
      </div>
    </div>
  );
}

// ============ Game Over View ============

interface GameOverViewProps {
  gameOver: ReturnType<typeof useRoom>['gameOver'];
  room: NonNullable<ReturnType<typeof useRoom>['room']>;
  isHost: boolean;
  onRestart: () => void;
  onBackToHome: () => void;
}

function GameOverView({
  gameOver,
  room,
  isHost,
  onRestart,
  onBackToHome,
}: GameOverViewProps) {
  if (!gameOver) return null;

  const { winner, finalScores } = gameOver;

  let winnerText = '';
  let winnerColor = '';

  if (winner === 'tie') {
    winnerText = "It's a Tie!";
    winnerColor = '#6B7280';
  } else if (winner === 'A') {
    winnerText = `${TEAM_COLORS.A.name} Wins!`;
    winnerColor = TEAM_COLORS.A.primary;
  } else {
    winnerText = `${TEAM_COLORS.B.name} Wins!`;
    winnerColor = TEAM_COLORS.B.primary;
  }

  return (
    <main className="min-h-screen bg-slate-100 dark:bg-slate-900 p-4 flex items-center justify-center">
      <div className="max-w-md w-full bg-white dark:bg-slate-800 rounded-xl p-8 text-center shadow-lg">
        <h1
          className="text-4xl font-bold mb-8"
          style={{ color: winnerColor }}
        >
          {winnerText}
        </h1>

        {/* Final Scores */}
        <div className="flex justify-around mb-8">
          <div>
            <p className="text-sm text-slate-500 uppercase">{TEAM_COLORS.A.name}</p>
            <p
              className="text-5xl font-bold"
              style={{ color: TEAM_COLORS.A.primary }}
            >
              {finalScores.A}
            </p>
          </div>
          <div className="text-3xl text-slate-400 self-center">vs</div>
          <div>
            <p className="text-sm text-slate-500 uppercase">{TEAM_COLORS.B.name}</p>
            <p
              className="text-5xl font-bold"
              style={{ color: TEAM_COLORS.B.primary }}
            >
              {finalScores.B}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          {isHost && (
            <button
              onClick={onRestart}
              className="w-full py-3 bg-green-500 hover:bg-green-600 text-white font-bold rounded-xl"
            >
              Play Again
            </button>
          )}
          <button
            onClick={onBackToHome}
            className="w-full py-3 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 font-medium rounded-xl"
          >
            Back to Home
          </button>
        </div>

        {!isHost && (
          <p className="text-slate-500 mt-4">
            Waiting for host to start a new game...
          </p>
        )}
      </div>
    </main>
  );
}
