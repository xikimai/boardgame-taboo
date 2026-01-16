'use client';

import { useRef, useLayoutEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { WavyConnector } from './WavyConnector';
import { MiniTabooCard } from './MiniTabooCard';

gsap.registerPlugin(ScrollTrigger);

// Icon components with wobble animation class
function LightbulbIcon() {
  return (
    <div className="ticker-icon">
      <svg className="w-12 h-12 flex-shrink-0 text-amber-400 drop-shadow-lg" fill="currentColor" viewBox="0 0 24 24">
        <path d="M9 21c0 .55.45 1 1 1h4c.55 0 1-.45 1-1v-1H9v1zm3-19C8.14 2 5 5.14 5 9c0 2.38 1.19 4.47 3 5.74V17c0 .55.45 1 1 1h6c.55 0 1-.45 1-1v-2.26c1.81-1.27 3-3.36 3-5.74 0-3.86-3.14-7-7-7zm2.85 11.1l-.85.6V16h-4v-2.3l-.85-.6A4.997 4.997 0 017 9c0-2.76 2.24-5 5-5s5 2.24 5 5c0 1.63-.8 3.16-2.15 4.1z" />
      </svg>
    </div>
  );
}

function TeamIcon() {
  return (
    <div className="ticker-icon">
      <svg className="w-14 h-14 flex-shrink-0 text-sky-400 drop-shadow-lg" fill="currentColor" viewBox="0 0 24 24">
        <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
      </svg>
    </div>
  );
}

function TrophyIcon() {
  return (
    <div className="ticker-icon">
      <svg className="w-16 h-16 flex-shrink-0 text-amber-500 drop-shadow-lg" fill="currentColor" viewBox="0 0 24 24">
        <path d="M19 5h-2V3H7v2H5c-1.1 0-2 .9-2 2v1c0 2.55 1.92 4.63 4.39 4.94.63 1.5 1.98 2.63 3.61 2.96V19H7v2h10v-2h-4v-3.1c1.63-.33 2.98-1.46 3.61-2.96C19.08 12.63 21 10.55 21 8V7c0-1.1-.9-2-2-2zM5 8V7h2v3.82C5.84 10.4 5 9.3 5 8zm14 0c0 1.3-.84 2.4-2 2.82V7h2v1z" />
      </svg>
    </div>
  );
}

function SparkleIcon() {
  return (
    <div className="ticker-icon">
      <svg className="w-8 h-8 flex-shrink-0 text-violet-400 drop-shadow-lg" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 2L9.19 8.63 2 9.24l5.46 4.73L5.82 21 12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2z" />
      </svg>
    </div>
  );
}

function TimerIcon() {
  return (
    <div className="ticker-icon">
      <svg className="w-12 h-12 flex-shrink-0 text-orange-400 drop-shadow-lg" fill="currentColor" viewBox="0 0 24 24">
        <path d="M15 1H9v2h6V1zm-4 13h2V8h-2v6zm8.03-6.61l1.42-1.42c-.43-.51-.9-.99-1.41-1.41l-1.42 1.42C16.07 4.74 14.12 4 12 4c-4.97 0-9 4.03-9 9s4.02 9 9 9 9-4.03 9-9c0-2.12-.74-4.07-1.97-5.61zM12 20c-3.87 0-7-3.13-7-7s3.13-7 7-7 7 3.13 7 7-3.13 7-7 7z" />
      </svg>
    </div>
  );
}

function ArrowIcon() {
  return (
    <svg className="w-10 h-10 flex-shrink-0 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
    </svg>
  );
}

function XIcon() {
  return (
    <div className="ticker-icon w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-full bg-rose-100 shadow-lg">
      <span className="text-rose-500 font-black text-2xl">✕</span>
    </div>
  );
}

function ConfettiIcon() {
  return (
    <div className="ticker-icon">
      <svg className="w-14 h-14 flex-shrink-0 text-pink-400 drop-shadow-lg" fill="currentColor" viewBox="0 0 24 24">
        <path d="M4.5 9.5L6 11l1.5-1.5L6 8 4.5 9.5zm4-4L10 7l1.5-1.5L10 4 8.5 5.5zm10 10L17 14l-1.5 1.5L17 17l1.5-1.5zM12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-5-5l1.5-1.5L7 12l-1.5 1.5L7 15zm8-8l1.5-1.5L15 4l-1.5 1.5L15 7z" />
      </svg>
    </div>
  );
}

export function TickerSection() {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    const ctx = gsap.context(() => {
      // Delay for DOM stability
      setTimeout(() => {
        const track = trackRef.current;
        const wrapper = wrapperRef.current;

        if (!track || !wrapper) return;

        const scrollDistance = track.scrollWidth - wrapper.clientWidth;

        // Main horizontal scroll with physics-like smoothing
        gsap.to(track, {
          x: -scrollDistance,
          ease: 'none',
          scrollTrigger: {
            trigger: wrapper,
            start: 'top top',
            end: () => `+=${scrollDistance}`,
            pin: true,
            scrub: 0.5, // Tighter scrub for snappier feel
            invalidateOnRefresh: true,
          },
        });

        // Animate icons with elastic wobble as they enter
        const icons = track.querySelectorAll('.ticker-icon');
        icons.forEach((icon) => {
          gsap.fromTo(
            icon,
            { scale: 0.5, rotation: -15, opacity: 0 },
            {
              scale: 1,
              rotation: 0,
              opacity: 1,
              duration: 0.6,
              ease: 'elastic.out(1, 0.5)',
              scrollTrigger: {
                trigger: icon,
                containerAnimation: gsap.getById('ticker') || undefined,
                start: 'left 80%',
                toggleActions: 'play none none reverse',
              },
            }
          );
        });

        // Animate text items with spring-like entrance
        const textItems = track.querySelectorAll('.ticker-text');
        textItems.forEach((item) => {
          gsap.fromTo(
            item,
            { y: 30, opacity: 0, scale: 0.9 },
            {
              y: 0,
              opacity: 1,
              scale: 1,
              duration: 0.5,
              ease: 'back.out(1.7)',
              scrollTrigger: {
                trigger: item,
                containerAnimation: gsap.getById('ticker') || undefined,
                start: 'left 85%',
                toggleActions: 'play none none reverse',
              },
            }
          );
        });
      }, 100);
    }, wrapperRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={wrapperRef}
      className="relative h-screen overflow-x-hidden bg-gradient-to-br from-amber-50 via-rose-50 to-violet-50"
    >
      {/* Ambient background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/3 left-1/4 w-80 h-80 bg-rose-200/30 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/3 right-1/4 w-80 h-80 bg-sky-200/30 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 w-60 h-60 bg-violet-200/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      {/* The horizontal track */}
      <div
        ref={trackRef}
        className="relative flex items-center gap-6 md:gap-10 w-max h-full px-[50vw] py-8"
        style={{ flexShrink: 0 }}
      >
        {/* 1. "Describe" */}
        <span className="ticker-text flex-shrink-0 text-5xl md:text-7xl font-black bg-gradient-to-r from-sky-500 to-cyan-500 bg-clip-text text-transparent whitespace-nowrap drop-shadow-sm">
          Describe
        </span>

        <WavyConnector />

        {/* 2. "the word" */}
        <span className="ticker-text flex-shrink-0 text-3xl md:text-5xl font-bold text-slate-700 whitespace-nowrap">
          the word
        </span>

        <LightbulbIcon />

        {/* 3. "but" */}
        <span className="ticker-text flex-shrink-0 text-2xl text-slate-400 font-medium whitespace-nowrap">
          but
        </span>

        <XIcon />

        {/* 4. "DON'T SAY" */}
        <span className="ticker-text flex-shrink-0 text-4xl md:text-6xl font-black text-rose-500 whitespace-nowrap tracking-tight">
          DON&apos;T SAY
        </span>

        <WavyConnector flip />

        {/* 5. Mini Taboo Card */}
        <MiniTabooCard />

        <WavyConnector />

        {/* 6. "your team" */}
        <span className="ticker-text flex-shrink-0 text-3xl md:text-5xl font-bold text-slate-700 whitespace-nowrap">
          your team
        </span>

        <TeamIcon />

        {/* 7. "guesses!" */}
        <div className="flex-shrink-0 flex items-center gap-2">
          <span className="ticker-text text-4xl md:text-6xl font-black bg-gradient-to-r from-emerald-500 to-teal-500 bg-clip-text text-transparent whitespace-nowrap">
            guesses!
          </span>
          <SparkleIcon />
        </div>

        <WavyConnector flip />

        {/* 8. NEW: Time pressure */}
        <span className="ticker-text flex-shrink-0 text-4xl md:text-5xl font-black bg-gradient-to-r from-orange-500 to-amber-500 bg-clip-text text-transparent whitespace-nowrap">
          60 seconds
        </span>

        <TimerIcon />

        <span className="ticker-text flex-shrink-0 text-2xl md:text-3xl font-semibold text-slate-500 whitespace-nowrap">
          per turn
        </span>

        <WavyConnector />

        {/* 9. "score points" */}
        <span className="ticker-text flex-shrink-0 text-3xl md:text-4xl font-bold bg-gradient-to-r from-violet-500 to-purple-500 bg-clip-text text-transparent whitespace-nowrap">
          score points
        </span>

        <ArrowIcon />

        {/* 10. "beat them" */}
        <span className="ticker-text flex-shrink-0 text-4xl md:text-6xl font-black text-slate-700 whitespace-nowrap">
          beat them
        </span>

        <TrophyIcon />

        <WavyConnector flip />

        {/* 11. NEW: Winning condition */}
        <span className="ticker-text flex-shrink-0 text-2xl md:text-3xl font-semibold text-slate-500 whitespace-nowrap">
          first to
        </span>

        <span className="ticker-text flex-shrink-0 text-5xl md:text-7xl font-black bg-gradient-to-r from-pink-500 via-rose-500 to-orange-500 bg-clip-text text-transparent whitespace-nowrap animate-pulse">
          WIN!
        </span>

        <ConfettiIcon />

        {/* 12. Teaser - Clickable button */}
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="flex-shrink-0 flex flex-col items-center gap-2 pl-8 group cursor-pointer"
        >
          <span className="ticker-text text-2xl md:text-3xl font-bold text-slate-500 group-hover:text-violet-500 transition-colors whitespace-nowrap">
            Ready?
          </span>
          <span className="text-lg text-slate-400 group-hover:text-violet-400 transition-colors whitespace-nowrap flex items-center gap-2">
            <svg className="w-4 h-4 animate-bounce" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 10l7-7m0 0l7 7m-7-7v18" />
            </svg>
            click to play
            <svg className="w-4 h-4 animate-bounce" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 10l7-7m0 0l7 7m-7-7v18" />
            </svg>
          </span>
        </button>
      </div>

      {/* Scroll hint */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center text-slate-400">
        <span className="text-sm mb-2 animate-pulse">Keep scrolling</span>
        <svg className="w-6 h-6 animate-bounce" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
        </svg>
      </div>
    </section>
  );
}
