import { useState, useRef, useCallback } from 'react';

interface UseDemoAudioRecorderOptions {
  onAutoSend?: (text: string) => void;
  onError?: (error: string) => void;
  language?: string;
}

/**
 * Audio recorder for demo mode - uses anon key for STT instead of auth token
 */
export function useDemoAudioRecorder({ onAutoSend, onError, language = 'english' }: UseDemoAudioRecorderOptions = {}) {
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const startRecording = useCallback(async () => {
    try {
      if ('vibrate' in navigator) navigator.vibrate(50);
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true, sampleRate: 16000 }
      });
      
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus') 
        ? 'audio/webm;codecs=opus' : 'audio/webm';
      
      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        if ('vibrate' in navigator) navigator.vibrate([30, 50, 30]);
        const blob = new Blob(chunksRef.current, { type: mimeType });
        stream.getTracks().forEach(track => track.stop());
        await transcribeAudio(blob, mimeType);
      };

      mediaRecorder.start(100);
      setIsRecording(true);
    } catch {
      onError?.('Não foi possível acessar o microfone. Verifique as permissões.');
    }
  }, [onError, language]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  }, [isRecording]);

  const cancelRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      chunksRef.current = [];
    }
  }, [isRecording]);

  const transcribeAudio = async (blob: Blob, mimeType: string) => {
    setIsTranscribing(true);
    try {
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve((reader.result as string).split(',')[1]);
        reader.onerror = reject;
      });
      reader.readAsDataURL(blob);
      const base64Audio = await base64Promise;

      const STT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/speech-to-text`;
      const response = await fetch(STT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ audio: base64Audio, mimeType, language, isDemoMode: true }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro na transcrição');
      }

      const data = await response.json();
      if (data?.text) {
        onAutoSend?.(data.text);
      } else {
        onError?.('Não foi possível transcrever o áudio. Tente novamente.');
      }
    } catch (error) {
      onError?.(error instanceof Error ? error.message : 'Erro ao transcrever o áudio.');
    } finally {
      setIsTranscribing(false);
    }
  };

  return { isRecording, isTranscribing, startRecording, stopRecording, cancelRecording };
}
