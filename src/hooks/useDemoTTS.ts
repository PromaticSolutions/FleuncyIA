import { useState, useCallback, useRef } from 'react';

interface UseDemoTTSOptions {
  language?: string;
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (error: string) => void;
}

/**
 * TTS hook for demo mode - uses anon key instead of auth token
 */
export function useDemoTTS(options: UseDemoTTSOptions = {}) {
  const { language = 'english', onStart, onEnd, onError } = options;
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const currentUrlRef = useRef<string | null>(null);
  const generationRef = useRef(0);
  const abortControllerRef = useRef<AbortController | null>(null);

  const cleanup = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    if (audioRef.current) {
      audioRef.current.oncanplaythrough = null;
      audioRef.current.onended = null;
      audioRef.current.onerror = null;
      audioRef.current.pause();
      audioRef.current.src = '';
      audioRef.current = null;
    }
    if (currentUrlRef.current) {
      URL.revokeObjectURL(currentUrlRef.current);
      currentUrlRef.current = null;
    }
  }, []);

  const stop = useCallback(() => {
    generationRef.current += 1;
    cleanup();
    setIsSpeaking(false);
    setIsLoading(false);
  }, [cleanup]);

  const speak = useCallback(async (text: string): Promise<void> => {
    if (!text.trim()) return;
    stop();
    const myGeneration = generationRef.current;
    setIsLoading(true);
    onStart?.();

    try {
      if (generationRef.current !== myGeneration) return;

      const controller = new AbortController();
      abortControllerRef.current = controller;

      const TTS_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/text-to-speech`;
      
      const response = await fetch(TTS_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ text, language, isDemoMode: true }),
        signal: controller.signal,
      });

      if (generationRef.current !== myGeneration) return;

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Falha ao gerar áudio');
      }

      const audioBlob = await response.blob();
      if (generationRef.current !== myGeneration) return;

      const audioUrl = URL.createObjectURL(audioBlob);
      currentUrlRef.current = audioUrl;
      const audio = new Audio(audioUrl);
      audioRef.current = audio;

      return new Promise<void>((resolve) => {
        if (generationRef.current !== myGeneration) {
          URL.revokeObjectURL(audioUrl);
          currentUrlRef.current = null;
          resolve();
          return;
        }

        audio.oncanplaythrough = () => {
          if (generationRef.current !== myGeneration) { cleanup(); resolve(); return; }
          setIsLoading(false);
          setIsSpeaking(true);
          audio.play().catch(() => { setIsSpeaking(false); cleanup(); resolve(); });
        };
        audio.onended = () => { setIsSpeaking(false); cleanup(); onEnd?.(); resolve(); };
        audio.onerror = () => { setIsLoading(false); setIsSpeaking(false); cleanup(); onError?.('Erro ao reproduzir áudio'); resolve(); };
      });
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return;
      if (generationRef.current === myGeneration) {
        setIsLoading(false);
        setIsSpeaking(false);
        onError?.(error instanceof Error ? error.message : 'Erro desconhecido');
      }
    }
  }, [language, onStart, onEnd, onError, stop, cleanup]);

  return { speak, stop, isSpeaking, isLoading, isSupported: true };
}
