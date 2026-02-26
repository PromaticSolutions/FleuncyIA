import { useState, useRef, useCallback, useEffect } from 'react';
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
  audioRef: React.RefObject<HTMLAudioElement>;
}

export function useRealtimeCall(): UseRealtimeCallReturn {
  const [status, setStatus] = useState<CallStatus>('idle');
  const [transcript, setTranscript] = useState<TranscriptLine[]>([]);
  const [duration, setDuration] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const dataChannelRef = useRef<RTCDataChannel | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);

  const cleanup = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(t => t.stop());
      localStreamRef.current = null;
    }
    if (dataChannelRef.current) {
      dataChannelRef.current.close();
      dataChannelRef.current = null;
    }
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    if (audioRef.current) {
      audioRef.current.srcObject = null;
    }
  }, []);

  useEffect(() => {
    return () => cleanup();
  }, [cleanup]);

  const startCall = useCallback(async (scenarioId: string) => {
    try {
      setStatus('connecting');
      setErrorMessage(null);
      setTranscript([]);
      setDuration(0);

      // Get JWT token
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('Usuário não autenticado');
      }

      // Request ephemeral token from edge function
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      const baseUrl = supabaseUrl || `https://${projectId}.supabase.co`;

      const tokenResponse = await fetch(`${baseUrl}/functions/v1/realtime-session`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
          'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
        body: JSON.stringify({ scenarioId }),
      });

      if (!tokenResponse.ok) {
        const err = await tokenResponse.json();
        throw new Error(err.error || 'Falha ao criar sessão de voz');
      }

      const { client_secret } = await tokenResponse.json();
      if (!client_secret?.value) {
        throw new Error('Token de sessão inválido');
      }

      // Create RTCPeerConnection
      const pc = new RTCPeerConnection({
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
      });
      peerConnectionRef.current = pc;

      // Set up audio output (AI voice)
      pc.ontrack = (event) => {
        if (audioRef.current && event.streams[0]) {
          audioRef.current.srcObject = event.streams[0];
        }
      };

      // Get microphone
      let localStream: MediaStream;
      try {
        localStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      } catch {
        throw new Error('Acesso ao microfone negado. Por favor, permita o uso do microfone.');
      }
      localStreamRef.current = localStream;
      localStream.getTracks().forEach(track => pc.addTrack(track, localStream));

      // Add audio receive track
      pc.addTransceiver('audio', { direction: 'sendrecv' });

      // Create data channel for events/transcriptions
      const dc = pc.createDataChannel('oai-events');
      dataChannelRef.current = dc;

      dc.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);

          if (msg.type === 'response.audio_transcript.done') {
            setTranscript(prev => [...prev, {
              role: 'assistant',
              text: msg.transcript,
              timestamp: Date.now(),
            }]);
            setStatus('active');
          }

          if (msg.type === 'conversation.item.input_audio_transcription.completed') {
            setTranscript(prev => [...prev, {
              role: 'user',
              text: msg.transcript,
              timestamp: Date.now(),
            }]);
          }

          if (msg.type === 'response.audio.delta') {
            setStatus('ai-speaking');
          }

          if (msg.type === 'response.audio.done') {
            setStatus('active');
          }

          if (msg.type === 'input_audio_buffer.speech_started') {
            setStatus('user-speaking');
          }

          if (msg.type === 'input_audio_buffer.speech_stopped') {
            setStatus('active');
          }

          if (msg.type === 'session.created') {
            setStatus('active');
            // Start duration timer
            timerRef.current = setInterval(() => {
              setDuration(prev => prev + 1);
            }, 1000);
          }
        } catch {
          // ignore parse errors
        }
      };

      dc.onopen = () => {
        console.log('[REALTIME] DataChannel open');
      };

      // Create SDP offer
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      // Send offer to OpenAI WebRTC endpoint
      const model = 'gpt-4o-realtime-preview-2024-12-17';
      const sdpResponse = await fetch(
        `https://api.openai.com/v1/realtime?model=${model}`,
        {
          method: 'POST',
          body: offer.sdp,
          headers: {
            'Authorization': `Bearer ${client_secret.value}`,
            'Content-Type': 'application/sdp',
          },
        }
      );

      if (!sdpResponse.ok) {
        throw new Error('Falha ao estabelecer conexão de voz com a IA');
      }

      const answerSdp = await sdpResponse.text();
      await pc.setRemoteDescription({ type: 'answer', sdp: answerSdp });

    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro inesperado ao iniciar chamada';
      setErrorMessage(message);
      setStatus('error');
      cleanup();
    }
  }, [cleanup]);

  const endCall = useCallback(() => {
    cleanup();
    setStatus('ended');
  }, [cleanup]);

  return { status, transcript, duration, errorMessage, startCall, endCall, audioRef };
}
