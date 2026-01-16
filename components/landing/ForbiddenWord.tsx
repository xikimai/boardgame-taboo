'use client';

import { useRef, useLayoutEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

interface ForbiddenWordProps {
  word: string;
  className?: string;
  /** If true, animates immediately without scroll trigger */
  instant?: boolean;
  /** Delay before animation starts (for stagger effect) */
  delay?: number;
}

export function ForbiddenWord({ word, className = '', instant = false, delay = 0 }: ForbiddenWordProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const strikeRef = useRef<HTMLDivElement>(null);
  const xRef = useRef<HTMLSpanElement>(null);

  useLayoutEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      if (strikeRef.current) strikeRef.current.style.transform = 'scaleX(1)';
      if (xRef.current) xRef.current.style.opacity = '1';
      return;
    }

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ paused: !instant });

      // Strike-through with elastic overshoot for snappy feel
      tl.to(strikeRef.current, {
        scaleX: 1.1, // Overshoot
        duration: 0.2,
        ease: 'power2.out',
      })
        .to(strikeRef.current, {
          scaleX: 1, // Settle back
          duration: 0.15,
          ease: 'elastic.out(1, 0.5)',
        })
        .to(
          xRef.current,
          {
            opacity: 1,
            scale: 1,
            rotation: 0,
            duration: 0.3,
            ease: 'elastic.out(1, 0.3)', // Bouncy pop
          },
          '-=0.15'
        )
        .to(
          containerRef.current,
          {
            color: '#f43f5e',
            duration: 0.15,
          },
          '-=0.25'
        );

      if (instant) {
        gsap.delayedCall(delay, () => tl.restart());
      } else {
        ScrollTrigger.create({
          trigger: containerRef.current,
          start: 'center 70%',
          onEnter: () => tl.play(),
        });
      }
    }, containerRef);

    return () => ctx.revert();
  }, [instant, delay]);

  return (
    <div
      ref={containerRef}
      className={`relative inline-flex items-center gap-1 font-semibold text-slate-500 transition-colors ${className}`}
    >
      <span className="relative">
        {word}
        <div
          ref={strikeRef}
          className="absolute left-0 top-1/2 w-full h-0.5 bg-rose-400 -translate-y-1/2 origin-left rounded-full"
          style={{ transform: 'scaleX(0)' }}
        />
      </span>
      <span
        ref={xRef}
        className="text-rose-500 font-bold text-sm"
        style={{ opacity: 0, transform: 'scale(0.3) rotate(-45deg)' }}
      >
        ✕
      </span>
    </div>
  );
}
