'use client';

import { useRef, useLayoutEffect, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ForbiddenWord } from './ForbiddenWord';

gsap.registerPlugin(ScrollTrigger);

interface MiniTabooCardProps {
  targetWord?: string;
  forbiddenWords?: string[];
  className?: string;
}

export function MiniTabooCard({
  targetWord = 'BANANA',
  forbiddenWords = ['yellow', 'fruit', 'monkey', 'peel'],
  className = '',
}: MiniTabooCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const [triggered, setTriggered] = useState(false);

  useLayoutEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      setTriggered(true);
      return;
    }

    const ctx = gsap.context(() => {
      // Card entrance with spring physics
      gsap.fromTo(
        cardRef.current,
        {
          rotateY: -25,
          rotateX: 10,
          scale: 0.7,
          opacity: 0,
        },
        {
          rotateY: 0,
          rotateX: 0,
          scale: 1,
          opacity: 1,
          duration: 0.8,
          ease: 'elastic.out(1, 0.5)', // Bouncy spring
          scrollTrigger: {
            trigger: cardRef.current,
            start: 'center 80%',
            onEnter: () => setTriggered(true),
          },
        }
      );

      // Subtle floating animation after entrance
      gsap.to(cardRef.current, {
        y: -5,
        rotateY: 2,
        duration: 2,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
        delay: 1,
      });
    }, cardRef);

    return () => ctx.revert();
  }, []);

  return (
    <div
      ref={cardRef}
      className={`relative w-44 flex-shrink-0 ${className}`}
      style={{ perspective: '1000px', transformStyle: 'preserve-3d' }}
    >
      <div
        ref={innerRef}
        className="relative bg-gradient-to-br from-rose-100 via-violet-100 to-sky-100 rounded-2xl p-5 shadow-xl shadow-rose-200/40 border border-rose-200/50"
        style={{ transformStyle: 'preserve-3d' }}
      >
        {/* Card glow effect */}
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/60 to-transparent" />

        {/* Shine sweep effect */}
        <div className="absolute inset-0 rounded-2xl overflow-hidden">
          <div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full animate-[shimmer_3s_ease-in-out_infinite]"
            style={{ animationDelay: '1s' }}
          />
        </div>

        {/* Target word */}
        <div className="relative text-center mb-4">
          <span className="text-2xl font-black bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent tracking-wide">
            {targetWord}
          </span>
        </div>

        {/* Divider */}
        <div className="w-full h-px bg-gradient-to-r from-transparent via-rose-300 to-transparent mb-3" />

        {/* Forbidden words */}
        <div className="relative space-y-2">
          {forbiddenWords.map((word, index) => (
            <div key={word} className="flex items-center justify-center">
              <ForbiddenWord
                word={word}
                instant={triggered}
                delay={index * 0.12} // Faster stagger
                className="text-base"
              />
            </div>
          ))}
        </div>

        {/* Corner decorations with pulse */}
        <div className="absolute top-2 right-2 w-3 h-3 rounded-full bg-rose-300/40 animate-pulse" />
        <div className="absolute bottom-2 left-2 w-2 h-2 rounded-full bg-violet-300/40 animate-pulse" style={{ animationDelay: '0.5s' }} />
      </div>
    </div>
  );
}
