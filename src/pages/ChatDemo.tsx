import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, Volume2, Loader2, Lock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useElevenLabsTTS } from '@/hooks/useElevenLabsTTS';

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`;
const MAX_DEMO_MESSAGES = 5;
const SESSION_KEY = 'fluency_demo_count';

const INITIAL_MESSAGE = "Hi! Let's simulate a real conversation. Tell me which scenario you'd like to practice — a restaurant, a job interview, a hotel, or any other situation!";

interface DemoMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const ChatDemo: React.FC = () => {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<DemoMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showOverlay, setShowOverlay] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const initializedRef = useRef(false);

  // Message count from sessionStorage
  const getCount = () => parseInt(sessionStorage.getItem(SESSION_KEY) || '0', 10);
  const incrementCount = () => {
    const next = getCount() + 1;
    sessionStorage.setItem(SESSION_KEY, String(next));
    return next;
  };

  // TTS
  const currentPlayingRef = useRef<string | null>(null);
  const autoPlayedRef = useRef<Set<string>>(new Set());

  const { speak, stop: stopTTS, isSpeaking, isLoading: isTTSLoading } = useElevenLabsTTS({
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

  // Init
  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    // Reset counter on page load
    sessionStorage.setItem(SESSION_KEY, '0');

    const msg: DemoMessage = {
      id: '1',
      role: 'assistant',
      content: INITIAL_MESSAGE,
      timestamp: new Date(),
    };
    setMessages([msg]);

    // Autoplay initial
    autoPlayedRef.current.add('1');
    setTimeout(() => speakMessage(INITIAL_MESSAGE, '1'), 500);
  }, [speakMessage]);

  // Auto scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (text: string) => {
    if (isTyping) return;

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
      setShowOverlay(true);
      return;
    }

    try {
      const allMessages = [...messages, userMsg];
      const contextMessages = allMessages.length > 7
        ? [allMessages[0], ...allMessages.slice(-6)]
        : allMessages;

      const chatMessages = contextMessages.map(m => ({ role: m.role, content: m.content }));

      // Use anon key for public access (no auth required)
      const response = await fetch(CHAT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          messages: chatMessages,
          scenarioId: 'restaurant',
          userLevel: 'intermediate',
          userLanguage: 'english',
          adaptiveLevel: null,
          includeInstantFeedback: false,
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
                // Strip feedback separator if present
                const clean = assistantContent.split('---')[0].trim();
                setMessages(prev => prev.map(m =>
                  m.id === assistantId ? { ...m, content: clean } : m
                ));
              }
            } catch { /* incomplete */ }
          }
        }
      }

      const mainResponse = assistantContent.split('---')[0].trim();
      setMessages(prev => prev.map(m =>
        m.id === assistantId ? { ...m, content: mainResponse } : m
      ));

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
    if (!inputValue.trim() || isTyping || showOverlay) return;
    const text = inputValue;
    setInputValue('');
    await sendMessage(text);
  };

  const isLimitReached = showOverlay;

  return (
    <div className="h-[100dvh] flex flex-col bg-background overflow-hidden relative">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-card shrink-0">
        <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center text-white font-bold text-lg">
          F
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="font-semibold text-foreground">Fluency IA</h2>
          <p className="text-xs text-muted-foreground">
            {isTyping ? 'Digitando...' : isSpeaking || isTTSLoading ? 'Falando...' : 'Online'}
          </p>
        </div>
        <div className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-lg">
          Demo
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-3 sm:px-4 overscroll-contain min-h-0">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
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
        ))}
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
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="bg-card border-t border-border px-3 py-3 sm:px-4 pb-safe shrink-0">
        <div className="flex items-center gap-2">
          <div className="flex-1">
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Type your message..."
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              disabled={isTyping || isLimitReached}
              className="bg-background"
            />
          </div>
          <Button
            size="icon"
            onClick={handleSend}
            disabled={!inputValue.trim() || isTyping || isLimitReached}
          >
            <Send className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Limit Overlay */}
      {showOverlay && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-card rounded-2xl p-6 sm:p-8 max-w-sm w-full text-center space-y-4 shadow-2xl border border-border">
            <div className="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center mx-auto">
              <Lock className="w-7 h-7 text-primary" />
            </div>
            <h2 className="text-xl font-bold text-foreground">
              Você chegou ao limite da demonstração
            </h2>
            <p className="text-sm text-muted-foreground">
              Crie sua conta gratuita para continuar a simulação e desbloquear todos os cenários.
            </p>
            <div className="space-y-2 pt-2">
              <Button
                size="lg"
                className="w-full"
                onClick={() => navigate('/auth')}
              >
                Criar conta grátis
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-muted-foreground"
                onClick={() => navigate('/auth')}
              >
                Já tenho conta
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatDemo;
