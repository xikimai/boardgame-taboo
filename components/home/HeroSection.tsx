'use client';

import { useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { motion } from 'framer-motion';

gsap.registerPlugin(useGSAP);

export function HeroSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const lettersRef = useRef<HTMLSpanElement[]>([]);

  useGSAP(
    () => {
      // Animate each letter with stagger
      gsap.fromTo(
        lettersRef.current,
        {
          opacity: 0,
          y: 50,
          rotateX: -90,
          scale: 0.5,
        },
        {
          opacity: 1,
          y: 0,
          rotateX: 0,
          scale: 1,
          duration: 0.6,
          stagger: 0.1,
          ease: 'back.out(1.7)',
        }
      );

      // Add a subtle floating animation after entrance
      gsap.to(lettersRef.current, {
        y: -3,
        duration: 2,
        stagger: 0.1,
        ease: 'power1.inOut',
        yoyo: true,
        repeat: -1,
        delay: 0.8,
      });
    },
    { scope: containerRef }
  );

  const title = 'TABOO';

  return (
    <div ref={containerRef} className="text-center mb-8">
      {/* Animated Logo Text */}
      <h1
        className="text-6xl md:text-7xl font-bold mb-3 perspective-1000"
        style={{ perspective: '1000px' }}
      >
        {title.split('').map((letter, index) => (
          <span
            key={index}
            ref={(el) => {
              if (el) lettersRef.current[index] = el;
            }}
            className="inline-block hero-letter"
            style={{
              background: `linear-gradient(
                135deg,
                #3B82F6 0%,
                #8B5CF6 25%,
                #EC4899 50%,
                #EF4444 75%,
                #3B82F6 100%
              )`,
              backgroundSize: '200% 200%',
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              color: 'transparent',
              animation: 'shimmer 3s ease-in-out infinite',
            }}
          >
            {letter}
          </span>
        ))}
      </h1>

      {/* Tagline with fade-in */}
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8, duration: 0.5 }}
        className="text-lg text-slate-600 dark:text-slate-400"
      >
        The word-guessing party game
      </motion.p>

      {/* Decorative element */}
      <motion.div
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ delay: 1, duration: 0.5, ease: 'easeOut' }}
        className="h-1 w-24 mx-auto mt-4 rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-red-500"
      />
    </div>
  );
}
