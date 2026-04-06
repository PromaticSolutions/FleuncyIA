import { useEffect, useRef, useCallback } from 'react';

interface UseExitIntentOptions {
  onExitIntent: () => void;
  enabled?: boolean;
}

export function useExitIntent({ onExitIntent, enabled = true }: UseExitIntentOptions) {
  const handlerRef = useRef(onExitIntent);
  handlerRef.current = onExitIntent;

  const hasTriggeredRef = useRef(false);

  const wasTriggeredByNav = useCallback(() => true, []);

  useEffect(() => {
    if (!enabled) return;

    const isMobile = window.innerWidth < 768 || /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    if (isMobile) return;

    window.history.pushState({ exitIntentTrap: true }, '', window.location.href);

    const handlePopState = () => {
      if (hasTriggeredRef.current) return;

      hasTriggeredRef.current = true;
      window.history.pushState({ exitIntentTrap: true }, '', window.location.href);
      handlerRef.current();
    };

    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [enabled]);

  // Reset trigger flag when modal closes so it can fire again
  const resetTrigger = useCallback(() => {
    hasTriggeredRef.current = false;
  }, []);

  return { wasTriggeredByNav, resetTrigger };
}
