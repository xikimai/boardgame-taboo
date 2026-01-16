'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import gsap from 'gsap';
import { useRoom } from '@/lib/hooks/useRoom';
import { useTimer, formatTime } from '@/lib/hooks/useTimer';
import { useDebounceAction } from '@/lib/hooks/useDebounce';
import { useSounds, type UseSoundsReturn } from '@/lib/sounds';
import { TEAM_COLORS, isValidRoomCode } from '@/lib/game';
import { getStyleFromSeed, type DiceBearStyle } from '@/lib/avatars';
import {
  fadeIn,
  fadeInUp,
  slideInFromLeft,
  slideInFromRight,
  scaleIn,
  popIn,
  pulsingButton,
} from '@/lib/animations/variants';
import { AnimatedButton } from '@/components/animations';
import { AnimatedCard, ScoreCounter, BuzzOverlay, PlayerAvatar } from '@/components/game';
import { fireWinConfetti, fireTieConfetti } from '@/lib/confetti';
import { captureAndShare } from '@/lib/screenshot';
import type { Team } from '@/types';

export default function RoomPage() {
  const params = useParams();
  const router = useRouter();

  // Safely extract roomCode - handle undefined during SSR/hydration
  const roomCodeParam = params?.roomCode;
  const roomCode = typeof roomCodeParam === 'string' ? roomCodeParam : '';

  const [hasJoined, setHasJoined] = useState(false);
  const [needsName, setNeedsName] = useState(false);
  const sounds = useSounds();

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
    updateSettings,
    startGame,
    startTurn,
    cardCorrect,
    cardSkip,
    buzz,
    undoBuzz,
    dismissBuzz,
    restartGame,
    endGame,
    clearTurnResult,
  } = useRoom(roomCode);

  useEffect(() => {
    if (connectionStatus === 'connected' && !hasJoined && !needsName) {
      const storedName = sessionStorage.getItem('playerName');
      if (storedName) {
        joinRoom(storedName);
        setHasJoined(true);
      } else {
        // Direct URL visitor without a name - show the join modal
        setNeedsName(true);
      }
    }
  }, [connectionStatus, hasJoined, needsName, joinRoom]);

  const handleJoinWithName = (name: string) => {
    sessionStorage.setItem('playerName', name);
    sessionStorage.setItem('isHost', 'false');
    joinRoom(name);
    setHasJoined(true);
    setNeedsName(false);
  };

  useEffect(() => {
    if (turnResult) {
      const timer = setTimeout(clearTurnResult, 3000);
      return () => clearTimeout(timer);
    }
  }, [turnResult, clearTurnResult]);

  // Early return while roomCode is loading/invalid (during SSR/hydration)
  if (!roomCode || !isValidRoomCode(roomCode)) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-rose-50 via-amber-50 to-sky-50">
        <div className="text-center">
          <div className="rounded-full h-12 w-12 border-b-2 border-violet-500 mx-auto mb-4 animate-spin" />
          <p className="text-slate-600">Loading room...</p>
        </div>
      </main>
    );
  }

  // Loading state with animation
  if (connectionStatus === 'connecting' || !room) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-rose-50 via-amber-50 to-sky-50">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            className="rounded-full h-12 w-12 border-b-2 border-violet-500 mx-auto mb-4"
          />
          <p className="text-slate-600">Connecting to room...</p>
        </motion.div>
      </main>
    );
  }

  // Error state
  if (error) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-rose-50 via-amber-50 to-sky-50">
        <motion.div
          variants={fadeInUp}
          initial="hidden"
          animate="visible"
          className="text-center"
        >
          <motion.p
            animate={{ x: [0, -5, 5, -5, 5, 0] }}
            transition={{ duration: 0.4 }}
            className="text-rose-500 mb-4"
          >
            {error}
          </motion.p>
          <AnimatedButton onClick={() => router.push('/')} variant="primary">
            Back to Home
          </AnimatedButton>
        </motion.div>
      </main>
    );
  }

  // Show name entry modal for direct URL visitors
  if (needsName) {
    return (
      <JoinModal
        roomCode={roomCode}
        onJoin={handleJoinWithName}
        onCancel={() => router.push('/')}
      />
    );
  }

  const currentPlayer = currentPlayerId ? room.players[currentPlayerId] : null;
  const isHost = currentPlayer?.isHost || false;
  const avatarStyle = getStyleFromSeed(roomCode);

  if (room.status === 'lobby') {
    return (
      <LobbyView
        room={room}
        currentPlayerId={currentPlayerId}
        isHost={isHost}
        roomCode={roomCode}
        avatarStyle={avatarStyle}
        onSelectTeam={selectTeam}
        onUpdateSettings={updateSettings}
        onStartGame={startGame}
        sounds={sounds}
      />
    );
  }

  if (room.status === 'finished' || gameOver) {
    return (
      <GameOverView
        gameOver={gameOver}
        room={room}
        isHost={isHost}
        avatarStyle={avatarStyle}
        onRestart={restartGame}
        onBackToHome={() => router.push('/')}
        sounds={sounds}
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
        avatarStyle={avatarStyle}
        isHost={isHost}
        onStartTurn={startTurn}
        onCardCorrect={cardCorrect}
        onCardSkip={cardSkip}
        onBuzz={buzz}
        onUndoBuzz={undoBuzz}
        onDismissBuzz={dismissBuzz}
        onEndGame={endGame}
        sounds={sounds}
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
  avatarStyle: DiceBearStyle;
  onSelectTeam: (team: Team) => void;
  onUpdateSettings: (settings: { maxRounds?: number; turnDuration?: number }) => void;
  onStartGame: () => void;
  sounds: UseSoundsReturn;
}

function LobbyView({
  room,
  currentPlayerId,
  isHost,
  roomCode,
  avatarStyle,
  onSelectTeam,
  onUpdateSettings,
  onStartGame,
  sounds,
}: LobbyViewProps) {
  const currentPlayer = currentPlayerId ? room.players[currentPlayerId] : null;
  const canStart = room.teams.A.length > 0 && room.teams.B.length > 0;
  const [copied, setCopied] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const prevTeamACount = useRef(room.teams.A.length);
  const prevTeamBCount = useRef(room.teams.B.length);

  // Play join sound when players join teams
  useEffect(() => {
    const newACount = room.teams.A.length;
    const newBCount = room.teams.B.length;
    if (newACount > prevTeamACount.current || newBCount > prevTeamBCount.current) {
      sounds.playJoin();
    }
    prevTeamACount.current = newACount;
    prevTeamBCount.current = newBCount;
  }, [room.teams.A.length, room.teams.B.length, sounds]);

  const handleStartGame = () => {
    sounds.playStart();
    onStartGame();
  };

  const copyRoomCode = () => {
    navigator.clipboard.writeText(roomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareLink = async () => {
    const url = `${window.location.origin}/join/${roomCode}`;
    try {
      await navigator.clipboard.writeText(url);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    } catch {
      // If clipboard fails, copy room code instead
      copyRoomCode();
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-rose-50 via-amber-50 to-sky-50 p-4">
      <div className="max-w-2xl mx-auto">
        {/* Room Code Header */}
        <motion.div
          variants={fadeInUp}
          initial="hidden"
          animate="visible"
          className="text-center mb-8"
        >
          <h1 className="text-3xl font-bold mb-2 text-slate-800">
            Game Lobby
          </h1>
          <div className="flex items-center justify-center gap-2">
            <span className="text-slate-600 dark:text-slate-400">Room Code:</span>
            <motion.button
              onClick={copyRoomCode}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="text-2xl font-mono font-bold text-blue-500 hover:text-blue-600 tracking-widest relative"
              title="Click to copy"
            >
              {roomCode}
              <AnimatePresence>
                {copied && (
                  <motion.span
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-xs text-green-600 font-medium z-10"
                  >
                    Copied!
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>
          </div>
          {/* Share Link Button */}
          <motion.button
            onClick={shareLink}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg shadow-md transition-colors relative"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
              />
            </svg>
            Share Invite Link
            <AnimatePresence>
              {linkCopied && (
                <motion.span
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="absolute -bottom-7 left-1/2 -translate-x-1/2 text-xs text-green-500 font-normal whitespace-nowrap"
                >
                  Link copied!
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>
          <p className="text-sm text-slate-500 mt-3">
            Or share the room code above
          </p>
        </motion.div>

        {/* Game Settings (Host Only) */}
        {isHost && (
          <motion.div
            variants={fadeInUp}
            initial="hidden"
            animate="visible"
            transition={{ delay: 0.2 }}
            className="bg-white/80 backdrop-blur-sm rounded-xl p-4 mb-8 shadow-lg shadow-rose-100/50"
          >
            <h3 className="text-lg font-bold mb-4 text-slate-800">
              Game Settings
            </h3>

            <div className="space-y-4">
              {/* Rounds selector */}
              <div>
                <label className="block text-sm text-slate-600 mb-2">
                  Number of Rounds
                </label>
                <div className="flex gap-2">
                  {[4, 6, 8, 10].map((n) => (
                    <button
                      key={n}
                      onClick={() => onUpdateSettings({ maxRounds: n })}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                        room.settings.maxRounds === n
                          ? 'bg-violet-500 text-white shadow-md shadow-violet-200'
                          : 'bg-white/60 text-slate-600 hover:bg-white hover:shadow-sm'
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>

              {/* Turn duration selector */}
              <div>
                <label className="block text-sm text-slate-600 mb-2">
                  Turn Duration (seconds)
                </label>
                <div className="flex gap-2">
                  {[30, 45, 60, 90].map((s) => (
                    <button
                      key={s}
                      onClick={() => onUpdateSettings({ turnDuration: s })}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                        room.settings.turnDuration === s
                          ? 'bg-violet-500 text-white shadow-md shadow-violet-200'
                          : 'bg-white/60 text-slate-600 hover:bg-white hover:shadow-sm'
                      }`}
                    >
                      {s}s
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Show current settings for non-hosts */}
        {!isHost && (
          <motion.div
            variants={fadeInUp}
            initial="hidden"
            animate="visible"
            transition={{ delay: 0.2 }}
            className="bg-white/60 backdrop-blur-sm rounded-xl p-3 mb-6 text-center shadow-sm"
          >
            <p className="text-sm text-slate-600">
              {room.settings.maxRounds} rounds • {room.settings.turnDuration}s per turn
            </p>
          </motion.div>
        )}

        {/* Team Selection */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <motion.div
            variants={slideInFromLeft}
            initial="hidden"
            animate="visible"
          >
            <TeamPanel
              team="A"
              teamName={TEAM_COLORS.A.name}
              players={room.teams.A.map((id) => room.players[id]).filter(Boolean)}
              currentPlayerId={currentPlayerId}
              currentPlayerTeam={currentPlayer?.team}
              color={TEAM_COLORS.A.primary}
              bgColor={TEAM_COLORS.A.secondary}
              avatarStyle={avatarStyle}
              onJoin={() => onSelectTeam('A')}
            />
          </motion.div>

          <motion.div
            variants={slideInFromRight}
            initial="hidden"
            animate="visible"
          >
            <TeamPanel
              team="B"
              teamName={TEAM_COLORS.B.name}
              players={room.teams.B.map((id) => room.players[id]).filter(Boolean)}
              currentPlayerId={currentPlayerId}
              currentPlayerTeam={currentPlayer?.team}
              color={TEAM_COLORS.B.primary}
              bgColor={TEAM_COLORS.B.secondary}
              avatarStyle={avatarStyle}
              onJoin={() => onSelectTeam('B')}
            />
          </motion.div>
        </div>

        {/* Unassigned Players */}
        <motion.div
          variants={fadeInUp}
          initial="hidden"
          animate="visible"
          transition={{ delay: 0.3 }}
          className="bg-white/80 backdrop-blur-sm rounded-xl p-4 mb-8 shadow-lg shadow-sky-100/50"
        >
          <h3 className="text-sm font-medium text-slate-500 mb-2">
            Waiting to join a team:
          </h3>
          <div className="flex flex-wrap gap-2 min-h-[32px]">
            <AnimatePresence mode="popLayout">
              {Object.values(room.players)
                .filter((p) => !p.team)
                .map((player) => (
                  <motion.span
                    key={player.id}
                    layout
                    variants={popIn}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm ${
                      player.id === currentPlayerId
                        ? 'bg-violet-100 text-violet-700 font-medium'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    <PlayerAvatar playerId={player.id} size="sm" style={avatarStyle} />
                    {player.name}
                    {player.isHost && ' (Host)'}
                    {player.id === currentPlayerId && ' (You)'}
                  </motion.span>
                ))}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Start Game Button */}
        <motion.div
          variants={fadeInUp}
          initial="hidden"
          animate="visible"
          transition={{ delay: 0.4 }}
        >
          {isHost && (
            <motion.div
              variants={pulsingButton}
              animate={canStart ? 'pulse' : 'idle'}
            >
              <AnimatedButton
                onClick={handleStartGame}
                disabled={!canStart}
                variant="success"
                size="lg"
                fullWidth
              >
                {canStart ? 'Start Game' : 'Each team needs at least 1 player'}
              </AnimatedButton>
            </motion.div>
          )}

          {!isHost && (
            <p className="text-center text-slate-500">
              Waiting for host to start the game...
            </p>
          )}
        </motion.div>
      </div>
      <SoundToggle sounds={sounds} />
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
  avatarStyle: DiceBearStyle;
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
  avatarStyle,
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
        <AnimatePresence mode="popLayout">
          {players.map((player) => (
            <motion.div
              key={player.id}
              layout
              variants={popIn}
              initial="hidden"
              animate="visible"
              exit="exit"
              className={`px-3 py-2 rounded-lg bg-white/90 backdrop-blur-sm text-sm flex items-center justify-between shadow-sm ${
                !player.isConnected ? 'opacity-50' : ''
              }`}
            >
              <div className="flex items-center gap-2">
                <PlayerAvatar playerId={player.id} size="md" style={avatarStyle} />
                <span className="text-slate-700">
                  {player.name}
                  {player.isHost && ' (Host)'}
                </span>
              </div>
              {player.id === currentPlayerId && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                  You
                </span>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
        {players.length === 0 && (
          <p className="text-sm text-slate-500 text-center py-4">No players yet</p>
        )}
      </div>

      {!isOnThisTeam && (
        <AnimatedButton
          onClick={onJoin}
          fullWidth
          className="text-white"
          style={{ backgroundColor: color }}
        >
          Join {teamName}
        </AnimatedButton>
      )}

      {isOnThisTeam && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center text-sm font-medium"
          style={{ color }}
        >
          You&apos;re on this team
        </motion.p>
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
  avatarStyle: DiceBearStyle;
  isHost: boolean;
  onStartTurn: () => void;
  onCardCorrect: () => void;
  onCardSkip: () => void;
  onBuzz: () => void;
  onUndoBuzz: () => void;
  onDismissBuzz: () => void;
  onEndGame: () => void;
  sounds: UseSoundsReturn;
}

function GameView({
  room,
  game,
  currentPlayerId,
  currentCard,
  buzzAlert,
  turnResult,
  avatarStyle,
  isHost,
  onStartTurn,
  onCardCorrect,
  onCardSkip,
  onBuzz,
  onUndoBuzz,
  onDismissBuzz,
  onEndGame,
  sounds,
}: GameViewProps) {
  const { timeLeft, timerClass } = useTimer(
    game.currentTurn.timerStartedAt,
    game.currentTurn.timerDuration,
    game.currentTurn.status,
    game.currentTurn.remainingTimeWhenPaused
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

  // Get player's team color
  const playerTeamColor = currentPlayer?.team === 'A' ? TEAM_COLORS.A : TEAM_COLORS.B;

  // Timer urgency animation - progressive intensity
  const isModerate = timeLeft <= 20 && timeLeft > 10;
  const isUrgent = timeLeft <= 10 && timeLeft > 5;
  const isCritical = timeLeft <= 5;

  // Track previous timeLeft for tick sound and shake trigger
  const prevTimeLeft = useRef(timeLeft);
  const timerRef = useRef<HTMLDivElement>(null);

  // GSAP shake effect when entering critical threshold
  useEffect(() => {
    if (
      game.currentTurn.status === 'active' &&
      timeLeft === 5 &&
      prevTimeLeft.current === 6 &&
      timerRef.current
    ) {
      // Shake the timer with elastic feel
      gsap.to(timerRef.current, {
        x: () => gsap.utils.random(-4, 4),
        duration: 0.05,
        repeat: 8,
        yoyo: true,
        ease: 'none',
        onComplete: () => {
          if (timerRef.current) {
            gsap.set(timerRef.current, { x: 0 });
          }
        },
      });
    }
  }, [timeLeft, game.currentTurn.status]);

  // Play tick sound when timer <= 5 seconds and decrementing
  useEffect(() => {
    if (
      game.currentTurn.status === 'active' &&
      timeLeft <= 5 &&
      timeLeft > 0 &&
      timeLeft < prevTimeLeft.current
    ) {
      sounds.playTick();
    }
    prevTimeLeft.current = timeLeft;
  }, [timeLeft, game.currentTurn.status, sounds]);

  // Play buzz sound when buzzAlert appears
  useEffect(() => {
    if (buzzAlert) {
      sounds.playBuzz();
    }
  }, [buzzAlert, sounds]);

  const handleStartTurn = () => {
    sounds.playStart();
    onStartTurn();
  };

  const handleCorrect = () => {
    sounds.playCorrect();
    onCardCorrect();
  };

  const handleSkip = () => {
    sounds.playSkip();
    onCardSkip();
  };

  // Animated background colors based on active team - pastel versions
  const bgGradient1 = game.currentTurn.activeTeam === 'A'
    ? 'linear-gradient(135deg, #dbeafe 0%, #f0f9ff 50%, #e0f2fe 100%)'  // Pastel blue
    : 'linear-gradient(135deg, #ffe4e6 0%, #fff1f2 50%, #fecdd3 100%)'; // Pastel rose
  const bgGradient2 = game.currentTurn.activeTeam === 'A'
    ? 'linear-gradient(135deg, #e0f2fe 0%, #dbeafe 50%, #bfdbfe 100%)'  // Pastel blue shift
    : 'linear-gradient(135deg, #fecdd3 0%, #ffe4e6 50%, #fda4af 100%)'; // Pastel rose shift

  return (
    <motion.main
      className="min-h-screen p-4 relative overflow-hidden"
      animate={{
        background: [bgGradient1, bgGradient2],
      }}
      transition={{ duration: 8, repeat: Infinity, repeatType: 'reverse' }}
    >
      {/* Floating shapes for visual interest - softer on pastel background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute w-64 h-64 rounded-full opacity-20"
          style={{ backgroundColor: activeTeamColor, top: '10%', left: '-5%' }}
          animate={{
            x: [0, 100, 0],
            y: [0, 50, 0],
            scale: [1, 1.2, 1],
          }}
          transition={{ duration: 20, repeat: Infinity }}
        />
        <motion.div
          className="absolute w-48 h-48 rounded-full opacity-20"
          style={{ backgroundColor: activeTeamColor, bottom: '15%', right: '-5%' }}
          animate={{
            x: [0, -80, 0],
            y: [0, -40, 0],
            scale: [1, 1.1, 1],
          }}
          transition={{ duration: 15, repeat: Infinity }}
        />
      </div>

      <div className="relative z-10 max-w-lg mx-auto">
        {/* Player Identity Badge */}
        {currentPlayer && currentPlayer.team && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 text-center"
          >
            <span
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium text-white shadow-lg"
              style={{ backgroundColor: playerTeamColor.primary }}
            >
              <PlayerAvatar playerId={currentPlayerId!} size="sm" style={avatarStyle} />
              You&apos;re on {playerTeamColor.name}
              {isClueGiver && ' • Clue Giver'}
              {isGuesser && ' • Guessing'}
              {isOpponent && ' • Watching'}
            </span>
          </motion.div>
        )}
        {/* Score Board */}
        <motion.div
          variants={fadeInUp}
          initial="hidden"
          animate="visible"
          className="flex justify-between items-center mb-4 bg-white/90 backdrop-blur-sm rounded-xl p-4 shadow-lg"
        >
          <div className="text-center">
            <p className="text-xs text-slate-500 uppercase">{TEAM_COLORS.A.name}</p>
            <ScoreCounter score={game.scores.A} color={TEAM_COLORS.A.primary} />
          </div>

          <div className="text-center">
            <p className="text-sm text-slate-500">
              Round {game.currentRound} / {game.totalRounds}
            </p>
            <motion.div
              ref={timerRef}
              animate={
                isCritical
                  ? { scale: [1, 1.1, 1] }
                  : isUrgent
                    ? { scale: [1, 1.05, 1] }
                    : isModerate
                      ? { scale: [1, 1.02, 1] }
                      : {}
              }
              transition={
                isCritical
                  ? { duration: 0.3, repeat: Infinity }
                  : isUrgent
                    ? { duration: 0.5, repeat: Infinity }
                    : isModerate
                      ? { duration: 0.8, repeat: Infinity }
                      : {}
              }
              className={`text-4xl font-mono font-bold tabular-nums ${
                isCritical
                  ? 'text-rose-600'
                  : isUrgent
                    ? 'text-rose-500'
                    : isModerate
                      ? 'text-amber-500'
                      : 'text-slate-700'
              }`}
            >
              {formatTime(timeLeft)}
            </motion.div>
          </div>

          <div className="text-center">
            <p className="text-xs text-slate-500 uppercase">{TEAM_COLORS.B.name}</p>
            <ScoreCounter score={game.scores.B} color={TEAM_COLORS.B.primary} />
          </div>
        </motion.div>

        {/* Turn Info */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-4 py-3 rounded-lg text-white"
          style={{ backgroundColor: activeTeamColor }}
        >
          <p className="text-xs uppercase tracking-wide opacity-75 mb-1">
            {game.currentTurn.activeTeam === 'A' ? TEAM_COLORS.A.name : TEAM_COLORS.B.name}&apos;s Turn
          </p>
          <div className="flex items-center justify-center gap-2 mb-1">
            {clueGiver && (
              <PlayerAvatar playerId={clueGiver.id} size="md" style={avatarStyle} className="border-2 border-white/30" />
            )}
            <p className="text-sm opacity-90">
              {clueGiver?.name || 'Player'} is giving clues
            </p>
          </div>
          <p className="font-medium">Turn Score: {game.currentTurn.turnScore}</p>
        </motion.div>

        {/* Buzz Overlay */}
        <BuzzOverlay
          isVisible={!!buzzAlert}
          buzzerName={buzzAlert?.buzzerName}
          buzzedBy={buzzAlert?.buzzedBy}
          currentPlayerId={currentPlayerId}
          onDismiss={onDismissBuzz}
          onUndoBuzz={onUndoBuzz}
          showDismissButton={isClueGiver}
        />

        {/* Critical Timer Vignette - creates dramatic edge darkening */}
        <AnimatePresence>
          {isCritical && game.currentTurn.status === 'active' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: [0.15, 0.25, 0.15] }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5, repeat: Infinity }}
              className="fixed inset-0 pointer-events-none z-40"
              style={{
                background: 'radial-gradient(circle at center, transparent 30%, rgba(244, 63, 94, 0.2) 100%)',
              }}
            />
          )}
        </AnimatePresence>

        {/* Turn Result */}
        <AnimatePresence>
          {turnResult && (
            <motion.div
              variants={scaleIn}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="bg-slate-800 text-white text-center py-4 rounded-xl mb-4"
            >
              <p className="text-lg font-bold">Turn Ended!</p>
              <p>
                {room.players[turnResult.clueGiverId]?.name} scored{' '}
                {turnResult.cardsCorrect} points
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Content based on role */}
        {game.currentTurn.status === 'waiting' && isClueGiver && (
          <motion.div
            variants={scaleIn}
            initial="hidden"
            animate="visible"
            className="bg-white/90 backdrop-blur-sm rounded-xl p-8 text-center shadow-lg"
          >
            <p className="text-lg mb-4 text-slate-600">
              You&apos;re the clue giver!
            </p>
            <motion.div
              variants={pulsingButton}
              animate="pulse"
            >
              <AnimatedButton onClick={handleStartTurn} variant="success" size="lg">
                Start Turn
              </AnimatedButton>
            </motion.div>
          </motion.div>
        )}

        {game.currentTurn.status === 'waiting' && !isClueGiver && (
          <motion.div
            variants={fadeIn}
            initial="hidden"
            animate="visible"
            className="bg-white/90 backdrop-blur-sm rounded-xl p-8 text-center shadow-lg"
          >
            <motion.div
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <p className="text-lg text-slate-600">
                Waiting for {clueGiver?.name} to start their turn...
              </p>
            </motion.div>
          </motion.div>
        )}

        {(game.currentTurn.status === 'active' ||
          game.currentTurn.status === 'buzzing') && (
          <>
            {/* Clue Giver View */}
            {isClueGiver && currentCard && (
              <AnimatedCard cardKey={currentCard.targetWord}>
                <ClueGiverCard
                  card={currentCard}
                  onCorrect={handleCorrect}
                  onSkip={handleSkip}
                  disabled={game.currentTurn.status === 'buzzing'}
                />
              </AnimatedCard>
            )}

            {/* Guesser View */}
            {isGuesser && (
              <motion.div
                variants={fadeIn}
                initial="hidden"
                animate="visible"
                className="rounded-xl p-8 text-center overflow-hidden relative"
                style={{
                  backgroundColor: playerTeamColor.secondary,
                  border: `3px solid ${playerTeamColor.primary}`,
                }}
              >
                {/* Team badge */}
                <div
                  className="absolute top-0 left-0 right-0 py-2 text-white text-sm font-medium"
                  style={{ backgroundColor: playerTeamColor.primary }}
                >
                  {playerTeamColor.name}
                </div>

                <motion.p
                  className="text-3xl font-bold mt-8 mb-4"
                  style={{ color: playerTeamColor.primary }}
                  animate={{ scale: [1, 1.02, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  Your turn to guess!
                </motion.p>

                <p className="text-slate-600 dark:text-slate-400">
                  Listen to {clueGiver?.name}&apos;s clues
                </p>

                {/* Visual timer indicator */}
                <div className="mt-6">
                  <span className={`text-2xl font-mono font-bold ${timerClass}`}>
                    {formatTime(timeLeft)}
                  </span>
                </div>
              </motion.div>
            )}

            {/* Opponent View */}
            {isOpponent && currentCard && (
              <div>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center mb-4 py-2 px-4 rounded-lg bg-amber-100 text-amber-700 border border-amber-300"
                >
                  You&apos;re watching {game.currentTurn.activeTeam === 'A' ? TEAM_COLORS.A.name : TEAM_COLORS.B.name} - Buzz if they break a rule!
                </motion.div>
                <AnimatedCard cardKey={currentCard.targetWord}>
                  <OpponentCard card={currentCard} onBuzz={onBuzz} />
                </AnimatedCard>
              </div>
            )}
          </>
        )}
      </div>

      {/* End Game Button (Host Only) */}
      {isHost && (
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onClick={onEndGame}
          className="fixed bottom-4 right-4 z-40 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white text-sm rounded-lg shadow-lg transition-colors"
        >
          End Game
        </motion.button>
      )}

      <SoundToggle sounds={sounds} />
    </motion.main>
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
    <div className="bg-white/95 backdrop-blur-sm rounded-2xl overflow-hidden shadow-xl">
      {/* Target Word - Pastel gradient */}
      <motion.div
        initial={{ backgroundPosition: '0% 50%' }}
        animate={{ backgroundPosition: '100% 50%' }}
        transition={{ duration: 3, repeat: Infinity, repeatType: 'reverse' }}
        className="p-6 text-center"
        style={{
          background: 'linear-gradient(135deg, #c4b5fd, #f0abfc, #93c5fd, #c4b5fd)',
          backgroundSize: '300% 300%',
        }}
      >
        <p className="text-3xl font-bold text-white drop-shadow-sm">{card.targetWord}</p>
      </motion.div>

      {/* Taboo Words - Soft rose */}
      <div className="p-4 bg-rose-50 border-t border-rose-100">
        <p className="text-xs text-rose-400 font-medium uppercase mb-2 text-center">
          Don&apos;t Say:
        </p>
        <div className="space-y-1">
          {card.tabooWords.map((word, index) => (
            <motion.p
              key={index}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="text-center text-lg font-medium text-rose-500"
            >
              {word}
            </motion.p>
          ))}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="p-4 flex gap-4">
        <AnimatedButton
          onClick={handleCorrect}
          disabled={disabled || isCorrectDisabled}
          variant="success"
          size="lg"
          fullWidth
        >
          Got It!
        </AnimatedButton>
        <AnimatedButton
          onClick={handleSkip}
          disabled={disabled || isSkipDisabled}
          variant="warning"
          size="lg"
          fullWidth
        >
          Skip
        </AnimatedButton>
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
    <div className="bg-white/95 backdrop-blur-sm rounded-2xl overflow-hidden shadow-xl">
      {/* Target Word - Pastel gradient */}
      <div
        className="p-6 text-center"
        style={{
          background: 'linear-gradient(135deg, #c4b5fd, #f0abfc, #93c5fd)',
        }}
      >
        <p className="text-3xl font-bold text-white drop-shadow-sm">{card.targetWord}</p>
      </div>

      {/* Taboo Words - Soft rose */}
      <div className="p-4 bg-rose-50 border-t border-rose-100">
        <p className="text-xs text-rose-400 font-medium uppercase mb-2 text-center">
          Taboo Words:
        </p>
        <div className="space-y-1">
          {card.tabooWords.map((word, index) => (
            <motion.p
              key={index}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="text-center text-lg font-medium text-rose-500"
            >
              {word}
            </motion.p>
          ))}
        </div>
      </div>

      {/* Buzz Button - Pastel coral */}
      <div className="p-4">
        <motion.button
          onClick={handleBuzz}
          disabled={isBuzzDisabled}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.95 }}
          className="w-full py-6 text-white font-bold text-2xl rounded-xl transition-colors shadow-lg disabled:opacity-50"
          style={{
            backgroundColor: '#fb7185', // rose-400 - matches BuzzOverlay
          }}
        >
          BUZZ!
        </motion.button>
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
  avatarStyle: DiceBearStyle;
  onRestart: () => void;
  onBackToHome: () => void;
  sounds: UseSoundsReturn;
}

function GameOverView({
  gameOver,
  room,
  isHost,
  avatarStyle,
  onRestart,
  onBackToHome,
  sounds,
}: GameOverViewProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [screenshotStatus, setScreenshotStatus] = useState<'idle' | 'copied' | 'downloaded' | 'failed'>('idle');

  // Play game over sound and fire confetti on mount
  useEffect(() => {
    sounds.playGameOver();

    if (!gameOver) return;

    // Fire confetti based on result
    if (gameOver.winner === 'tie') {
      fireTieConfetti(TEAM_COLORS.A.primary, TEAM_COLORS.B.primary);
    } else if (gameOver.winner === 'A') {
      fireWinConfetti(TEAM_COLORS.A.primary);
    } else {
      fireWinConfetti(TEAM_COLORS.B.primary);
    }
  }, [sounds, gameOver]);

  // Clear screenshot status toast after delay
  useEffect(() => {
    if (screenshotStatus !== 'idle') {
      const timer = setTimeout(() => setScreenshotStatus('idle'), 2500);
      return () => clearTimeout(timer);
    }
  }, [screenshotStatus]);

  const handleScreenshot = async () => {
    if (!cardRef.current) return;
    const result = await captureAndShare(cardRef.current, 'taboo-result.png');
    setScreenshotStatus(result);
  };

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
    <main className="min-h-screen bg-gradient-to-br from-rose-50 via-amber-50 to-sky-50 p-4 flex items-center justify-center">
      <div className="flex flex-col items-center">
        {/* Screenshot target wrapper */}
        <motion.div
          ref={cardRef}
          variants={scaleIn}
          initial="hidden"
          animate="visible"
          className="max-w-md w-full bg-white/90 backdrop-blur-sm rounded-xl p-8 text-center shadow-xl"
        >
          {/* Winner Text with bounce */}
          <motion.h1
            initial={{ scale: 0, rotate: -10 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{
              type: 'spring',
              stiffness: 200,
              damping: 10,
              delay: 0.2,
            }}
            className="text-4xl font-bold mb-6"
            style={{ color: winnerColor }}
          >
            {winnerText}
          </motion.h1>

          {/* Both Teams Display */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mb-6 space-y-4"
          >
            {/* Team A */}
            <div
              className={`p-3 rounded-lg ${
                winner === 'A'
                  ? 'bg-blue-50 ring-2 ring-blue-400 shadow-md shadow-blue-100'
                  : 'bg-slate-50 opacity-75'
              }`}
            >
              <p
                className="text-sm font-medium mb-2 text-center"
                style={{ color: winner === 'A' ? TEAM_COLORS.A.primary : '#6B7280' }}
              >
                {TEAM_COLORS.A.name} {winner === 'A' && '🏆'}
              </p>
              <div className="flex justify-center gap-2 flex-wrap">
                {room.teams.A.map((playerId) => {
                  const player = room.players[playerId];
                  if (!player) return null;
                  return (
                    <motion.div
                      key={playerId}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.5, type: 'spring' }}
                      className="flex flex-col items-center gap-1"
                    >
                      <PlayerAvatar playerId={playerId} size="md" style={avatarStyle} />
                      <span className="text-xs text-slate-500 max-w-[50px] truncate">
                        {player.name}
                      </span>
                    </motion.div>
                  );
                })}
              </div>
            </div>

            {/* Team B */}
            <div
              className={`p-3 rounded-lg ${
                winner === 'B'
                  ? 'bg-rose-50 ring-2 ring-rose-400 shadow-md shadow-rose-100'
                  : 'bg-slate-50 opacity-75'
              }`}
            >
              <p
                className="text-sm font-medium mb-2 text-center"
                style={{ color: winner === 'B' ? TEAM_COLORS.B.primary : '#6B7280' }}
              >
                {TEAM_COLORS.B.name} {winner === 'B' && '🏆'}
              </p>
              <div className="flex justify-center gap-2 flex-wrap">
                {room.teams.B.map((playerId) => {
                  const player = room.players[playerId];
                  if (!player) return null;
                  return (
                    <motion.div
                      key={playerId}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.6, type: 'spring' }}
                      className="flex flex-col items-center gap-1"
                    >
                      <PlayerAvatar playerId={playerId} size="md" style={avatarStyle} />
                      <span className="text-xs text-slate-500 max-w-[50px] truncate">
                        {player.name}
                      </span>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </motion.div>

          {/* Game Stats */}
          {gameOver.turnHistory && gameOver.turnHistory.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.45 }}
              className="bg-violet-50/80 rounded-lg p-4 mb-6"
            >
              <h3 className="text-sm font-medium text-violet-400 mb-3 text-center">Game Stats</h3>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold text-slate-700">
                    {gameOver.turnHistory.length}
                  </p>
                  <p className="text-xs text-slate-500">Turns Played</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-700">
                    {gameOver.turnHistory.reduce((sum, t) => sum + t.cardsCorrect, 0)}
                  </p>
                  <p className="text-xs text-slate-500">Cards Guessed</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-700">
                    {Math.max(...gameOver.turnHistory.map(t => t.cardsCorrect), 0)}
                  </p>
                  <p className="text-xs text-slate-500">Best Turn</p>
                </div>
              </div>
            </motion.div>
          )}

          {/* Final Scores with rolling animation */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="flex justify-around mb-8"
          >
            <div>
              <p className="text-sm text-slate-500 uppercase">{TEAM_COLORS.A.name}</p>
              <ScoreCounter
                score={finalScores.A}
                color={TEAM_COLORS.A.primary}
                size="lg"
              />
            </div>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.7, type: 'spring' }}
              className="text-3xl text-slate-400 self-center"
            >
              vs
            </motion.div>
            <div>
              <p className="text-sm text-slate-500 uppercase">{TEAM_COLORS.B.name}</p>
              <ScoreCounter
                score={finalScores.B}
                color={TEAM_COLORS.B.primary}
                size="lg"
              />
            </div>
          </motion.div>

          {/* Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="space-y-3"
          >
            {isHost && (
              <AnimatedButton
                onClick={onRestart}
                variant="success"
                size="lg"
                fullWidth
              >
                Play Again
              </AnimatedButton>
            )}
            <AnimatedButton
              onClick={onBackToHome}
              variant="secondary"
              size="lg"
              fullWidth
            >
              Back to Home
            </AnimatedButton>
          </motion.div>

          {!isHost && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
              className="text-slate-500 mt-4"
            >
              Waiting for host to start a new game...
            </motion.p>
          )}
        </motion.div>

        {/* Screenshot Button */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="mt-4 relative"
        >
          <motion.button
            onClick={handleScreenshot}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center gap-2 px-4 py-2 bg-white/90 backdrop-blur-sm rounded-lg shadow-md text-slate-600 hover:bg-white transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            Share Result
          </motion.button>

          {/* Screenshot Toast */}
          <AnimatePresence>
            {screenshotStatus !== 'idle' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className={`absolute top-full mt-2 left-1/2 -translate-x-1/2 whitespace-nowrap px-3 py-1.5 rounded-lg text-sm font-medium ${
                  screenshotStatus === 'failed'
                    ? 'bg-red-100 text-red-700'
                    : 'bg-green-100 text-green-700'
                }`}
              >
                {screenshotStatus === 'copied' && 'Copied to clipboard!'}
                {screenshotStatus === 'downloaded' && 'Image downloaded!'}
                {screenshotStatus === 'failed' && 'Failed to capture'}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
      <SoundToggle sounds={sounds} />
    </main>
  );
}

// ============ Join Modal (for direct URL visitors) ============

interface JoinModalProps {
  roomCode: string;
  onJoin: (name: string) => void;
  onCancel: () => void;
}

function JoinModal({ roomCode, onJoin, onCancel }: JoinModalProps) {
  const [name, setName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();
    if (trimmedName) {
      setIsSubmitting(true);
      onJoin(trimmedName);
    }
  };

  const isValid = name.trim().length > 0;

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-rose-50 via-amber-50 to-sky-50 p-4">
      <motion.div
        variants={scaleIn}
        initial="hidden"
        animate="visible"
        className="max-w-sm w-full bg-white/90 backdrop-blur-sm rounded-xl p-6 shadow-xl"
      >
        <div className="text-center mb-6">
          <motion.h1
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-2xl font-bold text-slate-800 mb-2"
          >
            Join Game
          </motion.h1>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="flex items-center justify-center gap-2"
          >
            <span className="text-slate-500">Room:</span>
            <span className="font-mono font-bold text-violet-500 tracking-widest">
              {roomCode}
            </span>
          </motion.div>
        </div>

        <form onSubmit={handleSubmit}>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-4"
          >
            <label
              htmlFor="playerName"
              className="block text-sm font-medium text-slate-700 mb-2"
            >
              Your Name
            </label>
            <input
              id="playerName"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name"
              maxLength={20}
              autoFocus
              className="w-full px-4 py-3 rounded-lg border border-slate-200 bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="space-y-3"
          >
            <AnimatedButton
              type="submit"
              disabled={!isValid || isSubmitting}
              variant="primary"
              size="lg"
              fullWidth
              data-testid="join-modal-submit"
            >
              {isSubmitting ? 'Joining...' : 'Join Game'}
            </AnimatedButton>
            <button
              type="button"
              onClick={onCancel}
              className="w-full py-2 text-sm text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
            >
              Back to Home
            </button>
          </motion.div>
        </form>
      </motion.div>
    </main>
  );
}

// ============ Sound Toggle ============

interface SoundToggleProps {
  sounds: UseSoundsReturn;
}

function SoundToggle({ sounds }: SoundToggleProps) {
  return (
    <motion.button
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      onClick={() => {
        sounds.playClick();
        sounds.toggleMuted();
      }}
      className="fixed top-4 right-4 z-40 p-3 rounded-full bg-white/90 backdrop-blur-sm shadow-lg border border-slate-100 transition-colors"
      aria-label={sounds.isMuted ? 'Unmute sounds' : 'Mute sounds'}
      title={sounds.isMuted ? 'Unmute sounds' : 'Mute sounds'}
    >
      {sounds.isMuted ? (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5 text-slate-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2"
          />
        </svg>
      ) : (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5 text-violet-500"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
          />
        </svg>
      )}
    </motion.button>
  );
}
