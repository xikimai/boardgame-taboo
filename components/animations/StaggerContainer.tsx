'use client';

import { motion, HTMLMotionProps } from 'framer-motion';
import {
  staggerContainer,
  staggerContainerFast,
  staggerContainerSlow,
} from '@/lib/animations/variants';
import { ReactNode } from 'react';

interface StaggerContainerProps extends Omit<HTMLMotionProps<'div'>, 'children'> {
  children: ReactNode;
  speed?: 'fast' | 'normal' | 'slow';
  className?: string;
}

export function StaggerContainer({
  children,
  speed = 'normal',
  className = '',
  ...props
}: StaggerContainerProps) {
  const variants =
    speed === 'fast'
      ? staggerContainerFast
      : speed === 'slow'
        ? staggerContainerSlow
        : staggerContainer;

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={variants}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}

// Child item that auto-animates within StaggerContainer
interface StaggerItemProps extends Omit<HTMLMotionProps<'div'>, 'children'> {
  children: ReactNode;
  className?: string;
}

export function StaggerItem({ children, className = '', ...props }: StaggerItemProps) {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 20 },
        visible: {
          opacity: 1,
          y: 0,
          transition: { duration: 0.4, ease: 'easeOut' },
        },
      }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}
