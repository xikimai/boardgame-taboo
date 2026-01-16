'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { generateRoomCode, isValidRoomCode, normalizeRoomCode } from '@/lib/game';
import { scaleIn, fadeInUp } from '@/lib/animations/variants';
import { AnimatedButton } from '@/components/animations';
import { HeroSection, HowToPlayGuide } from '@/components/home';

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
    <main className="min-h-screen flex flex-col items-center justify-start p-4 pt-12 md:pt-20 bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 overflow-x-hidden">
      <div className="w-full max-w-md">
        {/* Animated Hero Section */}
        <HeroSection />

        {/* Tab Buttons with animated indicator */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.4 }}
          className="flex mb-6 bg-slate-200 dark:bg-slate-700 rounded-lg p-1 relative"
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
          variants={scaleIn}
          initial="hidden"
          animate="visible"
          transition={{ delay: 0.6 }}
          className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 overflow-hidden"
        >
          <AnimatePresence mode="wait">
            {activeTab === 'create' ? (
              <motion.form
                key="create"
                variants={fadeInUp}
                initial="hidden"
                animate="visible"
                exit="exit"
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

                <p className="text-sm text-center text-slate-500 dark:text-slate-400">
                  Share the room code with friends to play together
                </p>
              </motion.form>
            ) : (
              <motion.form
                key="join"
                variants={fadeInUp}
                initial="hidden"
                animate="visible"
                exit="exit"
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

        {/* How to Play Guide with scroll animations */}
        <HowToPlayGuide />
      </div>
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
      className={`relative flex-1 py-2 px-4 rounded-md font-medium transition-colors z-10 ${
        isActive
          ? 'text-slate-900 dark:text-slate-100'
          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
      }`}
    >
      {isActive && (
        <motion.div
          layoutId="activeTab"
          className="absolute inset-0 bg-white dark:bg-slate-600 rounded-md shadow-sm"
          style={{ zIndex: -1 }}
          transition={{
            type: 'spring',
            stiffness: 500,
            damping: 30,
          }}
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
        className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300"
      >
        {label}
      </label>
      <motion.div
        animate={{
          boxShadow: isFocused
            ? '0 0 0 3px rgba(59, 130, 246, 0.3)'
            : '0 0 0 0px rgba(59, 130, 246, 0)',
        }}
        transition={{ duration: 0.2 }}
        className="rounded-lg"
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
          className={`w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all ${className}`}
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
          initial={{ opacity: 0, height: 0, y: -10 }}
          animate={{ opacity: 1, height: 'auto', y: 0 }}
          exit={{ opacity: 0, height: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          className="text-red-500 text-sm overflow-hidden"
        >
          {error}
        </motion.p>
      )}
    </AnimatePresence>
  );
}
