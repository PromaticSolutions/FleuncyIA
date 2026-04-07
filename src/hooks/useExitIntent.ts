import { useEffect, useRef, useCallback } from 'react';

interface UseExitIntentOptions {
  onExitIntent: () => void;
  enabled?: boolean;
}

export function useExitIntent({ onExitIntent, enabled = true }: UseExitIntentOptions) {
  const handlerRef = useRef(onExitIntent);
  handlerRef.current = onExitIntent;

  const hasTriggeredRef = useRef(false);
  const isClosingRef = useRef(false);

  useEffect(() => {
    if (!enabled) return;

    // Push a trap state so "back" triggers popstate instead of leaving
    window.history.pushState({ exitIntentTrap: true }, '', window.location.href);

    const handlePopState = (e: PopStateEvent) => {
      // If we're programmatically going back after modal close, ignore
      if (isClosingRef.current) {
        isClosingRef.current = false;
        return;
      }

      if (hasTriggeredRef.current) return;

      hasTriggeredRef.current = true;
      // Re-push trap so user stays on the page while modal is open
      window.history.pushState({ exitIntentTrap: true }, '', window.location.href);
      handlerRef.current();
    };

    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [enabled]);

  const resetTrigger = useCallback(() => {
    hasTriggeredRef.current = false;
  }, []);

  const navigateBack = useCallback(() => {
    isClosingRef.current = true;
    window.history.back();
  }, []);

  return { resetTrigger, navigateBack };
}
