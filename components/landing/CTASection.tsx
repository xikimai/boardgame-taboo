'use client';

import { useRef, useLayoutEffect } from 'react';
import { motion } from 'framer-motion';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Link from 'next/link';

gsap.registerPlugin(ScrollTrigger);

export function CTASection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        contentRef.current,
        { y: 60, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.8,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top 80%',
          },
        }
      );
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-violet-50 via-rose-50 to-amber-50 py-20"
    >
      {/* Background gradient orbs */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 right-1/4 w-80 h-80 bg-rose-200/30 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 left-1/4 w-80 h-80 bg-violet-200/30 rounded-full blur-3xl" />
      </div>

      <div ref={contentRef} className="relative z-10 text-center px-6 max-w-2xl mx-auto">
        {/* Tagline */}
        <h2 className="text-4xl md:text-5xl font-black bg-gradient-to-r from-violet-600 via-rose-500 to-amber-500 bg-clip-text text-transparent mb-6">
          Ready to Play?
        </h2>

        <p className="text-lg text-slate-500 mb-10">
          Gather your friends, split into teams, and see who can describe without saying the forbidden words.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/">
            <motion.button
              className="relative px-8 py-4 bg-gradient-to-r from-rose-400 via-violet-400 to-sky-400 text-white font-bold text-lg rounded-xl shadow-lg shadow-rose-300/30 overflow-hidden group"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.98 }}
            >
              {/* Shine effect */}
              <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
              <span className="relative">Start Playing</span>
            </motion.button>
          </Link>
        </div>

        {/* Footer note */}
        <p className="mt-12 text-sm text-slate-400">
          Free to play. No account required.
        </p>
      </div>
    </section>
  );
}
