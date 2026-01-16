'use client';

import { useRef, useEffect } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

gsap.registerPlugin(useGSAP);

interface ScoreCounterProps {
  score: number;
  color?: string;
  size?: 'sm' | 'md' | 'lg';
  animate?: boolean;
}

const sizeClasses = {
  sm: 'text-2xl',
  md: 'text-3xl',
  lg: 'text-5xl',
};

export function ScoreCounter({
  score,
  color,
  size = 'md',
  animate = true,
}: ScoreCounterProps) {
  const displayRef = useRef<HTMLSpanElement>(null);
  const prevScoreRef = useRef(score);

  useEffect(() => {
    if (!displayRef.current || !animate) {
      if (displayRef.current) {
        displayRef.current.textContent = score.toString();
      }
      return;
    }

    const prevScore = prevScoreRef.current;

    // Animate the number rolling
    gsap.to(
      { value: prevScore },
      {
        value: score,
        duration: 0.5,
        ease: 'power2.out',
        onUpdate: function () {
          if (displayRef.current) {
            displayRef.current.textContent = Math.round(this.targets()[0].value).toString();
          }
        },
      }
    );

    // Bump effect on change
    if (prevScore !== score) {
      gsap.fromTo(
        displayRef.current,
        { scale: 1 },
        {
          scale: 1.2,
          duration: 0.15,
          ease: 'power2.out',
          yoyo: true,
          repeat: 1,
        }
      );
    }

    prevScoreRef.current = score;
  }, [score, animate]);

  return (
    <span
      ref={displayRef}
      className={`font-bold ${sizeClasses[size]} inline-block`}
      style={{ color }}
    >
      {score}
    </span>
  );
}
