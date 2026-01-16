'use client';

import { useRef, useLayoutEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export function LandingHero() {
  const containerRef = useRef<HTMLDivElement>(null);
  const lettersRef = useRef<HTMLSpanElement[]>([]);

  useLayoutEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    const ctx = gsap.context(() => {
      // Initial letter stagger animation
      gsap.fromTo(
        lettersRef.current,
        {
          y: 100,
          opacity: 0,
          rotateX: -90,
        },
        {
          y: 0,
          opacity: 1,
          rotateX: 0,
          duration: 0.8,
          stagger: 0.08,
          ease: 'back.out(1.5)',
          delay: 0.3,
        }
      );

      // Floating animation after entrance
      lettersRef.current.forEach((letter, i) => {
        gsap.to(letter, {
          y: 'random(-8, 8)',
          duration: 'random(2, 3)',
          repeat: -1,
          yoyo: true,
          ease: 'sine.inOut',
          delay: 1.5 + i * 0.1,
        });
      });

      // Parallax on scroll - letters spread out
      gsap.to(lettersRef.current, {
        y: (i) => (i - 2.5) * 30,
        opacity: 0.3,
        scrollTrigger: {
          trigger: containerRef.current,
          start: 'top top',
          end: 'bottom top',
          scrub: 1,
        },
      });
    }, containerRef);

    return () => ctx.revert();
  }, []);

  const letters = ['T', 'A', 'B', 'O', 'O'];

  // Pastel colors for each letter
  const letterColors = [
    'from-rose-400 to-pink-400',
    'from-violet-400 to-purple-400',
    'from-sky-400 to-cyan-400',
    'from-amber-400 to-orange-400',
    'from-emerald-400 to-teal-400',
  ];

  return (
    <section
      ref={containerRef}
      className="relative h-screen flex flex-col items-center justify-center bg-gradient-to-br from-rose-50 via-amber-50 to-sky-50 overflow-hidden"
    >
      {/* Background gradient orbs - soft pastels */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-rose-200/40 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-violet-200/40 rounded-full blur-3xl" />
        <div className="absolute top-1/2 right-1/3 w-72 h-72 bg-sky-200/30 rounded-full blur-3xl" />
      </div>

      {/* Main title */}
      <h1
        className="relative text-7xl sm:text-8xl md:text-9xl font-black tracking-wider flex"
        style={{ perspective: '1000px' }}
      >
        {letters.map((letter, i) => (
          <span
            key={i}
            ref={(el) => {
              if (el) lettersRef.current[i] = el;
            }}
            className={`inline-block bg-gradient-to-b ${letterColors[i]} bg-clip-text text-transparent drop-shadow-sm`}
          >
            {letter}
          </span>
        ))}
      </h1>

      {/* Tagline */}
      <p className="relative mt-6 text-lg md:text-xl text-slate-500 text-center px-4 max-w-md opacity-0 animate-[fadeIn_0.8s_ease-out_1.2s_forwards]">
        The classic word-guessing game. Online. With friends.
      </p>

      {/* Scroll indicator */}
      <div className="absolute bottom-12 flex flex-col items-center text-slate-400">
        <span className="text-sm mb-3 opacity-0 animate-[fadeIn_0.5s_ease-out_2s_forwards]">
          Scroll to learn how to play
        </span>
        <div className="w-6 h-10 border-2 border-slate-300 rounded-full flex justify-center opacity-0 animate-[fadeIn_0.5s_ease-out_2.2s_forwards]">
          <div className="w-1.5 h-3 bg-slate-400 rounded-full mt-2 animate-bounce" />
        </div>
      </div>

      {/* Add fadeIn keyframes */}
      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </section>
  );
}
