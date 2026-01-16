'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { isValidRoomCode } from '@/lib/game';
import { scaleIn, fadeInUp } from '@/lib/animations/variants';
import { AnimatedButton } from '@/components/animations';

export default function JoinPage() {
  const params = useParams();
  const router = useRouter();
  const [name, setName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Safely extract roomCode - handle undefined during SSR/hydration
  const roomCodeParam = params?.roomCode;
  const roomCode = typeof roomCodeParam === 'string' ? roomCodeParam.toUpperCase() : '';

  // Show loading while params hydrate
  if (!roomCode) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-slate-100 dark:bg-slate-900">
        <div className="text-center">
          <div className="rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4 animate-spin" />
          <p className="text-slate-600 dark:text-slate-400">Loading...</p>
        </div>
      </main>
    );
  }

  // Validate room code format
  if (!isValidRoomCode(roomCode)) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-slate-100 dark:bg-slate-900 p-4">
        <motion.div
          variants={fadeInUp}
          initial="hidden"
          animate="visible"
          className="text-center"
        >
          <p className="text-red-500 mb-4">Invalid room code</p>
          <AnimatedButton onClick={() => router.push('/')} variant="primary">
            Back to Home
          </AnimatedButton>
        </motion.div>
      </main>
    );
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) return;

    setIsSubmitting(true);
    sessionStorage.setItem('playerName', trimmedName);
    sessionStorage.setItem('isHost', 'false');
    router.push(`/room/${roomCode}`);
  };

  const isValid = name.trim().length > 0;

  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-100 dark:bg-slate-900 p-4">
      <motion.div
        variants={scaleIn}
        initial="hidden"
        animate="visible"
        className="max-w-sm w-full bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg"
      >
        <div className="text-center mb-6">
          <motion.h1
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-2xl font-bold text-slate-800 dark:text-slate-200 mb-2"
          >
            Join Game
          </motion.h1>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="flex items-center justify-center gap-2"
          >
            <span className="text-slate-500 dark:text-slate-400">Room:</span>
            <span className="font-mono font-bold text-blue-500 tracking-widest">
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
              className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2"
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
              className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
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
              onClick={() => router.push('/')}
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
