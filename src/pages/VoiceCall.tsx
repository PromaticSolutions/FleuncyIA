import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PhoneOff, ArrowLeft, Loader2 } from 'lucide-react';
import { useRealtimeCall } from '@/hooks/useRealtimeCall';
import { useApp } from '@/contexts/AppContext';
import { scenarios } from '@/data/scenarios';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';

const formatDuration = (seconds: number) => {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
};

const VoiceCall: React.FC = () => {
  const { scenarioId } = useParams<{ scenarioId: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user, authUserId } = useApp();
  const { status, transcript, duration, errorMessage, startCall, endCall } = useRealtimeCall();
  const hasStarted = useRef(false);
  const hasSaved = useRef(false);
  const [isSaving, setIsSaving] = useState(false);

  const scenario = scenarios.find(s => s.id === scenarioId);

  useEffect(() => {
    if (!hasStarted.current && scenarioId) {
      hasStarted.current = true;
      startCall(scenarioId);
    }
  }, [scenarioId, startCall]);

  // When call ends: save → analyze → navigate to feedback
  useEffect(() => {
    if (status === 'ended' && !hasSaved.current && authUserId) {
      hasSaved.current = true;
      setIsSaving(true);

      const save = async () => {
        try {
          const messages = transcript.map(line => ({
            role: line.role === 'user' ? 'user' : 'assistant',
            content: line.text,
            timestamp: new Date(line.timestamp).toISOString(),
          }));

          const startedAt = new Date(Date.now() - duration * 1000).toISOString();
          const endedAt = new Date().toISOString();

          // 1. Save conversation to DB
          const { data: conv } = await supabase
            .from('conversations')
            .insert({
              user_id: authUserId,
              scenario_id: scenarioId || '',
              messages,
              started_at: startedAt,
              ended_at: endedAt,
            })
            .select()
            .single();

          // 2. Analyze conversation via edge function
          const { data: { session } } = await supabase.auth.getSession();
          let feedback = null;

          if (session?.access_token && messages.length > 0) {
            try {
              const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
              const res = await fetch(`${supabaseUrl}/functions/v1/analyze-conversation`, {
                method: 'POST',
                headers: {
                  Authorization: `Bearer ${session.access_token}`,
                  'Content-Type': 'application/json',
                  apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
                },
                body: JSON.stringify({
                  messages,
                  scenarioId,
                  userLevel: user?.level || 'intermediate',
                  userLanguage: user?.language || 'english',
                }),
              });
              if (res.ok) {
                feedback = await res.json();
              }
            } catch {
              // Analysis failed — continue without it
            }
          }

          // 3. If we got feedback, save it back to the conversation record
          if (feedback && conv?.id) {
            await supabase
              .from('conversations')
              .update({ feedback })
              .eq('id', conv.id);
          }

          // 4. Navigate to feedback or home
          if (feedback) {
            navigate('/feedback', {
              state: {
                feedback,
                scenarioId,
                userLanguage: user?.language || 'english',
                conversationId: conv?.id,
                fromVoiceCall: true,
              },
            });
          } else {
            navigate('/home');
          }
        } catch {
          navigate('/home');
        }
      };

      save();
    }
  }, [status, authUserId, transcript, scenarioId, duration, navigate, user]);

  const isActive = status === 'active' || status === 'ai-speaking' || status === 'user-speaking';
  const isAiSpeaking = status === 'ai-speaking';
  const isUserSpeaking = status === 'user-speaking';
  const isConnecting = status === 'connecting';

  const scenarioTitle = scenario?.titleKey ? t(scenario.titleKey) : (scenarioId || 'Chamada');

  // Allow going back only before call starts or on error
  const canGoBack = status === 'idle' || status === 'error' || status === 'connecting';

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-between p-6 select-none"
      style={{ background: 'linear-gradient(135deg, #0f0c29, #302b63, #24243e)' }}
    >
      {/* Top bar */}
      <div className="w-full max-w-sm flex items-center justify-between pt-4">
        <div className="flex items-center gap-3">
          {canGoBack && (
            <button
              onClick={() => { endCall(); navigate(-1); }}
              className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center backdrop-blur-sm"
            >
              <ArrowLeft className="w-4 h-4 text-white" />
            </button>
          )}
          <div className="flex items-center gap-2">
            <div className={`w-2.5 h-2.5 rounded-full transition-colors duration-300 ${
              isActive ? 'bg-emerald-400 animate-pulse' :
              isConnecting ? 'bg-yellow-400 animate-pulse' :
              status === 'error' ? 'bg-red-400' : 'bg-gray-600'
            }`} />
            <span className="text-sm text-white/70">
              {isConnecting && 'Conectando...'}
              {status === 'active' && 'Em chamada'}
              {isAiSpeaking && 'IA falando...'}
              {isUserSpeaking && 'Ouvindo...'}
              {status === 'ended' && 'Encerrando...'}
              {status === 'error' && 'Erro na conexão'}
              {status === 'idle' && 'Aguardando...'}
            </span>
          </div>
        </div>
        {isActive && (
          <span className="text-sm font-mono text-white/60 tabular-nums">
            {formatDuration(duration)}
          </span>
        )}
      </div>

      {/* Center content */}
      <div className="flex flex-col items-center gap-8 flex-1 justify-center w-full max-w-sm">

        {/* Avatar circle */}
        <div className="relative flex items-center justify-center">
          {isActive && (
            <>
              <div className="absolute w-52 h-52 rounded-full opacity-10 bg-violet-400"
                style={{ animation: 'ping 2s cubic-bezier(0,0,0.2,1) infinite' }} />
              <div className="absolute w-44 h-44 rounded-full opacity-15 bg-violet-400"
                style={{ animation: 'ping 2s cubic-bezier(0,0,0.2,1) infinite', animationDelay: '0.5s' }} />
            </>
          )}
          {isAiSpeaking && (
            <div className="absolute w-40 h-40 rounded-full bg-blue-500/20"
              style={{ animation: 'pulse 0.7s ease-in-out infinite' }} />
          )}
          <div className={`relative w-36 h-36 rounded-full flex items-center justify-center shadow-2xl transition-all duration-700 ${
            isAiSpeaking
              ? 'bg-gradient-to-br from-blue-500 to-violet-600 scale-110'
              : isUserSpeaking
              ? 'bg-gradient-to-br from-emerald-500 to-teal-600 scale-105'
              : isActive
              ? 'bg-gradient-to-br from-violet-500 to-purple-700'
              : 'bg-gradient-to-br from-gray-700 to-gray-900'
          }`}
            style={{
              boxShadow: isAiSpeaking
                ? '0 0 60px rgba(139,92,246,0.6)'
                : isUserSpeaking
                ? '0 0 60px rgba(16,185,129,0.5)'
                : isActive
                ? '0 0 40px rgba(139,92,246,0.4)'
                : 'none'
            }}
          >
            <span className="text-5xl">{scenario?.icon || '🎙️'}</span>
          </div>
        </div>

        {/* Scenario info */}
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-1">{scenarioTitle}</h1>
          <p className="text-sm text-white/50 capitalize">
            {user?.language || 'english'} · {user?.level || 'intermediate'}
          </p>
        </div>

        {/* Saving indicator */}
        {isSaving && (
          <div className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-white/10 border border-white/20">
            <Loader2 className="w-4 h-4 text-white animate-spin" />
            <span className="text-sm text-white/80">Analisando conversa...</span>
          </div>
        )}

        {/* Error */}
        {errorMessage && !isSaving && (
          <div className="w-full px-4 py-3 rounded-2xl bg-red-900/40 border border-red-500/30 text-center">
            <p className="text-sm text-red-300 mb-2">{errorMessage}</p>
            <button onClick={() => navigate('/home')} className="text-xs text-red-400 underline">
              Voltar para o início
            </button>
          </div>
        )}

        {/* Live transcript */}
        {transcript.length > 0 && (
          <div className="w-full space-y-2 max-h-44 overflow-y-auto px-1">
            {transcript.slice(-6).map((line, i) => (
              <div key={i} className={`flex ${line.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] px-3 py-2 rounded-2xl text-xs leading-relaxed ${
                  line.role === 'user'
                    ? 'bg-violet-600/40 text-violet-100 rounded-br-sm'
                    : 'bg-white/10 text-white/80 rounded-bl-sm'
                }`}>
                  {line.text}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* AI speaking wave */}
        {isAiSpeaking && (
          <div className="flex items-center gap-1.5 h-8">
            {[0.3, 0.7, 1, 0.8, 0.5, 0.9, 0.6, 0.4, 0.8, 0.3].map((h, i) => (
              <div
                key={i}
                className="w-1 rounded-full bg-violet-400"
                style={{
                  height: `${h * 32}px`,
                  animation: `pulse ${0.5 + i * 0.1}s ease-in-out infinite alternate`,
                }}
              />
            ))}
          </div>
        )}

        {/* User speaking indicator */}
        {isUserSpeaking && (
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/20 border border-emerald-500/30">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-sm text-emerald-300">Ouvindo você...</span>
          </div>
        )}
      </div>

      {/* End call button */}
      <div className="pb-10 flex flex-col items-center gap-3">
        {isActive && (
          <p className="text-xs text-white/40 text-center">Toque para encerrar e ver análise</p>
        )}
        <button
          onClick={endCall}
          disabled={status === 'ended' || status === 'idle' || isSaving}
          className="w-20 h-20 rounded-full flex items-center justify-center shadow-2xl transition-all duration-200 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed"
          style={{
            background: 'linear-gradient(135deg, #ef4444, #dc2626)',
            boxShadow: '0 8px 32px rgba(239,68,68,0.5)',
          }}
          aria-label="Encerrar chamada"
        >
          <PhoneOff className="w-8 h-8 text-white" />
        </button>
        <p className="text-xs text-white/30 text-center">Encerrar</p>
      </div>
    </div>
  );
};

export default VoiceCall;
