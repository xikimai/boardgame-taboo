'use client';

import { useState, useCallback, useRef } from 'react';
import { BUTTON_DEBOUNCE_MS } from '@/lib/game';

/**
 * Hook to debounce a callback function
 * Prevents rapid-fire calls and provides loading state
 */
export function useDebounceAction(
  action: () => void,
  delay: number = BUTTON_DEBOUNCE_MS
): [() => void, boolean] {
  const [isDisabled, setIsDisabled] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const debouncedAction = useCallback(() => {
    if (isDisabled) return;

    setIsDisabled(true);
    action();

    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Re-enable after delay
    timeoutRef.current = setTimeout(() => {
      setIsDisabled(false);
    }, delay);
  }, [action, delay, isDisabled]);

  return [debouncedAction, isDisabled];
}
