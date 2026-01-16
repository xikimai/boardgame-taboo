'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { generateRoomCode, isValidRoomCode, normalizeRoomCode } from '@/lib/game';

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
      // Store player name in sessionStorage for the room page
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
    // Store player name in sessionStorage for the room page
    sessionStorage.setItem('playerName', playerName.trim());
    sessionStorage.setItem('isHost', 'false');
    router.push(`/room/${normalizedCode}`);
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="w-full max-w-md">
        {/* Logo and Title */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold mb-2 bg-gradient-to-r from-blue-500 to-red-500 bg-clip-text text-transparent">
            TABOO
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            The word-guessing party game
          </p>
        </div>

        {/* Tab Buttons */}
        <div className="flex mb-6 bg-slate-200 dark:bg-slate-700 rounded-lg p-1">
          <button
            onClick={() => setActiveTab('create')}
            className={`flex-1 py-2 px-4 rounded-md font-medium transition-all ${
              activeTab === 'create'
                ? 'bg-white dark:bg-slate-600 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            Create Room
          </button>
          <button
            onClick={() => setActiveTab('join')}
            className={`flex-1 py-2 px-4 rounded-md font-medium transition-all ${
              activeTab === 'join'
                ? 'bg-white dark:bg-slate-600 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            Join Room
          </button>
        </div>

        {/* Form Card */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6">
          {activeTab === 'create' ? (
            <form onSubmit={handleCreateRoom} className="space-y-4">
              <div>
                <label
                  htmlFor="createName"
                  className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300"
                >
                  Your Name
                </label>
                <input
                  id="createName"
                  type="text"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  placeholder="Enter your name"
                  maxLength={20}
                  className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                  disabled={isLoading}
                />
              </div>

              {error && (
                <p className="text-red-500 text-sm">{error}</p>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white font-semibold rounded-lg transition-colors"
              >
                {isLoading ? 'Creating...' : 'Create Room'}
              </button>

              <p className="text-sm text-center text-slate-500 dark:text-slate-400">
                Share the room code with friends to play together
              </p>
            </form>
          ) : (
            <form onSubmit={handleJoinRoom} className="space-y-4">
              <div>
                <label
                  htmlFor="joinName"
                  className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300"
                >
                  Your Name
                </label>
                <input
                  id="joinName"
                  type="text"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  placeholder="Enter your name"
                  maxLength={20}
                  className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                  disabled={isLoading}
                />
              </div>

              <div>
                <label
                  htmlFor="roomCode"
                  className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300"
                >
                  Room Code
                </label>
                <input
                  id="roomCode"
                  type="text"
                  value={roomCode}
                  onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                  placeholder="Enter 5-letter code"
                  maxLength={5}
                  className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-center text-2xl font-mono tracking-widest uppercase"
                  disabled={isLoading}
                />
              </div>

              {error && (
                <p className="text-red-500 text-sm">{error}</p>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 bg-green-500 hover:bg-green-600 disabled:bg-green-300 text-white font-semibold rounded-lg transition-colors"
              >
                {isLoading ? 'Joining...' : 'Join Room'}
              </button>
            </form>
          )}
        </div>

        {/* How to Play */}
        <div className="mt-8 text-center">
          <h2 className="text-lg font-semibold mb-2 text-slate-800 dark:text-slate-200">
            How to Play
          </h2>
          <div className="text-sm text-slate-600 dark:text-slate-400 space-y-1">
            <p>1. Split into two teams</p>
            <p>2. One player gives clues, teammates guess the word</p>
            <p>3. Don&apos;t say the forbidden &quot;taboo&quot; words!</p>
            <p>4. Score points for each correct guess</p>
          </div>
        </div>
      </div>
    </main>
  );
}
