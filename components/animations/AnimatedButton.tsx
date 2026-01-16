'use client';

import { motion, HTMLMotionProps } from 'framer-motion';
import { buttonHover, buttonTap } from '@/lib/animations/variants';

interface AnimatedButtonProps extends HTMLMotionProps<'button'> {
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'warning';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  isLoading?: boolean;
  pulse?: boolean;
  /** Optional callback to play a click sound when button is pressed */
  playSound?: () => void;
}

const variantClasses = {
  primary:
    'bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white',
  secondary:
    'bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200',
  success:
    'bg-green-500 hover:bg-green-600 disabled:bg-green-300 text-white',
  danger:
    'bg-red-500 hover:bg-red-600 disabled:bg-red-300 text-white',
  warning:
    'bg-yellow-500 hover:bg-yellow-600 disabled:bg-yellow-300 text-white',
};

const sizeClasses = {
  sm: 'py-2 px-3 text-sm rounded-lg',
  md: 'py-3 px-4 text-base rounded-lg',
  lg: 'py-4 px-6 text-lg rounded-xl',
};

export function AnimatedButton({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  isLoading = false,
  pulse = false,
  playSound,
  className = '',
  disabled,
  onClick,
  ...props
}: AnimatedButtonProps) {
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (playSound && !disabled && !isLoading) {
      playSound();
    }
    onClick?.(e);
  };

  return (
    <motion.button
      whileHover={!disabled && !isLoading ? buttonHover : undefined}
      whileTap={!disabled && !isLoading ? buttonTap : undefined}
      animate={pulse && !disabled ? { scale: [1, 1.02, 1] } : undefined}
      transition={
        pulse
          ? { duration: 1.5, repeat: Infinity, ease: 'easeInOut' }
          : undefined
      }
      disabled={disabled || isLoading}
      onClick={handleClick}
      className={`
        font-semibold transition-colors
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${fullWidth ? 'w-full' : ''}
        ${disabled || isLoading ? 'cursor-not-allowed' : ''}
        ${className}
      `}
      {...props}
    >
      {isLoading ? (
        <span className="flex items-center justify-center gap-2">
          <motion.span
            className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          />
          Loading...
        </span>
      ) : (
        children
      )}
    </motion.button>
  );
}
