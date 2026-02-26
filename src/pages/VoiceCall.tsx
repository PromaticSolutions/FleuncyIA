import React, { useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Phone, PhoneOff, Mic, MicOff, Wifi, WifiOff } from 'lucide-react';
import { useRealtimeCall, CallStatus } from '@/hooks/useRealtimeCall';
import { useApp } from '@/contexts/AppContext';
import { scenarios } from '@/data/scenarios';
import { supabase } from '@/integrations/supabase/client';

const formatDuration = (seconds: number) => {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
};

const statusLabel: Record<CallStatus, string> = {
  idle: 'Aguardando...',
  connecting: 'Conectando...',
  active: 'Em chamada',
  'ai-speaking': 'IA falando...',
  'user-speaking': 'Ouvindo você...',
  ended: 'Chamada encerrada',
  error: 'Erro na conexão',
};

const VoiceCall: React.FC = () => {
  const { scenarioId } = useParams<{ scenarioId: string }>();
  const navigate = useNavigate();
  const { user, authUserId } = useApp();
  const { status, transcript, duration, errorMessage, startCall, endCall, audioRef } = useRealtimeCall();
  const hasStarted = useRef(false);
  const hasSaved = useRef(false);

  const scenario = scenarios.find(s => s.id === scenarioId);

  useEffect(() => {
    if (!hasStarted.current && scenarioId) {
      hasStarted.current = true;
      startCall(scenarioId);
    }
  }, [scenarioId, startCall]);

  // Save conversation and redirect to feedback when ended
  useEffect(() => {
    if (status === 'ended' && !hasSaved.current && authUserId) {
      hasSaved.current = true;
      const save = async () => {
        try {
          const messages = transcript.map(t => ({
            role: t.role,
            content: t.text,
            timestamp: new Date(t.timestamp).toISOString(),
          }));

          const { data } = await supabase
            .from('conversations')
            .insert({
              user_id: authUserId,
              scenario_id: scenarioId || '',
              messages,
              started_at: new Date(Date.now() - duration * 1000).toISOString(),
              ended_at: new Date().toISOString(),
            })
            .select()
            .single();

          if (data) {
            navigate('/feedback', { state: { conversationId: data.id, fromVoiceCall: true } });
          } else {
            navigate('/home');
          }
        } catch {
          navigate('/home');
        }
      };
      save();
    }
  }, [status, authUserId, transcript, scenarioId, duration, navigate]);

  const handleEndCall = () => {
    endCall();
  };

  const isActive = status === 'active' || status === 'ai-speaking' || status === 'user-speaking';
  const isConnecting = status === 'connecting';

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-between p-6 select-none">
      {/* Hidden audio element for AI voice */}
      <audio ref={audioRef} autoPlay className="hidden" />

      {/* Top bar */}
      <div className="w-full max-w-sm flex items-center justify-between pt-4">
        <div className="flex items-center gap-2 text-sm text-gray-400">
          {isActive ? (
            <Wifi className="w-4 h-4 text-emerald-400" />
          ) : (
            <WifiOff className="w-4 h-4 text-gray-500" />
          )}
          <span>{isActive ? 'Conectado' : statusLabel[status]}</span>
        </div>
        {isActive && (
          <span className="text-sm font-mono text-gray-300 tabular-nums">
            {formatDuration(duration)}
          </span>
        )}
      </div>

      {/* Center — scenario info */}
      <div className="flex flex-col items-center gap-6 flex-1 justify-center">
        {/* Animated avatar */}
        <div className="relative flex items-center justify-center">
          {/* Outer pulse rings */}
          {isActive && (
            <>
              <div className="absolute w-40 h-40 rounded-full bg-violet-500/10 animate-ping" style={{ animationDuration: '2s' }} />
              <div className="absolute w-32 h-32 rounded-full bg-violet-500/15 animate-ping" style={{ animationDuration: '1.5s', animationDelay: '0.3s' }} />
            </>
          )}
          {status === 'ai-speaking' && (
            <div className="absolute w-40 h-40 rounded-full bg-blue-500/20 animate-pulse" style={{ animationDuration: '0.8s' }} />
          )}

          {/* Main circle */}
          <div className={`relative w-28 h-28 rounded-full flex items-center justify-center text-5xl shadow-2xl transition-all duration-500 ${
            isActive
              ? 'bg-gradient-to-br from-violet-600 to-purple-700 shadow-violet-500/40'
              : isConnecting
              ? 'bg-gradient-to-br from-gray-700 to-gray-800'
              : 'bg-gradient-to-br from-gray-700 to-gray-800'
          }`}>
            {scenario?.icon || '🎙️'}
          </div>
        </div>

        {/* Scenario name */}
        <div className="text-center">
          <h1 className="text-xl font-semibold text-white mb-1">
            {scenario?.titleKey ? scenario.id : (scenario?.icon + ' Chamada de Voz')}
          </h1>
          <p className="text-sm text-gray-400 capitalize">
            {user?.language || 'english'} · {user?.level || 'intermediate'}
          </p>
        </div>

        {/* Status indicator */}
        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-gray-800/60 border border-gray-700/50">
          <div className={`w-2 h-2 rounded-full transition-colors duration-300 ${
            isActive ? 'bg-emerald-400 animate-pulse' :
            isConnecting ? 'bg-yellow-400 animate-pulse' :
            status === 'error' ? 'bg-red-400' :
            'bg-gray-500'
          }`} />
          <span className="text-sm text-gray-300">{statusLabel[status]}</span>
        </div>

        {/* Error message */}
        {errorMessage && (
          <div className="max-w-xs text-center px-4 py-3 rounded-xl bg-red-900/40 border border-red-700/50">
            <p className="text-sm text-red-300">{errorMessage}</p>
            <button
              onClick={() => navigate('/home')}
              className="mt-2 text-xs text-red-400 underline"
            >
              Voltar para o início
            </button>
          </div>
        )}

        {/* Live transcript preview */}
        {transcript.length > 0 && (
          <div className="w-full max-w-sm max-h-36 overflow-y-auto space-y-2 px-2">
            {transcript.slice(-4).map((line, i) => (
              <div
                key={i}
                className={`flex ${line.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-xs px-3 py-2 rounded-xl text-xs leading-relaxed ${
                  line.role === 'user'
                    ? 'bg-violet-600/30 text-violet-200 rounded-br-sm'
                    : 'bg-gray-700/60 text-gray-300 rounded-bl-sm'
                }`}>
                  {line.text}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bottom controls */}
      <div className="w-full max-w-sm flex items-center justify-center pb-8">
        <button
          onClick={handleEndCall}
          disabled={status === 'ended' || status === 'idle'}
          className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 active:scale-95 transition-all duration-200 flex items-center justify-center shadow-xl shadow-red-500/30 disabled:opacity-40 disabled:cursor-not-allowed"
          aria-label="Encerrar chamada"
        >
          <PhoneOff className="w-7 h-7 text-white" />
        </button>
      </div>
    </div>
  );
};

export default VoiceCall;
