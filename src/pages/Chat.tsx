import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useApp } from '@/contexts/AppContext';
import { scenarios } from '@/data/scenarios';
import { Message, Conversation, ConversationFeedback, Language } from '@/types';
import { ArrowLeft, Send, Mic, MicOff, Languages, MoreVertical, Loader2, X, Volume2, VolumeX, Lightbulb } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAudioRecorder } from '@/hooks/useAudioRecorder';
import { useCredits } from '@/hooks/useCredits';
import { useConversations } from '@/hooks/useConversations';
import { useSpeechSynthesis } from '@/hooks/useSpeechSynthesis';
import { CreditsDisplay } from '@/components/CreditsDisplay';
import { HelpButton } from '@/components/HelpButton';

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`;

// Mensagens iniciais por idioma e cenário
const scenarioInitialMessages: Record<string, Record<string, string>> = {
  english: {
    restaurant: "Good evening! Welcome to our restaurant. How may I help you today?",
    interview: "Good morning! Thank you for coming in today. Please, have a seat. Let's start - can you tell me a little about yourself?",
    hotel: "Good afternoon! Welcome to Grand Hotel. How may I assist you today?",
    airport: "Hello! Welcome to the airport. May I see your passport and boarding pass, please?",
    shopping: "Hello! Welcome to our store. Can I help you find something today?",
    business: "Good morning everyone. Thank you for joining this meeting. Shall we begin with the agenda?",
    hospital: "Hello. I'm Dr. Smith. What brings you in today? How can I help you?",
    transport: "Hey there! Where are you heading today?",
  },
  spanish: {
    restaurant: "¡Buenas noches! Bienvenido a nuestro restaurante. ¿En qué puedo ayudarle hoy?",
    interview: "¡Buenos días! Gracias por venir hoy. Por favor, tome asiento. Comencemos - ¿puede contarme un poco sobre usted?",
    hotel: "¡Buenas tardes! Bienvenido al Gran Hotel. ¿En qué puedo asistirle hoy?",
    airport: "¡Hola! Bienvenido al aeropuerto. ¿Puedo ver su pasaporte y tarjeta de embarque, por favor?",
    shopping: "¡Hola! Bienvenido a nuestra tienda. ¿Puedo ayudarle a encontrar algo hoy?",
    business: "Buenos días a todos. Gracias por unirse a esta reunión. ¿Comenzamos con la agenda?",
    hospital: "Hola. Soy el Dr. García. ¿Qué le trae por aquí hoy? ¿Cómo puedo ayudarle?",
    transport: "¡Hola! ¿A dónde va hoy?",
  },
  french: {
    restaurant: "Bonsoir ! Bienvenue dans notre restaurant. Comment puis-je vous aider aujourd'hui ?",
    interview: "Bonjour ! Merci d'être venu aujourd'hui. Veuillez vous asseoir. Commençons - pouvez-vous me parler un peu de vous ?",
    hotel: "Bonjour ! Bienvenue au Grand Hôtel. Comment puis-je vous aider aujourd'hui ?",
    airport: "Bonjour ! Bienvenue à l'aéroport. Puis-je voir votre passeport et votre carte d'embarquement, s'il vous plaît ?",
    shopping: "Bonjour ! Bienvenue dans notre magasin. Puis-je vous aider à trouver quelque chose aujourd'hui ?",
    business: "Bonjour à tous. Merci de vous joindre à cette réunion. Commençons avec l'ordre du jour ?",
    hospital: "Bonjour. Je suis le Dr. Martin. Qu'est-ce qui vous amène aujourd'hui ? Comment puis-je vous aider ?",
    transport: "Salut ! Où allez-vous aujourd'hui ?",
  },
  italian: {
    restaurant: "Buonasera! Benvenuto nel nostro ristorante. Come posso aiutarla oggi?",
    interview: "Buongiorno! Grazie per essere venuto oggi. Prego, si sieda. Cominciamo - può parlarmi un po' di sé?",
    hotel: "Buon pomeriggio! Benvenuto al Grand Hotel. Come posso assisterla oggi?",
    airport: "Ciao! Benvenuto in aeroporto. Posso vedere il suo passaporto e la carta d'imbarco, per favore?",
    shopping: "Ciao! Benvenuto nel nostro negozio. Posso aiutarla a trovare qualcosa oggi?",
    business: "Buongiorno a tutti. Grazie per esservi uniti a questa riunione. Cominciamo con l'ordine del giorno?",
    hospital: "Buongiorno. Sono il Dr. Rossi. Cosa la porta qui oggi? Come posso aiutarla?",
    transport: "Ciao! Dove sta andando oggi?",
  },
  german: {
    restaurant: "Guten Abend! Willkommen in unserem Restaurant. Wie kann ich Ihnen heute helfen?",
    interview: "Guten Morgen! Vielen Dank, dass Sie heute gekommen sind. Bitte nehmen Sie Platz. Fangen wir an - können Sie mir etwas über sich erzählen?",
    hotel: "Guten Tag! Willkommen im Grand Hotel. Wie kann ich Ihnen heute behilflich sein?",
    airport: "Hallo! Willkommen am Flughafen. Darf ich Ihren Reisepass und Ihre Bordkarte sehen, bitte?",
    shopping: "Hallo! Willkommen in unserem Geschäft. Kann ich Ihnen helfen, etwas zu finden?",
    business: "Guten Morgen zusammen. Danke, dass Sie an diesem Meeting teilnehmen. Sollen wir mit der Tagesordnung beginnen?",
    hospital: "Guten Tag. Ich bin Dr. Müller. Was führt Sie heute zu uns? Wie kann ich Ihnen helfen?",
    transport: "Hallo! Wohin fahren Sie heute?",
  },
};

// Mapeamento de idioma para código de voz
const languageToSpeechCode: Record<string, string> = {
  english: 'en-US',
  spanish: 'es-ES',
  french: 'fr-FR',
  italian: 'it-IT',
  german: 'de-DE',
};

interface InstantFeedback {
  tip: string;
  type: 'tip' | 'praise';
}

const Chat: React.FC = () => {
  const navigate = useNavigate();
  const { scenarioId } = useParams<{ scenarioId: string }>();
  const { user } = useApp();
  const { toast } = useToast();
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [instantFeedbacks, setInstantFeedbacks] = useState<Record<string, InstantFeedback>>({});
  const [inputValue, setInputValue] = useState('');
  const [isFromAudio, setIsFromAudio] = useState(false); // Track if current input is from audio
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

  // Audio permission is now handled by canSendAudio() from useCredits hook
  const userLanguage = (user?.language || 'english') as Language;
  const speechCode = languageToSpeechCode[userLanguage] || 'en-US';

  // Hooks for credits, conversations, and speech
  const { credits, useCredit, useAudioCredit, canSendMessage, canSendAudio, hasUnlimitedCredits } = useCredits(authUserId, user?.plan);
  const { saveConversation } = useConversations(authUserId);
  const { speak, stop, isSpeaking, isSupported: isSpeechSupported } = useSpeechSynthesis({ lang: speechCode, rate: 0.9 });

  const { isRecording, isTranscribing, startRecording, stopRecording, cancelRecording } = useAudioRecorder({
    onTranscription: (text) => {
      if (text.trim()) {
        setInputValue(text);
        setIsFromAudio(true); // Mark that this input came from audio
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
      // Pegar mensagem inicial no idioma correto
      const languageMessages = scenarioInitialMessages[userLanguage] || scenarioInitialMessages.english;
      const initialContent = languageMessages[scenario.id] || languageMessages.interview || "Hello! Let's practice together.";
      
      const initialMessage: Message = {
        id: '1',
        role: 'assistant',
        content: initialContent,
        timestamp: new Date(),
      };
      setMessages([initialMessage]);
      
      // Speak initial message if voice is enabled
      if (voiceEnabled && isSpeechSupported) {
        speak(initialMessage.content);
      }
    }
  }, [scenario, userLanguage]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Função para extrair feedback instantâneo da resposta
  const parseResponseWithFeedback = (content: string): { mainResponse: string; feedback: InstantFeedback | null } => {
    const separator = '---';
    const parts = content.split(separator);
    
    if (parts.length >= 2) {
      const mainResponse = parts[0].trim();
      const feedbackPart = parts.slice(1).join(separator).trim();
      
      let feedbackType: 'tip' | 'praise' = 'tip';
      if (feedbackPart.includes('✨')) {
        feedbackType = 'praise';
      }
      
      // Remove emoji prefixes for cleaner display
      const cleanFeedback = feedbackPart
        .replace(/^💡\s*Dica:\s*/i, '')
        .replace(/^✨\s*/i, '')
        .trim();
      
      if (cleanFeedback) {
        return {
          mainResponse,
          feedback: { tip: cleanFeedback, type: feedbackType }
        };
      }
    }
    
    return { mainResponse: content, feedback: null };
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isTyping) return;

    const wasFromAudio = isFromAudio;
    console.log('[Chat] Sending message:', { wasFromAudio, hasUnlimitedCredits, credits });
    
    // Check credits before sending
    if (!canSendMessage()) {
      console.log('[Chat] Cannot send message - no credits');
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

    // Deduct appropriate credit (audio or regular)
    let creditUsed: boolean;
    if (wasFromAudio && !hasUnlimitedCredits) {
      console.log('[Chat] Using audio credit');
      creditUsed = await useAudioCredit(); // Uses both message + audio credit
    } else {
      console.log('[Chat] Using regular credit');
      creditUsed = await useCredit();
    }
    
    if (!creditUsed && !hasUnlimitedCredits) {
      console.log('[Chat] Failed to use credit');
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
    setIsFromAudio(false); // Reset audio flag
    setIsTyping(true);

    try {
      const chatMessages = [...messages, userMessage].map(m => ({
        role: m.role,
        content: m.content,
      }));

      // Buscar nível adaptativo do perfil
      let adaptiveLevel = null;
      if (authUserId) {
        const { data: profileData } = await supabase
          .from('user_profiles')
          .select('current_adaptive_level')
          .eq('user_id', authUserId)
          .maybeSingle();
        adaptiveLevel = profileData?.current_adaptive_level;
      }

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
          userLanguage: userLanguage,
          adaptiveLevel: adaptiveLevel,
          includeInstantFeedback: true, // Habilitar feedback instantâneo
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
                
                // Parse and separate feedback during streaming
                const { mainResponse } = parseResponseWithFeedback(assistantContent);
                
                setMessages(prev => prev.map(m => 
                  m.id === assistantMessageId 
                    ? { ...m, content: mainResponse }
                    : m
                ));
              }
            } catch {
              // Incomplete JSON
            }
          }
        }
      }

      // Final parse to extract feedback
      const { mainResponse, feedback } = parseResponseWithFeedback(assistantContent);
      
      // Update message with clean content
      setMessages(prev => prev.map(m => 
        m.id === assistantMessageId 
          ? { ...m, content: mainResponse }
          : m
      ));
      
      // Store feedback separately
      if (feedback) {
        setInstantFeedbacks(prev => ({
          ...prev,
          [assistantMessageId]: feedback
        }));
      }

      // Speak assistant response if voice is enabled
      if (voiceEnabled && isSpeechSupported && mainResponse) {
        speak(mainResponse);
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
          userLanguage: userLanguage, // Passar o idioma para análise correta
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
      
      navigate('/feedback', { state: { feedback, scenarioId, userLanguage } });
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
    // Check if user has audio credits (for free trial users)
    if (!canSendAudio()) {
      const message = credits?.remaining_audio_credits === 0
        ? "Você usou todos os seus créditos de áudio. Faça upgrade para áudios ilimitados."
        : "Faça upgrade para usar áudio.";
      toast({
        title: "Limite de áudio atingido",
        description: message,
        variant: "destructive",
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
    
    const languageNames: Record<string, string> = {
      english: 'inglês',
      spanish: 'espanhol',
      french: 'francês',
      italian: 'italiano',
      german: 'alemão',
    };
    
    toast({
      title: voiceEnabled ? "Voz desativada" : "Voz ativada",
      description: voiceEnabled 
        ? "A IA não falará mais as respostas." 
        : `A IA falará as respostas em ${languageNames[userLanguage] || 'inglês'}.`,
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
            totalAudioCredits={credits.total_audio_credits}
            usedAudioCredits={credits.used_audio_credits}
            remainingAudioCredits={credits.remaining_audio_credits}
            trialEndsAt={credits.trial_ends_at}
            isExpired={credits.is_trial_expired}
            hasUnlimitedCredits={hasUnlimitedCredits}
          />
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-3 sm:px-4">
        {messages.map((message) => (
          <div key={message.id} className="space-y-2">
            <div
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