import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, Mic, MicOff, Volume2, Lightbulb, Loader2, Lock, X, Trophy } from 'lucide-react';
import { useDemoTTS } from '@/hooks/useDemoTTS';
import { useDemoAudioRecorder } from '@/hooks/useDemoAudioRecorder';
import { useToast } from '@/hooks/use-toast';
import { ConversationFeedback } from '@/types';

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`;
const ANALYZE_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyze-conversation`;
const MAX_DEMO_MESSAGES = 5;
const SESSION_KEY = 'fluency_demo_count';
const ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

const INITIAL_MESSAGE = "Hi! Let's simulate a real conversation. Tell me which scenario you'd like to practice — a restaurant, a job interview, a hotel, or any other situation!";

interface DemoMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface InstantFeedback {
  tip: string;
  type: 'tip' | 'praise';
}

const ChatDemo: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [messages, setMessages] = useState<DemoMessage[]>([]);
  const [instantFeedbacks, setInstantFeedbacks] = useState<Record<string, InstantFeedback>>({});
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isLimitReached, setIsLimitReached] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [feedback, setFeedback] = useState<ConversationFeedback | null>(null);
  const [pendingAudioMessage, setPendingAudioMessage] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const initializedRef = useRef(false);

  // Message count
  const getCount = () => parseInt(sessionStorage.getItem(SESSION_KEY) || '0', 10);
  const incrementCount = () => {
    const next = getCount() + 1;
    sessionStorage.setItem(SESSION_KEY, String(next));
    return next;
  };

  // TTS
  const currentPlayingRef = useRef<string | null>(null);
  const autoPlayedRef = useRef<Set<string>>(new Set());

  const { speak, stop: stopTTS, isSpeaking, isLoading: isTTSLoading } = useDemoTTS({
    language: 'english',
    onEnd: () => { currentPlayingRef.current = null; },
    onError: () => { currentPlayingRef.current = null; },
  });

  const speakMessage = useCallback((text: string, id: string) => {
    stopTTS();
    currentPlayingRef.current = id;
    speak(text);
  }, [stopTTS, speak]);

  const handleSpeakMessage = (id: string, content: string) => {
    if (isSpeaking && currentPlayingRef.current === id) {
      stopTTS();
      currentPlayingRef.current = null;
    } else {
      speakMessage(content, id);
    }
  };

  // Audio recorder
  const handleAutoSendAudio = useCallback((text: string) => {
    if (text.trim()) setPendingAudioMessage(text);
  }, []);

  const { isRecording, isTranscribing, startRecording, stopRecording, cancelRecording } = useDemoAudioRecorder({
    language: 'english',
    onAutoSend: handleAutoSendAudio,
    onError: (error) => toast({ title: "Erro no áudio", description: error, variant: "destructive" }),
  });

  // Process pending audio message
  useEffect(() => {
    if (pendingAudioMessage && !isTyping && !isTranscribing) {
      sendMessage(pendingAudioMessage);
      setPendingAudioMessage(null);
    }
  }, [pendingAudioMessage, isTyping, isTranscribing]);

  const handleMicClick = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  // Init
  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;
    sessionStorage.setItem(SESSION_KEY, '0');

    const msg: DemoMessage = {
      id: '1',
      role: 'assistant',
      content: INITIAL_MESSAGE,
      timestamp: new Date(),
    };
    setMessages([msg]);

    autoPlayedRef.current.add('1');
    setTimeout(() => speakMessage(INITIAL_MESSAGE, '1'), 500);
  }, [speakMessage]);

  // Auto scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, feedback]);

  // Parse feedback from response
  const parseResponseWithFeedback = (content: string): { mainResponse: string; feedback: InstantFeedback | null } => {
    const separator = '---';
    const parts = content.split(separator);
    if (parts.length >= 2) {
      const mainResponse = parts[0].trim();
      const feedbackPart = parts.slice(1).join(separator).trim();
      let feedbackType: 'tip' | 'praise' = 'tip';
      if (feedbackPart.includes('✨')) feedbackType = 'praise';
      const cleanFeedback = feedbackPart.replace(/^💡\s*Dica:\s*/i, '').replace(/^✨\s*/i, '').trim();
      if (cleanFeedback) return { mainResponse, feedback: { tip: cleanFeedback, type: feedbackType } };
    }
    return { mainResponse: content, feedback: null };
  };

  const analyzeConversation = async (allMessages: DemoMessage[]) => {
    setIsAnalyzing(true);
    try {
      const response = await fetch(ANALYZE_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${ANON_KEY}`,
        },
        body: JSON.stringify({
          messages: allMessages.map(m => ({ role: m.role, content: m.content })),
          scenarioId: 'restaurant',
          userLevel: 'intermediate',
          userLanguage: 'english',
          isDemoMode: true,
        }),
      });

      if (!response.ok) throw new Error('Analysis failed');
      const data = await response.json();

      setFeedback({
        overallScore: data.overallScore || 70,
        grammar: data.grammar || 70,
        vocabulary: data.vocabulary || 70,
        clarity: data.clarity || 75,
        fluency: data.fluency || 70,
        contextCoherence: data.contextCoherence || 75,
        errors: data.errors || [],
        improvements: data.improvements || [],
        correctPhrases: data.correctPhrases || [],
        estimatedLevel: data.estimatedLevel || 'B1',
      });
    } catch (error) {
      console.error('Demo analysis error:', error);
      // Fallback metrics
      setFeedback({
        overallScore: 72,
        grammar: 68,
        vocabulary: 75,
        clarity: 74,
        fluency: 70,
        contextCoherence: 73,
        errors: [],
        improvements: ['Continue praticando regularmente'],
        correctPhrases: ['Boa tentativa!'],
        estimatedLevel: 'B1',
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const sendMessage = async (text: string) => {
    if (isTyping || isLimitReached) return;

    const count = incrementCount();

    const userMsg: DemoMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMsg]);
    setIsTyping(true);

    // Check limit AFTER adding message
    if (count >= MAX_DEMO_MESSAGES) {
      setIsTyping(false);
      setIsLimitReached(true);
      // Analyze the conversation
      const allMsgs = [...messages, userMsg];
      analyzeConversation(allMsgs);
      return;
    }

    try {
      const allMessages = [...messages, userMsg];
      const contextMessages = allMessages.length > 7
        ? [allMessages[0], ...allMessages.slice(-6)]
        : allMessages;
      const chatMessages = contextMessages.map(m => ({ role: m.role, content: m.content }));

      const response = await fetch(CHAT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${ANON_KEY}`,
        },
        body: JSON.stringify({
          messages: chatMessages,
          scenarioId: 'restaurant',
          userLevel: 'intermediate',
          userLanguage: 'english',
          adaptiveLevel: null,
          includeInstantFeedback: true,
          isDemoMode: true,
        }),
      });

      if (!response.ok) throw new Error('Failed to get response');

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let assistantContent = '';
      const assistantId = (Date.now() + 1).toString();

      setMessages(prev => [...prev, {
        id: assistantId,
        role: 'assistant',
        content: '',
        timestamp: new Date(),
      }]);

      if (reader) {
        let textBuffer = '';
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          textBuffer += decoder.decode(value, { stream: true });

          let newlineIndex: number;
          while ((newlineIndex = textBuffer.indexOf('\n')) !== -1) {
            let line = textBuffer.slice(0, newlineIndex);
            textBuffer = textBuffer.slice(newlineIndex + 1);
            if (line.endsWith('\r')) line = line.slice(0, -1);
            if (line.startsWith(':') || line.trim() === '') continue;
            if (!line.startsWith('data: ')) continue;
            const jsonStr = line.slice(6).trim();
            if (jsonStr === '[DONE]') break;
            try {
              const parsed = JSON.parse(jsonStr);
              const content = parsed.choices?.[0]?.delta?.content;
              if (content) {
                assistantContent += content;
                const { mainResponse } = parseResponseWithFeedback(assistantContent);
                setMessages(prev => prev.map(m =>
                  m.id === assistantId ? { ...m, content: mainResponse } : m
                ));
              }
            } catch { /* incomplete */ }
          }
        }
      }

      const { mainResponse, feedback: instantFeedback } = parseResponseWithFeedback(assistantContent);
      setMessages(prev => prev.map(m =>
        m.id === assistantId ? { ...m, content: mainResponse } : m
      ));

      if (instantFeedback) {
        setInstantFeedbacks(prev => ({ ...prev, [assistantId]: instantFeedback }));
      }

      // Autoplay
      if (mainResponse && !autoPlayedRef.current.has(assistantId)) {
        autoPlayedRef.current.add(assistantId);
        stopTTS();
        setTimeout(() => speakMessage(mainResponse, assistantId), 100);
      }
    } catch (error) {
      console.error('Demo chat error:', error);
      setMessages(prev => prev.filter(m => m.role !== 'assistant' || m.content !== ''));
    } finally {
      setIsTyping(false);
    }
  };

  const handleSend = async () => {
    if (!inputValue.trim() || isTyping || isLimitReached) return;
    const text = inputValue;
    setInputValue('');
    await sendMessage(text);
  };

  // Score color helper
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-500';
    if (score >= 60) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getScoreBg = (score: number) => {
    if (score >= 80) return 'bg-green-500/20';
    if (score >= 60) return 'bg-yellow-500/20';
    return 'bg-red-500/20';
  };

  return (
    <div className="h-[100dvh] flex flex-col bg-background overflow-hidden relative">
      {/* Header */}
      <div className="flex items-center gap-3 px-3 py-3 border-b border-border bg-card shrink-0 sm:px-4">
        <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center text-white font-bold text-lg shrink-0">
          F
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="font-semibold text-foreground">Fluency IA</h2>
          <p className="text-xs text-muted-foreground">
            {isTyping ? 'Digitando...' : isRecording ? 'Gravando...' : isTranscribing ? 'Processando...' : isSpeaking || isTTSLoading ? 'Falando...' : 'Online'}
          </p>
        </div>
        <div className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-lg shrink-0">
          Demo • {Math.max(0, MAX_DEMO_MESSAGES - getCount())}/{MAX_DEMO_MESSAGES}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-3 sm:px-4 overscroll-contain min-h-0">
        {messages.map((message) => (
          <div key={message.id} className="space-y-2">
            <div className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[85%] sm:max-w-[75%] rounded-2xl px-4 py-3 ${
                  message.role === 'user'
                    ? 'gradient-primary text-white rounded-br-md'
                    : 'bg-muted text-foreground rounded-bl-md'
                }`}
              >
                <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
                <div className="flex items-center justify-end gap-2 mt-1">
                  <span className={`text-xs ${message.role === 'user' ? 'text-white/70' : 'text-muted-foreground'}`}>
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  {message.role === 'assistant' && message.content && (
                    <button
                      onClick={() => handleSpeakMessage(message.id, message.content)}
                      className={`text-xs hover:underline ${
                        (isSpeaking || isTTSLoading) && currentPlayingRef.current === message.id
                          ? 'text-primary'
                          : 'text-muted-foreground'
                      }`}
                    >
                      <Volume2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Instant Feedback Card */}
            {message.role === 'assistant' && instantFeedbacks[message.id] && (
              <div className="flex justify-start pl-2">
                <div className={`max-w-[85%] sm:max-w-[75%] rounded-xl px-3 py-2 text-sm border ${
                  instantFeedbacks[message.id].type === 'praise'
                    ? 'bg-green-50 border-green-200 text-green-800 dark:bg-green-900/20 dark:border-green-800 dark:text-green-300'
                    : 'bg-amber-50 border-amber-200 text-amber-800 dark:bg-amber-900/20 dark:border-amber-800 dark:text-amber-300'
                }`}>
                  <div className="flex items-start gap-2">
                    <Lightbulb className="w-4 h-4 shrink-0 mt-0.5" />
                    <p className="text-xs">{instantFeedbacks[message.id].tip}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}

        {/* Typing indicator */}
        {isTyping && messages[messages.length - 1]?.content === '' && (
          <div className="flex justify-start">
            <div className="bg-muted rounded-2xl rounded-bl-md px-4 py-3">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}

        {/* Metrics Panel - inline after limit */}
        {isLimitReached && (
          <div className="py-4 space-y-4">
            {isAnalyzing ? (
              <div className="flex flex-col items-center justify-center py-8 space-y-3">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Analisando sua conversa...</p>
              </div>
            ) : feedback ? (
              <div className="space-y-4">
                {/* End message */}
                <div className="text-center py-3">
                  <div className="inline-flex items-center gap-2 bg-muted rounded-full px-4 py-2">
                    <Trophy className="w-4 h-4 text-primary" />
                    <span className="text-sm font-medium text-foreground">Seu teste gratuito foi concluído.</span>
                  </div>
                </div>

                {/* Score card */}
                <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
                  {/* Overall Score */}
                  <div className="text-center space-y-1">
                    <div className={`text-4xl font-bold ${getScoreColor(feedback.overallScore)}`}>
                      {feedback.overallScore}
                    </div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Score Geral</p>
                    <p className="text-xs text-muted-foreground">Nível estimado: <span className="font-semibold text-foreground">{feedback.estimatedLevel}</span></p>
                  </div>

                  {/* Metrics grid */}
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: 'Gramática', value: feedback.grammar },
                      { label: 'Vocabulário', value: feedback.vocabulary },
                      { label: 'Fluência', value: feedback.fluency },
                      { label: 'Clareza', value: feedback.clarity },
                    ].map(({ label, value }) => (
                      <div key={label} className={`rounded-xl p-3 text-center ${getScoreBg(value)}`}>
                        <div className={`text-xl font-bold ${getScoreColor(value)}`}>{value}</div>
                        <div className="text-xs text-muted-foreground mt-0.5">{label}</div>
                      </div>
                    ))}
                  </div>

                  {/* Improvements */}
                  {feedback.improvements.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Dicas para melhorar</p>
                      {feedback.improvements.slice(0, 3).map((tip, i) => (
                        <p key={i} className="text-xs text-muted-foreground">• {tip}</p>
                      ))}
                    </div>
                  )}
                </div>

                {/* CTA */}
                <div className="space-y-2 pt-2">
                  <Button size="lg" className="w-full" onClick={() => navigate('/auth')}>
                    Inscrever-se agora
                  </Button>
                  <Button variant="ghost" size="sm" className="w-full text-muted-foreground" onClick={() => navigate('/auth')}>
                    Já tenho conta
                  </Button>
                </div>
              </div>
            ) : null}
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Recording indicator */}
      {isRecording && (
        <div className="px-4 py-3 bg-destructive/10 border-t border-destructive/20 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 bg-destructive rounded-full animate-pulse" />
            <span className="text-sm text-destructive font-medium">Gravando... Toque para enviar</span>
          </div>
          <Button variant="ghost" size="sm" onClick={cancelRecording} className="text-destructive">
            <X className="w-4 h-4 mr-1" />
            Cancelar
          </Button>
        </div>
      )}

      {/* Transcribing indicator */}
      {isTranscribing && (
        <div className="px-4 py-3 bg-primary/10 border-t border-primary/20 flex items-center gap-2 shrink-0">
          <Loader2 className="w-4 h-4 animate-spin text-primary" />
          <span className="text-sm text-primary font-medium">Enviando mensagem...</span>
        </div>
      )}

      {/* Input Area */}
      {!isLimitReached && (
        <div className="bg-card border-t border-border px-3 py-3 sm:px-4 pb-safe shrink-0">
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Type your message..."
                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                disabled={isTyping || isRecording || isTranscribing}
                className="bg-background"
              />
            </div>
            <Button
              size="icon"
              variant={isRecording ? "destructive" : "outline"}
              onClick={handleMicClick}
              disabled={isTranscribing || isTyping}
              className={`shrink-0 ${isRecording ? 'animate-pulse' : 'border-primary text-primary hover:bg-primary hover:text-primary-foreground'}`}
            >
              {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </Button>
            <Button
              size="icon"
              onClick={handleSend}
              disabled={!inputValue.trim() || isTyping || isRecording || isTranscribing}
            >
              <Send className="w-5 h-5" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatDemo;
