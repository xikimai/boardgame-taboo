'use client';

import { useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import { getAvatarUrl, DICEBEAR_STYLES, type DiceBearStyle } from '@/lib/avatars';

gsap.registerPlugin(useGSAP, ScrollTrigger);

// Sample avatar seeds for the tutorial showcase
const SAMPLE_AVATAR_SEEDS = ['player1', 'player2', 'player3', 'player4'];

// Pick a few different styles to showcase variety
const SHOWCASE_STYLES: DiceBearStyle[] = ['adventurer', 'avataaars', 'bottts', 'fun-emoji'];

interface Step {
  icon: React.ReactNode;
  title: string;
  description: string;
  color: string;
}

const steps: Step[] = [
  {
    icon: <TeamIcon />,
    title: 'Form Teams',
    description: 'Split into Blue vs Red teams',
    color: 'from-blue-500 to-cyan-500',
  },
  {
    icon: <SpeechIcon />,
    title: 'Give Clues',
    description: 'Describe words without saying them',
    color: 'from-purple-500 to-pink-500',
  },
  {
    icon: <ForbiddenIcon />,
    title: 'Avoid Taboo',
    description: "Don't say the forbidden words!",
    color: 'from-red-500 to-orange-500',
  },
  {
    icon: <TrophyIcon />,
    title: 'Score Points',
    description: 'Most points wins!',
    color: 'from-yellow-500 to-green-500',
  },
];

export function HowToPlayGuide() {
  const containerRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const stepsRef = useRef<HTMLDivElement[]>([]);
  const arrowsRef = useRef<HTMLDivElement[]>([]);

  useGSAP(
    () => {
      // Title animation
      gsap.fromTo(
        titleRef.current,
        { opacity: 0, y: 30 },
        {
          opacity: 1,
          y: 0,
          duration: 0.6,
          scrollTrigger: {
            trigger: titleRef.current,
            start: 'top 90%',
            toggleActions: 'play none none reverse',
          },
        }
      );

      // Steps stagger animation
      stepsRef.current.forEach((step, index) => {
        gsap.fromTo(
          step,
          {
            opacity: 0,
            y: 40,
            scale: 0.9,
          },
          {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 0.5,
            ease: 'back.out(1.2)',
            scrollTrigger: {
              trigger: step,
              start: 'top 85%',
              toggleActions: 'play none none reverse',
            },
            delay: index * 0.1,
          }
        );

        // Icon bounce effect
        const icon = step.querySelector('.step-icon');
        if (icon) {
          gsap.fromTo(
            icon,
            { scale: 0, rotate: -10 },
            {
              scale: 1,
              rotate: 0,
              duration: 0.4,
              ease: 'back.out(2)',
              scrollTrigger: {
                trigger: step,
                start: 'top 85%',
                toggleActions: 'play none none reverse',
              },
              delay: index * 0.1 + 0.2,
            }
          );
        }
      });

      // Arrows draw-in animation (desktop only)
      arrowsRef.current.forEach((arrow, index) => {
        gsap.fromTo(
          arrow,
          { scaleX: 0, opacity: 0 },
          {
            scaleX: 1,
            opacity: 1,
            duration: 0.3,
            ease: 'power2.out',
            scrollTrigger: {
              trigger: arrow,
              start: 'top 85%',
              toggleActions: 'play none none reverse',
            },
            delay: index * 0.1 + 0.3,
          }
        );
      });
    },
    { scope: containerRef }
  );

  return (
    <div ref={containerRef} className="mt-12 pt-8 border-t border-slate-200 dark:border-slate-700">
      <h2
        ref={titleRef}
        className="text-xl font-bold text-center mb-8 text-slate-800 dark:text-slate-200"
      >
        How to Play
      </h2>

      {/* Desktop: Horizontal layout */}
      <div className="hidden md:flex items-start justify-center gap-2">
        {steps.map((step, index) => (
          <div key={index} className="flex items-center">
            <div
              ref={(el) => {
                if (el) stepsRef.current[index] = el;
              }}
              className="flex flex-col items-center w-36"
            >
              <div
                className={`step-icon w-16 h-16 rounded-2xl bg-gradient-to-br ${step.color} flex items-center justify-center text-white mb-3 shadow-lg`}
              >
                {step.icon}
              </div>
              <span className="text-xs font-bold text-slate-400 mb-1">
                Step {index + 1}
              </span>
              <h3 className="font-semibold text-slate-800 dark:text-slate-200 text-center">
                {step.title}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 text-center mt-1">
                {step.description}
              </p>
              {/* Avatar showcase for Step 1 */}
              {index === 0 && <AvatarShowcase />}
            </div>

            {/* Arrow between steps */}
            {index < steps.length - 1 && (
              <div
                ref={(el) => {
                  if (el) arrowsRef.current[index] = el;
                }}
                className="mx-2 origin-left"
              >
                <ArrowRight />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Mobile: Vertical layout */}
      <div className="md:hidden space-y-4">
        {steps.map((step, index) => (
          <div key={index}>
            <div
              ref={(el) => {
                // Different refs for mobile
                if (el && window.innerWidth < 768) {
                  stepsRef.current[index] = el;
                }
              }}
              className="flex items-center gap-4 p-4 bg-white dark:bg-slate-800 rounded-xl shadow-sm"
            >
              <div
                className={`step-icon w-14 h-14 rounded-xl bg-gradient-to-br ${step.color} flex items-center justify-center text-white shadow-md flex-shrink-0`}
              >
                {step.icon}
              </div>
              <div className="flex-1">
                <span className="text-xs font-bold text-slate-400">
                  Step {index + 1}
                </span>
                <h3 className="font-semibold text-slate-800 dark:text-slate-200">
                  {step.title}
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {step.description}
                </p>
                {/* Avatar showcase for Step 1 (mobile) */}
                {index === 0 && (
                  <div className="flex gap-1 mt-2">
                    {SAMPLE_AVATAR_SEEDS.map((seed, i) => (
                      <img
                        key={seed}
                        src={getAvatarUrl(seed, 24, SHOWCASE_STYLES[i % SHOWCASE_STYLES.length])}
                        alt=""
                        className="w-6 h-6 rounded-full ring-2 ring-white dark:ring-slate-800"
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Arrow down between steps */}
            {index < steps.length - 1 && (
              <div className="flex justify-center py-2">
                <ArrowDown />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ============ Avatar Showcase Component ============

function AvatarShowcase() {
  return (
    <div className="flex justify-center gap-1 mt-2">
      {SAMPLE_AVATAR_SEEDS.map((seed, index) => (
        <img
          key={seed}
          src={getAvatarUrl(seed, 24, SHOWCASE_STYLES[index % SHOWCASE_STYLES.length])}
          alt=""
          className="w-6 h-6 rounded-full ring-2 ring-white dark:ring-slate-800 -ml-1 first:ml-0"
        />
      ))}
    </div>
  );
}

// ============ Icon Components ============

function TeamIcon() {
  return (
    <svg
      width="28"
      height="28"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function SpeechIcon() {
  return (
    <svg
      width="28"
      height="28"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      <path d="M8 10h.01" />
      <path d="M12 10h.01" />
      <path d="M16 10h.01" />
    </svg>
  );
}

function ForbiddenIcon() {
  return (
    <svg
      width="28"
      height="28"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="m4.93 4.93 14.14 14.14" />
    </svg>
  );
}

function TrophyIcon() {
  return (
    <svg
      width="28"
      height="28"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
      <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
      <path d="M4 22h16" />
      <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
      <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
      <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
    </svg>
  );
}

function ArrowRight() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      className="text-slate-300 dark:text-slate-600"
    >
      <path
        d="M5 12h14M12 5l7 7-7 7"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ArrowDown() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      className="text-slate-300 dark:text-slate-600"
    >
      <path
        d="M12 5v14M5 12l7 7 7-7"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
