import type { Variants } from 'framer-motion';

// ============ Basic Entrance Animations ============

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.5, ease: 'easeOut' },
  },
  exit: { opacity: 0, transition: { duration: 0.3 } },
};

export const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: 'easeOut' },
  },
  exit: { opacity: 0, y: -10, transition: { duration: 0.3 } },
};

export const fadeInDown: Variants = {
  hidden: { opacity: 0, y: -20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: 'easeOut' },
  },
  exit: { opacity: 0, y: 10, transition: { duration: 0.3 } },
};

// ============ Slide Animations ============

export const slideInFromLeft: Variants = {
  hidden: { opacity: 0, x: -50 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] },
  },
  exit: { opacity: 0, x: -30, transition: { duration: 0.3 } },
};

export const slideInFromRight: Variants = {
  hidden: { opacity: 0, x: 50 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] },
  },
  exit: { opacity: 0, x: 30, transition: { duration: 0.3 } },
};

// ============ Scale Animations ============

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.4, ease: [0.34, 1.56, 0.64, 1] },
  },
  exit: { opacity: 0, scale: 0.95, transition: { duration: 0.2 } },
};

export const popIn: Variants = {
  hidden: { opacity: 0, scale: 0.5 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      type: 'spring',
      stiffness: 400,
      damping: 15,
    },
  },
  exit: { opacity: 0, scale: 0.8, transition: { duration: 0.2 } },
};

// ============ Container Animations (for staggering children) ============

export const staggerContainer: Variants = {
  hidden: { opacity: 1 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
};

export const staggerContainerFast: Variants = {
  hidden: { opacity: 1 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.05,
    },
  },
};

export const staggerContainerSlow: Variants = {
  hidden: { opacity: 1 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2,
      delayChildren: 0.2,
    },
  },
};

// ============ Card Animations ============

export const cardFlip: Variants = {
  hidden: {
    rotateY: -90,
    opacity: 0,
  },
  visible: {
    rotateY: 0,
    opacity: 1,
    transition: {
      duration: 0.5,
      ease: [0.25, 0.46, 0.45, 0.94],
    },
  },
  exit: {
    rotateY: 90,
    opacity: 0,
    transition: { duration: 0.3 },
  },
};

// ============ Button Animations ============

export const buttonHover = {
  scale: 1.03,
  transition: { duration: 0.2 },
};

export const buttonTap = {
  scale: 0.97,
};

export const pulsingButton: Variants = {
  idle: { scale: 1 },
  pulse: {
    scale: [1, 1.02, 1],
    transition: {
      duration: 1.5,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
};

// ============ Buzz/Alert Animations ============

export const buzzOverlay: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.1 },
  },
  exit: { opacity: 0, transition: { duration: 0.3 } },
};

export const buzzText: Variants = {
  hidden: { scale: 0.5, opacity: 0 },
  visible: {
    scale: 1,
    opacity: 1,
    transition: {
      type: 'spring',
      stiffness: 500,
      damping: 12,
    },
  },
  exit: { scale: 1.2, opacity: 0, transition: { duration: 0.2 } },
};

export const shake: Variants = {
  shake: {
    x: [0, -10, 10, -10, 10, -5, 5, 0],
    transition: { duration: 0.5 },
  },
};

// ============ Score Counter Animations ============

export const scoreChange: Variants = {
  hidden: { scale: 1 },
  bump: {
    scale: [1, 1.3, 1],
    transition: { duration: 0.3 },
  },
};

// ============ Letter Animations (for hero text) ============

export const letterContainer: Variants = {
  hidden: { opacity: 1 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.3,
    },
  },
};

export const letterItem: Variants = {
  hidden: {
    opacity: 0,
    y: 50,
    rotateX: -90,
  },
  visible: {
    opacity: 1,
    y: 0,
    rotateX: 0,
    transition: {
      type: 'spring',
      stiffness: 200,
      damping: 12,
    },
  },
};

// ============ Tab Indicator ============

export const tabIndicator = {
  layout: true,
  transition: {
    type: 'spring',
    stiffness: 500,
    damping: 30,
  },
};
