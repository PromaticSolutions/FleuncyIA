import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useApp } from '@/contexts/AppContext';
import { scenarios } from '@/data/scenarios';
import { Message, Conversation, ConversationFeedback } from '@/types';
import { ArrowLeft, Send, Mic, MicOff, Languages, MoreVertical, Loader2, X, Volume2, VolumeX } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAudioRecorder } from '@/hooks/useAudioRecorder';
import { useCredits } from '@/hooks/useCredits';
import { useConversations } from '@/hooks/useConversations';
import { useSpeechSynthesis } from '@/hooks/useSpeechSynthesis';
import { CreditsDisplay } from '@/components/CreditsDisplay';
import { HelpButton } from '@/components/HelpButton';

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`;

const scenarioInitialMessages: Record<string, string> = {
  restaurant: "Good evening! Welcome to our restaurant. How may I help you today?",
  interview: "Good morning! Thank you for coming in today. Please, have a seat. Let's start - can you tell me a little about yourself?",
  hotel: "Good afternoon! Welcome to Grand Hotel. How may I assist you today?",
  airport: "Hello! Welcome to the airport. May I see your passport and boarding pass, please?",
  shopping: "Hello! Welcome to our store. Can I help you find something today?",
  business: "Good morning everyone. Thank you for joining this meeting. Shall we begin with the agenda?",
  hospital: "Hello. I'm Dr. Smith. What brings you in today? How can I help you?",
  transport: "Hey there! Where are you heading today?",
};

const Chat: React.FC = () => {
  const navigate = useNavigate();
  const { scenarioId } = useParams<{ scenarioId: string }>();
  const { user } = useApp();
  const { toast } = useToast();
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showTranslation, setShowTranslation] = useState<string | null>(null);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [conversationId] = useState(() => crypto.randomUUID());
  const [authUserId, setAuthUserId] = useState<string | undefined>(undefined);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Get authenticated user ID
  useEffect(() => {
    const getUser = async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      setAuthUserId(authUser?.id);
    };
    getUser();
  }, []);

  const canUseAudio = user?.plan === 'pro' || user?.plan === 'fluency_plus';

  // Hooks for credits, conversations, and speech
  const { credits, useCredit, canSendMessage, hasUnlimitedCredits } = useCredits(authUserId, user?.plan);
  const { saveConversation } = useConversations(authUserId);
  const { speak, stop, isSpeaking, isSupported: isSpeechSupported } = useSpeechSynthesis({ lang: 'en-US', rate: 0.9 });

  const { isRecording, isTranscribing, startRecording, stopRecording, cancelRecording } = useAudioRecorder({
    onTranscription: (text) => {
      if (text.trim()) {
        setInputValue(text);
        toast({
          title: "Áudio transcrito",
          description: "Sua mensagem foi convertida em texto.",
        });
      }
    },
    onError: (error) => {
      toast({
        title: "Erro no áudio",
        description: error,
        variant: "destructive",
      });
    }
  });

  const scenario = scenarios.find(s => s.id === scenarioId);

  useEffect(() => {
    if (scenario && messages.length === 0) {
      const initialMessage: Message = {
        id: '1',
        role: 'assistant',
        content: scenarioInitialMessages[scenario.id] || "Hello! Let's practice together.",
        timestamp: new Date(),
      };
      setMessages([initialMessage]);
      
      // Speak initial message if voice is enabled
      if (voiceEnabled && isSpeechSupported) {
        speak(initialMessage.content);
      }
    }
  }, [scenario]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isTyping) return;

    // Check credits before sending
    if (!canSendMessage()) {
      toast({
        title: "Sem créditos",
        description: credits?.is_trial_expired 
          ? "Seu período de trial expirou. Faça upgrade para continuar." 
          : "Você atingiu o limite de mensagens. Faça upgrade para continuar.",
        variant: "destructive",
      });
      navigate('/plans');
      return;
    }

    // Deduct credit
    const creditUsed = await useCredit();
    if (!creditUsed && !hasUnlimitedCredits) {
      toast({
        title: "Erro",
        description: "Não foi possível processar sua mensagem.",
        variant: "destructive",
      });
      return;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    try {
      const chatMessages = [...messages, userMessage].map(m => ({
        role: m.role,
        content: m.content,
      }));

      const response = await fetch(CHAT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          messages: chatMessages,
          scenarioId: scenarioId,
          userLevel: user?.level || 'intermediate',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to get response');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let assistantContent = '';
      let assistantMessageId = (Date.now() + 1).toString();

      setMessages(prev => [...prev, {
        id: assistantMessageId,
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
                setMessages(prev => prev.map(m => 
                  m.id === assistantMessageId 
                    ? { ...m, content: assistantContent }
                    : m
                ));
              }
            } catch {
              // Incomplete JSON
            }
          }
        }
      }

      // Speak assistant response if voice is enabled
      if (voiceEnabled && isSpeechSupported && assistantContent) {
        speak(assistantContent);
      }
    } catch (error) {
      console.error('Chat error:', error);
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Não foi possível obter resposta.",
        variant: "destructive",
      });
      setMessages(prev => prev.filter(m => m.role !== 'assistant' || m.content !== ''));
    } finally {
      setIsTyping(false);
    }
  };

  const handleFinishConversation = async () => {
    if (messages.length < 3) {
      toast({
        title: "Conversa muito curta",
        description: "Continue a conversa para receber um feedback mais completo.",
        variant: "destructive",
      });
      return;
    }

    setIsAnalyzing(true);

    try {
      const { data, error } = await supabase.functions.invoke('analyze-conversation', {
        body: {
          messages: messages.map(m => ({ role: m.role, content: m.content })),
          scenarioId,
          userLevel: user?.level || 'intermediate',
        },
      });

      if (error) throw error;

      const feedback: ConversationFeedback = {
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
      };

      const conversation: Conversation = {
        id: conversationId,
        scenarioId: scenarioId || '',
        userId: user?.id || '',
        messages,
        startedAt: messages[0]?.timestamp || new Date(),
        endedAt: new Date(),
        feedback,
      };

      // Save to database
      await saveConversation(conversation);
      
      navigate('/feedback', { state: { feedback, scenarioId } });
    } catch (error) {
      console.error('Analysis error:', error);
      toast({
        title: "Erro na análise",
        description: "Não foi possível analisar a conversa. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleTranslate = (messageId: string, content: string) => {
    if (showTranslation === messageId) {
      setShowTranslation(null);
    } else {
      setShowTranslation(messageId);
      toast({
        title: "Tradução",
        description: `Tradução: "${content.substring(0, 50)}..."`,
      });
    }
  };

  const handleMicClick = () => {
    if (!canUseAudio) {
      toast({
        title: "Recurso Premium",
        description: "Faça upgrade para usar áudio.",
      });
      navigate('/plans');
      return;
    }

    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const toggleVoice = () => {
    if (isSpeaking) {
      stop();
    }
    setVoiceEnabled(!voiceEnabled);
    toast({
      title: voiceEnabled ? "Voz desativada" : "Voz ativada",
      description: voiceEnabled ? "A IA não falará mais as respostas." : "A IA falará as respostas em inglês.",
    });
  };

  const handleSpeakMessage = (content: string) => {
    if (isSpeaking) {
      stop();
    } else {
      speak(content);
    }
  };

  if (!scenario) {
    return <div className="min-h-screen flex items-center justify-center">Cenário não encontrado</div>;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="bg-card border-b border-border px-3 py-3 flex items-center gap-2 sm:px-4 sm:gap-3">
        <button 
          onClick={() => navigate('/home')}
          className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center shrink-0"
        >
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${scenario.color} flex items-center justify-center shrink-0`}>
          <span className="text-xl">{scenario.icon}</span>
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="font-semibold text-foreground truncate">{scenario.title}</h1>
          <p className="text-xs text-muted-foreground">
            {isTyping ? 'Digitando...' : isRecording ? 'Gravando...' : isSpeaking ? 'Falando...' : 'Online'}
          </p>
        </div>
        
        {/* Voice toggle button */}
        {isSpeechSupported && (
          <button 
            onClick={toggleVoice}
            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
              voiceEnabled ? 'bg-primary text-primary-foreground' : 'hover:bg-muted text-muted-foreground'
            }`}
            title={voiceEnabled ? "Desativar voz" : "Ativar voz"}
          >
            {voiceEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
          </button>
        )}
        
        <button className="w-10 h-10 rounded-xl hover:bg-muted flex items-center justify-center shrink-0">
          <MoreVertical className="w-5 h-5 text-muted-foreground" />
        </button>
      </div>

      {/* Credits Display */}
      {credits && (
        <div className="px-4 py-2 border-b border-border bg-card/50">
          <CreditsDisplay
            totalCredits={credits.total_credits}
            usedCredits={credits.used_credits}
            remainingCredits={credits.remaining_credits}
            trialEndsAt={credits.trial_ends_at}
            isExpired={credits.is_trial_expired}
            hasUnlimitedCredits={hasUnlimitedCredits}
          />
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-3 sm:px-4">
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
                {message.role === 'assistant' && (
                  <>
                    <button
                      onClick={() => handleTranslate(message.id, message.content)}
                      className="text-xs text-primary hover:underline"
                    >
                      <Languages className="w-4 h-4" />
                    </button>
                    {isSpeechSupported && (
                      <button
                        onClick={() => handleSpeakMessage(message.content)}
                        className={`text-xs hover:underline ${isSpeaking ? 'text-primary' : 'text-muted-foreground'}`}
                      >
                        <Volume2 className="w-4 h-4" />
                      </button>
                    )}
                  </>
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

      {/* Recording indicator */}
      {isRecording && (
        <div className="px-4 py-2 bg-destructive/10 border-t border-destructive/20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 bg-destructive rounded-full animate-pulse" />
            <span className="text-sm text-destructive font-medium">Gravando...</span>
          </div>
          <Button variant="ghost" size="sm" onClick={cancelRecording}>
            <X className="w-4 h-4 mr-1" />
            Cancelar
          </Button>
        </div>
      )}

      {/* Transcribing indicator */}
      {isTranscribing && (
        <div className="px-4 py-2 bg-primary/10 border-t border-primary/20 flex items-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin text-primary" />
          <span className="text-sm text-primary font-medium">Transcrevendo áudio...</span>
        </div>
      )}

      {/* Input Area */}
      <div className="bg-card border-t border-border px-3 py-3 space-y-3 sm:px-4">
        <div className="flex items-center gap-2">
          <div className="flex-1 relative">
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Digite sua mensagem..."
              className="pr-12"
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              disabled={isTyping || isRecording || isTranscribing}
            />
            <button
              onClick={handleMicClick}
              disabled={isTranscribing}
              className={`absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                isRecording 
                  ? 'bg-destructive text-white' 
                  : 'hover:bg-muted text-muted-foreground'
              }`}
            >
              {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>
          </div>
          <Button 
            size="icon" 
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isTyping || isRecording || isTranscribing}
          >
            <Send className="w-5 h-5" />
          </Button>
        </div>
        <Button 
          variant="secondary" 
          size="lg" 
          className="w-full"
          onClick={handleFinishConversation}
          disabled={isAnalyzing || messages.length < 3}
        >
          {isAnalyzing ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Analisando conversa...
            </>
          ) : (
            'Finalizar e gerar feedback'
          )}
        </Button>
      </div>

      <HelpButton />
    </div>
  );
};

export default Chat;
