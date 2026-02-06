import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface UseElevenLabsTTSOptions {
  language?: string;
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (error: string) => void;
}

export function useElevenLabsTTS(options: UseElevenLabsTTSOptions = {}) {
  const { language = 'english', onStart, onEnd, onError } = options;
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const currentUrlRef = useRef<string | null>(null);
  // Generation counter: incremented on every speak/stop call.
  // Any in-flight request whose generation doesn't match is stale and discarded.
  const generationRef = useRef(0);
  // AbortController for the current fetch request
  const abortControllerRef = useRef<AbortController | null>(null);

  const cleanup = useCallback(() => {
    // Abort any pending fetch
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    // Stop and destroy any current audio element
    if (audioRef.current) {
      audioRef.current.oncanplaythrough = null;
      audioRef.current.onended = null;
      audioRef.current.onerror = null;
      audioRef.current.pause();
      audioRef.current.src = '';
      audioRef.current = null;
    }
    // Revoke any blob URL
    if (currentUrlRef.current) {
      URL.revokeObjectURL(currentUrlRef.current);
      currentUrlRef.current = null;
    }
  }, []);

  const stop = useCallback(() => {
    // Increment generation to invalidate any in-flight request
    generationRef.current += 1;
    cleanup();
    setIsSpeaking(false);
    setIsLoading(false);
  }, [cleanup]);

  const speak = useCallback(async (text: string): Promise<void> => {
    if (!text.trim()) return;
    
    // Stop any current playback and invalidate previous requests
    stop();
    
    // Claim a new generation for this request
    const myGeneration = generationRef.current;
    
    setIsLoading(true);
    onStart?.();

    try {
      // Get user session token for authentication
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('Sessão expirada');
      }

      // Check if this request is still current
      if (generationRef.current !== myGeneration) {
        return; // A newer speak() or stop() was called; discard
      }

      const controller = new AbortController();
      abortControllerRef.current = controller;

      const TTS_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/text-to-speech`;
      
      const response = await fetch(TTS_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ text, language }),
        signal: controller.signal,
      });

      // Check again after fetch completes
      if (generationRef.current !== myGeneration) {
        return; // Stale request
      }

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Sessão expirada. Faça login novamente.');
        }
        const errorData = await response.json();
        throw new Error(errorData.error || 'Falha ao gerar áudio');
      }

      // Get audio blob from stream
      const audioBlob = await response.blob();
      
      // Check once more before creating audio
      if (generationRef.current !== myGeneration) {
        return; // Stale request
      }

      const audioUrl = URL.createObjectURL(audioBlob);
      currentUrlRef.current = audioUrl;

      // Create and play audio
      const audio = new Audio(audioUrl);
      audioRef.current = audio;

      return new Promise<void>((resolve) => {
        // Final staleness check before playing
        if (generationRef.current !== myGeneration) {
          URL.revokeObjectURL(audioUrl);
          currentUrlRef.current = null;
          resolve();
          return;
        }

        audio.oncanplaythrough = () => {
          // Guard: only play if still current generation
          if (generationRef.current !== myGeneration) {
            cleanup();
            resolve();
            return;
          }
          setIsLoading(false);
          setIsSpeaking(true);
          audio.play().catch(() => {
            setIsSpeaking(false);
            cleanup();
            resolve();
          });
        };

        audio.onended = () => {
          setIsSpeaking(false);
          cleanup();
          onEnd?.();
          resolve();
        };

        audio.onerror = () => {
          setIsLoading(false);
          setIsSpeaking(false);
          cleanup();
          const error = 'Erro ao reproduzir áudio';
          onError?.(error);
          resolve(); // Resolve instead of reject to prevent unhandled rejections
        };
      });

    } catch (error) {
      // Ignore abort errors (expected when we cancel)
      if (error instanceof DOMException && error.name === 'AbortError') {
        return;
      }
      // Only update state if this is still the current generation
      if (generationRef.current === myGeneration) {
        setIsLoading(false);
        setIsSpeaking(false);
        const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
        onError?.(errorMessage);
      }
    }
  }, [language, onStart, onEnd, onError, stop, cleanup]);

  return {
    speak,
    stop,
    isSpeaking,
    isLoading,
    isSupported: true,
  };
}
