'use client';

import { motion, HTMLMotionProps, Variants } from 'framer-motion';
import { fadeIn, fadeInUp, fadeInDown } from '@/lib/animations/variants';
import { ReactNode } from 'react';

interface FadeInProps extends Omit<HTMLMotionProps<'div'>, 'children'> {
  children: ReactNode;
  direction?: 'none' | 'up' | 'down';
  delay?: number;
  duration?: number;
  className?: string;
}

export function FadeIn({
  children,
  direction = 'none',
  delay = 0,
  duration,
  className = '',
  ...props
}: FadeInProps) {
  const variants: Variants =
    direction === 'up'
      ? fadeInUp
      : direction === 'down'
        ? fadeInDown
        : fadeIn;

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      exit="exit"
      variants={variants}
      transition={{
        delay,
        ...(duration && { duration }),
      }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}
