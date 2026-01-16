'use client';

import { ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface AnimatedCardProps {
  cardKey: string | number;
  children: ReactNode;
  className?: string;
}

export function AnimatedCard({ cardKey, children, className = '' }: AnimatedCardProps) {
  return (
    <div style={{ perspective: '1000px' }}>
      <AnimatePresence mode="wait">
        <motion.div
          key={cardKey}
          initial={{
            rotateY: -90,
            opacity: 0,
            scale: 0.9,
          }}
          animate={{
            rotateY: 0,
            opacity: 1,
            scale: 1,
          }}
          exit={{
            rotateY: 90,
            opacity: 0,
            scale: 0.9,
          }}
          transition={{
            duration: 0.4,
            ease: [0.25, 0.46, 0.45, 0.94],
          }}
          className={className}
          style={{ transformStyle: 'preserve-3d' }}
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
