'use client';

import { useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import gsap from 'gsap';

// Pastel coral color for friendlier buzz
const BUZZ_COLOR = '#fb7185'; // rose-400

interface BuzzOverlayProps {
  isVisible: boolean;
  buzzerName?: string;
  buzzedBy?: string;
  currentPlayerId?: string | null;
  onDismiss?: () => void;
  onUndoBuzz?: () => void;
  showDismissButton?: boolean;
}

// Particle component for burst effect - receives pre-computed random values as props
function Particle({ delay, angle, distance, size }: { delay: number; angle: number; distance: number; size: number }) {
  const x = Math.cos(angle) * distance;
  const y = Math.sin(angle) * distance;

  return (
    <motion.div
      initial={{ scale: 0, x: 0, y: 0, opacity: 1 }}
      animate={{
        scale: [0, 1.2, 0],
        x: [0, x],
        y: [0, y],
        opacity: [1, 1, 0],
      }}
      transition={{
        duration: 0.6,
        delay,
        ease: 'easeOut',
      }}
      className="absolute rounded-full"
      style={{
        width: size,
        height: size,
        backgroundColor: BUZZ_COLOR,
        left: '50%',
        top: '50%',
        marginLeft: -size / 2,
        marginTop: -size / 2,
      }}
    />
  );
}

export function BuzzOverlay({
  isVisible,
  buzzerName,
  buzzedBy,
  currentPlayerId,
  onDismiss,
  onUndoBuzz,
  showDismissButton,
}: BuzzOverlayProps) {
  const canUndo = currentPlayerId === buzzedBy && onUndoBuzz;
  const containerRef = useRef<HTMLDivElement>(null);
  const [particles, setParticles] = useState<{ id: number; angle: number; delay: number; distance: number; size: number }[]>([]);

  useEffect(() => {
    if (isVisible) {
      // Generate particles for burst effect with pre-computed random values
      const newParticles = Array.from({ length: 12 }, (_, i) => ({
        id: Date.now() + i,
        angle: (i / 12) * Math.PI * 2 + Math.random() * 0.3,
        delay: Math.random() * 0.1,
        distance: 80 + Math.random() * 60,
        size: 8 + Math.random() * 12,
      }));
      setParticles(newParticles);

      // Enhanced screen shake with elastic snappiness
      if (containerRef.current) {
        gsap.to(containerRef.current, {
          x: () => gsap.utils.random(-12, 12),
          duration: 0.04,
          repeat: 12,
          yoyo: true,
          ease: 'elastic.out(1, 0.3)',
          onComplete: () => {
            if (containerRef.current) {
              gsap.set(containerRef.current, { x: 0 });
            }
          },
        });
      }
    }
  }, [isVisible]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          ref={containerRef}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.1 }}
          className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
        >
          {/* Pastel coral flash overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.35, 0.15] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0"
            style={{ backgroundColor: BUZZ_COLOR }}
          />

          {/* Particle burst effect */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            {particles.map((p) => (
              <Particle key={p.id} angle={p.angle} delay={p.delay} distance={p.distance} size={p.size} />
            ))}
          </div>

          {/* Content */}
          <motion.div
            initial={{ scale: 0, rotate: -10 }}
            animate={{
              scale: [0, 1.3, 1],
              rotate: [-10, 5, 0],
            }}
            exit={{ scale: 1.2, opacity: 0 }}
            transition={{
              type: 'spring',
              stiffness: 400,
              damping: 10,
            }}
            className="relative pointer-events-auto"
          >
            <div
              className="rounded-2xl p-8 text-center shadow-2xl"
              style={{ backgroundColor: BUZZ_COLOR }}
            >
              {/* Pulsing glow effect with pastel coral */}
              <motion.div
                animate={{
                  boxShadow: [
                    '0 0 20px rgba(251, 113, 133, 0.5)',
                    '0 0 60px rgba(251, 113, 133, 0.8)',
                    '0 0 20px rgba(251, 113, 133, 0.5)',
                  ],
                }}
                transition={{
                  duration: 0.5,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
                className="absolute inset-0 rounded-2xl"
              />

              {/* BUZZ text with elastic bounce */}
              <motion.h2
                initial={{ scale: 0, rotate: -15 }}
                animate={{
                  scale: [0, 1.2, 1],
                  rotate: [-15, 8, 0],
                }}
                transition={{
                  type: 'spring',
                  stiffness: 400,
                  damping: 8,
                  delay: 0.05,
                }}
                className="text-6xl font-black text-white mb-2 relative"
                style={{
                  textShadow: '0 4px 20px rgba(0,0,0,0.2)',
                }}
              >
                BUZZ!
              </motion.h2>

              {buzzerName && (
                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 }}
                  className="text-white text-lg opacity-90 relative"
                >
                  {buzzerName} pressed the buzzer
                </motion.p>
              )}

              {/* Undo option for the buzzer */}
              {canUndo && (
                <motion.button
                  onClick={onUndoBuzz}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="mt-4 px-6 py-3 bg-amber-400 hover:bg-amber-500 text-white font-bold rounded-xl shadow-lg relative"
                >
                  Undo Buzz (Mistake)
                </motion.button>
              )}

              {showDismissButton && onDismiss && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={onDismiss}
                  className="mt-4 px-6 py-3 bg-white font-bold rounded-xl shadow-lg relative"
                  style={{ color: BUZZ_COLOR }}
                >
                  Accept (-1 point) & Continue
                </motion.button>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
