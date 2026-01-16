'use client';

import { motion, HTMLMotionProps, Variants } from 'framer-motion';
import { slideInFromLeft, slideInFromRight } from '@/lib/animations/variants';
import { ReactNode } from 'react';

interface SlideInProps extends Omit<HTMLMotionProps<'div'>, 'children'> {
  children: ReactNode;
  direction?: 'left' | 'right';
  delay?: number;
  duration?: number;
  className?: string;
}

export function SlideIn({
  children,
  direction = 'left',
  delay = 0,
  duration,
  className = '',
  ...props
}: SlideInProps) {
  const variants: Variants =
    direction === 'left' ? slideInFromLeft : slideInFromRight;

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
