import { useState, useCallback, useEffect, useRef } from 'react';

interface UseSpeechSynthesisOptions {
  lang?: string;
  rate?: number;
  pitch?: number;
  volume?: number;
}

export const useSpeechSynthesis = (options: UseSpeechSynthesisOptions = {}) => {
  const {
    lang = 'en-US',
    rate = 0.9,
    pitch = 1,
    volume = 1,
  } = options;

  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      setIsSupported(true);
      
      const loadVoices = () => {
        const availableVoices = window.speechSynthesis.getVoices();
        setVoices(availableVoices);
      };

      loadVoices();
      window.speechSynthesis.onvoiceschanged = loadVoices;

      return () => {
        window.speechSynthesis.onvoiceschanged = null;
      };
    }
  }, []);

  const getPreferredVoice = useCallback(() => {
    // Prefer natural/enhanced voices
    const englishVoices = voices.filter(v => v.lang.startsWith('en'));
    
    // Prioritize Google or Microsoft voices for better quality
    const premiumVoice = englishVoices.find(v => 
      v.name.includes('Google') || 
      v.name.includes('Microsoft') ||
      v.name.includes('Natural') ||
      v.name.includes('Premium')
    );
    
    if (premiumVoice) return premiumVoice;
    
    // Fallback to any English voice
    return englishVoices[0] || voices[0];
  }, [voices]);

  const speak = useCallback((text: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (!isSupported) {
        reject(new Error('Speech synthesis not supported'));
        return;
      }

      // Cancel any ongoing speech
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utteranceRef.current = utterance;

      const voice = getPreferredVoice();
      if (voice) {
        utterance.voice = voice;
      }

      utterance.lang = lang;
      utterance.rate = rate;
      utterance.pitch = pitch;
      utterance.volume = volume;

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => {
        setIsSpeaking(false);
        resolve();
      };
      utterance.onerror = (event) => {
        setIsSpeaking(false);
        reject(new Error(event.error));
      };

      window.speechSynthesis.speak(utterance);
    });
  }, [isSupported, lang, rate, pitch, volume, getPreferredVoice]);

  const stop = useCallback(() => {
    if (isSupported) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  }, [isSupported]);

  const pause = useCallback(() => {
    if (isSupported) {
      window.speechSynthesis.pause();
    }
  }, [isSupported]);

  const resume = useCallback(() => {
    if (isSupported) {
      window.speechSynthesis.resume();
    }
  }, [isSupported]);

  return {
    speak,
    stop,
    pause,
    resume,
    isSpeaking,
    isSupported,
    voices,
  };
};
