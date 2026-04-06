import { useEffect, useRef, useCallback } from 'react';

const EXIT_INTENT_SESSION_KEY = 'exit_intent_shown';

interface UseExitIntentOptions {
  onExitIntent: () => void;
  enabled?: boolean;
  threshold?: number;
}

export function useExitIntent({ onExitIntent, enabled = true, threshold = 20 }: UseExitIntentOptions) {
  const handlerRef = useRef(onExitIntent);
  handlerRef.current = onExitIntent;

  const hasTriggeredRef = useRef(false);
  const triggeredByNavRef = useRef(false);

  const checkAlreadyShown = useCallback(() => {
    return sessionStorage.getItem(EXIT_INTENT_SESSION_KEY) === 'true';
  }, []);

  const markAsShown = useCallback(() => {
    sessionStorage.setItem(EXIT_INTENT_SESSION_KEY, 'true');
  }, []);

  // Was the last trigger caused by navigation (back button)?
  const wasTriggeredByNav = useCallback(() => triggeredByNavRef.current, []);

  useEffect(() => {
    if (!enabled) return;

    const isMobile = window.innerWidth < 768 || /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    if (isMobile) return;

    // --- Mouse leave trigger ---
    const handleMouseLeave = (e: MouseEvent) => {
      if (hasTriggeredRef.current) return;
      if (checkAlreadyShown()) return;

      if (e.clientY <= threshold) {
        hasTriggeredRef.current = true;
        triggeredByNavRef.current = false;
        markAsShown();
        handlerRef.current();
      }
    };

    // --- History trap trigger ---
    window.history.pushState({ exitIntentTrap: true }, '', window.location.href);

    const handlePopState = () => {
      if (hasTriggeredRef.current || checkAlreadyShown()) {
        // Already shown, let navigation proceed
        return;
      }

      hasTriggeredRef.current = true;
      triggeredByNavRef.current = true;
      markAsShown();

      // Re-push to prevent actual navigation while modal is open
      window.history.pushState({ exitIntentTrap: true }, '', window.location.href);
      handlerRef.current();
    };

    document.addEventListener('mouseleave', handleMouseLeave);
    window.addEventListener('popstate', handlePopState);

    return () => {
      document.removeEventListener('mouseleave', handleMouseLeave);
      window.removeEventListener('popstate', handlePopState);
    };
  }, [enabled, threshold, checkAlreadyShown, markAsShown]);

  return { wasTriggeredByNav };
}
