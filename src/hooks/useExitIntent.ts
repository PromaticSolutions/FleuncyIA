import { useEffect, useRef, useCallback } from 'react';

const EXIT_INTENT_SESSION_KEY = 'exit_intent_shown';

interface UseExitIntentOptions {
  onExitIntent: () => void;
  enabled?: boolean;
  threshold?: number; // px from top to trigger
}

export function useExitIntent({ onExitIntent, enabled = true, threshold = 20 }: UseExitIntentOptions) {
  const handlerRef = useRef(onExitIntent);
  handlerRef.current = onExitIntent;

  const hasTriggeredRef = useRef(false);

  const checkAlreadyShown = useCallback(() => {
    return sessionStorage.getItem(EXIT_INTENT_SESSION_KEY) === 'true';
  }, []);

  const markAsShown = useCallback(() => {
    sessionStorage.setItem(EXIT_INTENT_SESSION_KEY, 'true');
  }, []);

  useEffect(() => {
    if (!enabled) return;

    // Only on desktop
    const isMobile = window.innerWidth < 768 || /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    if (isMobile) return;

    const handleMouseLeave = (e: MouseEvent) => {
      if (hasTriggeredRef.current) return;
      if (checkAlreadyShown()) return;

      // Trigger when mouse leaves through the top of the page
      if (e.clientY <= threshold) {
        hasTriggeredRef.current = true;
        markAsShown();
        handlerRef.current();
      }
    };

    document.addEventListener('mouseleave', handleMouseLeave);
    return () => {
      document.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [enabled, threshold, checkAlreadyShown, markAsShown]);
}
