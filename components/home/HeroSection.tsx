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

  // Pastel colors for each letter - matches the app's warm color palette
  const letterColors = [
    'from-rose-400 to-pink-400',
    'from-violet-400 to-purple-400',
    'from-sky-400 to-cyan-400',
    'from-amber-400 to-orange-400',
    'from-emerald-400 to-teal-400',
  ];

  return (
    <div ref={containerRef} className="text-center mb-8">
      {/* Animated Logo Text */}
      <h1
        className="text-6xl md:text-7xl font-bold mb-3"
        style={{ perspective: '1000px' }}
      >
        {title.split('').map((letter, index) => (
          <span
            key={index}
            ref={(el) => {
              if (el) lettersRef.current[index] = el;
            }}
            className={`inline-block bg-gradient-to-b ${letterColors[index]} bg-clip-text text-transparent drop-shadow-sm`}
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
        className="text-lg text-slate-600"
      >
        The word-guessing party game
      </motion.p>

      {/* Decorative element */}
      <motion.div
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ delay: 1, duration: 0.5, ease: 'easeOut' }}
        className="h-1 w-24 mx-auto mt-4 rounded-full bg-gradient-to-r from-rose-400 via-violet-400 to-sky-400"
      />
    </div>
  );
}
