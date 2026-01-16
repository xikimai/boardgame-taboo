'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { generateRoomCode, isValidRoomCode, normalizeRoomCode } from '@/lib/game';
import { AnimatedButton } from '@/components/animations';
import { HeroSection } from '@/components/home';
import { TickerSection } from '@/components/landing';

// Spring physics configs for snappy animations
const springSnappy = { type: 'spring' as const, stiffness: 400, damping: 25 };
const springBouncy = { type: 'spring' as const, stiffness: 300, damping: 15 };
const springGentle = { type: 'spring' as const, stiffness: 200, damping: 20 };

export default function Home() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'create' | 'join'>('create');
  const [playerName, setPlayerName] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!playerName.trim()) {
      setError('Please enter your name');
      return;
    }

    setIsLoading(true);
    try {
      const code = generateRoomCode();
      sessionStorage.setItem('playerName', playerName.trim());
      sessionStorage.setItem('isHost', 'true');
      router.push(`/room/${code}`);
    } catch {
      setError('Failed to create room. Please try again.');
      setIsLoading(false);
    }
  };

  const handleJoinRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!playerName.trim()) {
      setError('Please enter your name');
      return;
    }

    const normalizedCode = normalizeRoomCode(roomCode);
    if (!isValidRoomCode(normalizedCode)) {
      setError('Invalid room code. Please check and try again.');
      return;
    }

    setIsLoading(true);
    sessionStorage.setItem('playerName', playerName.trim());
    sessionStorage.setItem('isHost', 'false');
    router.push(`/room/${normalizedCode}`);
  };

  return (
    <main className="bg-gradient-to-br from-rose-50 via-amber-50 to-sky-50 overflow-x-hidden">
      {/* Above the fold - Game Entry */}
      <section className="relative min-h-screen flex flex-col items-center justify-start p-4 pt-12 md:pt-20">
        {/* Background orbs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-rose-200/30 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-violet-200/30 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
          <div className="absolute top-1/2 right-1/3 w-72 h-72 bg-sky-200/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
        </div>

        <div className="relative w-full max-w-md z-10">
          {/* Animated Hero Section */}
          <HeroSection />

          {/* Tab Buttons with springy indicator */}
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ ...springBouncy, delay: 0.5 }}
            className="flex mb-6 bg-white/60 backdrop-blur-sm rounded-xl p-1.5 relative shadow-lg shadow-rose-200/20"
          >
            <TabButton
              label="Create Room"
              isActive={activeTab === 'create'}
              onClick={() => setActiveTab('create')}
            />
            <TabButton
              label="Join Room"
              isActive={activeTab === 'join'}
              onClick={() => setActiveTab('join')}
            />
          </motion.div>

          {/* Animated Form Card */}
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ ...springBouncy, delay: 0.6 }}
            className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl shadow-rose-200/20 p-6 overflow-hidden border border-white/50"
          >
            <AnimatePresence mode="wait">
              {activeTab === 'create' ? (
                <motion.form
                  key="create"
                  initial={{ opacity: 0, x: -20, scale: 0.98 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: 20, scale: 0.98 }}
                  transition={springSnappy}
                  onSubmit={handleCreateRoom}
                  className="space-y-4"
                >
                  <FormInput
                    id="createName"
                    label="Your Name"
                    value={playerName}
                    onChange={setPlayerName}
                    placeholder="Enter your name"
                    disabled={isLoading}
                  />

                  <AnimatedError error={error} />

                  <AnimatedButton
                    type="submit"
                    variant="primary"
                    size="lg"
                    fullWidth
                    isLoading={isLoading}
                  >
                    Create Room
                  </AnimatedButton>

                  <p className="text-sm text-center text-slate-500">
                    Share the room code with friends to play together
                  </p>
                </motion.form>
              ) : (
                <motion.form
                  key="join"
                  initial={{ opacity: 0, x: 20, scale: 0.98 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: -20, scale: 0.98 }}
                  transition={springSnappy}
                  onSubmit={handleJoinRoom}
                  className="space-y-4"
                >
                  <FormInput
                    id="joinName"
                    label="Your Name"
                    value={playerName}
                    onChange={setPlayerName}
                    placeholder="Enter your name"
                    disabled={isLoading}
                  />

                  <FormInput
                    id="roomCode"
                    label="Room Code"
                    value={roomCode}
                    onChange={(val) => setRoomCode(val.toUpperCase())}
                    placeholder="Enter 5-letter code"
                    disabled={isLoading}
                    maxLength={5}
                    className="text-center text-2xl font-mono tracking-widest uppercase"
                  />

                  <AnimatedError error={error} />

                  <AnimatedButton
                    type="submit"
                    variant="success"
                    size="lg"
                    fullWidth
                    isLoading={isLoading}
                  >
                    Join Room
                  </AnimatedButton>
                </motion.form>
              )}
            </AnimatePresence>
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...springGentle, delay: 1.2 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center text-slate-400"
        >
          <span className="text-sm mb-2">Scroll to learn how to play</span>
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </motion.div>
        </motion.div>
      </section>

      {/* Below the fold - Landing Experience */}
      <TickerSection />
    </main>
  );
}

// ============ Sub-components ============

interface TabButtonProps {
  label: string;
  isActive: boolean;
  onClick: () => void;
}

function TabButton({ label, isActive, onClick }: TabButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`relative flex-1 py-2.5 px-4 rounded-lg font-medium transition-colors z-10 ${
        isActive
          ? 'text-slate-800'
          : 'text-slate-500 hover:text-slate-700'
      }`}
    >
      {isActive && (
        <motion.div
          layoutId="activeTab"
          className="absolute inset-0 bg-white rounded-lg shadow-md"
          style={{ zIndex: -1 }}
          transition={springSnappy}
        />
      )}
      {label}
    </button>
  );
}

interface FormInputProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  disabled?: boolean;
  maxLength?: number;
  className?: string;
}

function FormInput({
  id,
  label,
  value,
  onChange,
  placeholder,
  disabled,
  maxLength = 20,
  className = '',
}: FormInputProps) {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <div>
      <label
        htmlFor={id}
        className="block text-sm font-medium mb-1.5 text-slate-600"
      >
        {label}
      </label>
      <motion.div
        animate={{
          boxShadow: isFocused
            ? '0 0 0 3px rgba(244, 114, 182, 0.3)' // rose-400/30
            : '0 0 0 0px rgba(244, 114, 182, 0)',
          scale: isFocused ? 1.01 : 1,
        }}
        transition={springSnappy}
        className="rounded-xl"
      >
        <input
          id={id}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
          maxLength={maxLength}
          className={`w-full px-4 py-3 rounded-xl border border-slate-200 bg-white/80 focus:border-rose-300 outline-none transition-colors placeholder:text-slate-400 ${className}`}
          disabled={disabled}
        />
      </motion.div>
    </div>
  );
}

function AnimatedError({ error }: { error: string }) {
  return (
    <AnimatePresence>
      {error && (
        <motion.p
          initial={{ opacity: 0, height: 0, y: -10, scale: 0.95 }}
          animate={{ opacity: 1, height: 'auto', y: 0, scale: 1 }}
          exit={{ opacity: 0, height: 0, y: -10, scale: 0.95 }}
          transition={springSnappy}
          className="text-rose-500 text-sm overflow-hidden"
        >
          {error}
        </motion.p>
      )}
    </AnimatePresence>
  );
}
