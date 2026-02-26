import { useState, useCallback, useRef } from 'react';
import { useConversation } from '@elevenlabs/react';
import { supabase } from '@/integrations/supabase/client';

export type CallStatus = 'idle' | 'connecting' | 'active' | 'ai-speaking' | 'user-speaking' | 'ended' | 'error';

export interface TranscriptLine {
  role: 'user' | 'assistant';
  text: string;
  timestamp: number;
}

interface UseRealtimeCallReturn {
  status: CallStatus;
  transcript: TranscriptLine[];
  duration: number;
  errorMessage: string | null;
  startCall: (scenarioId: string) => Promise<void>;
  endCall: () => void;
}

export function useRealtimeCall(): UseRealtimeCallReturn {
  const [status, setStatus] = useState<CallStatus>('idle');
  const [transcript, setTranscript] = useState<TranscriptLine[]>([]);
  const [duration, setDuration] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const conversation = useConversation({
    onConnect: () => {
      setStatus('active');
      timerRef.current = setInterval(() => {
        setDuration(prev => prev + 1);
      }, 1000);
    },
    onDisconnect: () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      setStatus(prev => prev === 'error' ? 'error' : 'ended');
    },
    onMessage: (message) => {
      const msg = message as unknown as Record<string, unknown>;
      const type = msg?.type as string | undefined;
      if (type === 'user_transcript') {
        const event = msg?.user_transcription_event as { user_transcript?: string } | undefined;
        const text = event?.user_transcript;
        if (text) {
          setTranscript(prev => [...prev, { role: 'user', text, timestamp: Date.now() }]);
        }
      }
      if (type === 'agent_response') {
        const event = msg?.agent_response_event as { agent_response?: string } | undefined;
        const text = event?.agent_response;
        if (text) {
          setTranscript(prev => [...prev, { role: 'assistant', text, timestamp: Date.now() }]);
        }
      }
    },
    onError: (error) => {
      console.error('[ElevenLabs] Error:', error);
      setErrorMessage('Erro na conexão de voz. Verifique o microfone e tente novamente.');
      setStatus('error');
      if (timerRef.current) clearInterval(timerRef.current);
    },
  });

  // Mirror isSpeaking state
  const isSpeaking = conversation.isSpeaking;
  const connStatus = conversation.status;

  // Sync ElevenLabs speaking state
  if (connStatus === 'connected') {
    if (isSpeaking && status === 'active') {
      // Will update next render cycle
    }
  }

  const startCall = useCallback(async (scenarioId: string) => {
    try {
      setStatus('connecting');
      setErrorMessage(null);
      setTranscript([]);
      setDuration(0);

      // Request microphone permission early
      try {
        await navigator.mediaDevices.getUserMedia({ audio: true });
      } catch {
        throw new Error('Acesso ao microfone negado. Por favor, permita o uso do microfone nas configurações do seu navegador.');
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error('Usuário não autenticado');

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const response = await fetch(`${supabaseUrl}/functions/v1/elevenlabs-conversation-token`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
          'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
        body: JSON.stringify({ scenarioId }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Falha ao criar sessão de voz');
      }

      const { token } = await response.json();
      if (!token) throw new Error('Token de sessão inválido');

      await conversation.startSession({
        conversationToken: token,
        connectionType: 'webrtc',
      });

    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao iniciar chamada';
      setErrorMessage(message);
      setStatus('error');
    }
  }, [conversation]);

  const endCall = useCallback(async () => {
    try {
      await conversation.endSession();
    } catch {
      // ignore
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setStatus('ended');
  }, [conversation]);

  // Derive display status from ElevenLabs state
  let displayStatus: CallStatus = status;
  if (connStatus === 'connected') {
    displayStatus = isSpeaking ? 'ai-speaking' : 'active';
  }

  return {
    status: displayStatus,
    transcript,
    duration,
    errorMessage,
    startCall,
    endCall,
  };
}
