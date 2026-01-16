'use client';

import { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import gsap from 'gsap';

interface BuzzOverlayProps {
  isVisible: boolean;
  buzzerName?: string;
  onDismiss?: () => void;
  showDismissButton?: boolean;
}

export function BuzzOverlay({
  isVisible,
  buzzerName,
  onDismiss,
  showDismissButton,
}: BuzzOverlayProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isVisible && containerRef.current) {
      // Screen shake effect
      gsap.to(containerRef.current, {
        x: () => gsap.utils.random(-8, 8),
        duration: 0.05,
        repeat: 10,
        yoyo: true,
        ease: 'power1.inOut',
        onComplete: () => {
          if (containerRef.current) {
            gsap.set(containerRef.current, { x: 0 });
          }
        },
      });
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
          {/* Red flash overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.4, 0.2] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 bg-red-500"
          />

          {/* Content */}
          <motion.div
            initial={{ scale: 0.3, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 1.2, opacity: 0 }}
            transition={{
              type: 'spring',
              stiffness: 500,
              damping: 15,
            }}
            className="relative pointer-events-auto"
          >
            <div className="bg-red-600 rounded-2xl p-8 text-center shadow-2xl">
              {/* Pulsing glow effect */}
              <motion.div
                animate={{
                  boxShadow: [
                    '0 0 20px rgba(239, 68, 68, 0.5)',
                    '0 0 60px rgba(239, 68, 68, 0.8)',
                    '0 0 20px rgba(239, 68, 68, 0.5)',
                  ],
                }}
                transition={{
                  duration: 0.5,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
                className="absolute inset-0 rounded-2xl"
              />

              {/* BUZZ text */}
              <motion.h2
                animate={{
                  scale: [1, 1.1, 1],
                }}
                transition={{
                  duration: 0.3,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
                className="text-6xl font-black text-white mb-2 relative"
                style={{
                  textShadow: '0 4px 20px rgba(0,0,0,0.3)',
                }}
              >
                BUZZ!
              </motion.h2>

              {buzzerName && (
                <p className="text-white text-lg opacity-90 relative">
                  {buzzerName} pressed the buzzer
                </p>
              )}

              {showDismissButton && onDismiss && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={onDismiss}
                  className="mt-4 px-6 py-3 bg-white text-red-600 font-bold rounded-xl shadow-lg relative"
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
