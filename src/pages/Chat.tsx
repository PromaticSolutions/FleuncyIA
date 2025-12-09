import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useApp } from '@/contexts/AppContext';
import { scenarios } from '@/data/scenarios';
import { Message, Conversation, ConversationFeedback } from '@/types';
import { ArrowLeft, Send, Mic, Languages, Settings, MoreVertical } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const aiResponses: Record<string, string[]> = {
  restaurant: [
    "Good evening! Welcome to our restaurant. How many people will be dining tonight?",
    "Perfect! Here's your menu. Would you like to start with something to drink?",
    "Excellent choice! Would you like any appetizers while you wait for your main course?",
    "I'll have that ready for you shortly. Is there anything else I can help you with?",
  ],
  interview: [
    "Good morning! Thank you for coming in today. Please, have a seat. Can you tell me a little about yourself?",
    "That's interesting. What would you say is your greatest strength?",
    "And what about your weaknesses? How do you handle challenges?",
    "Where do you see yourself in five years?",
  ],
  hotel: [
    "Good afternoon! Welcome to Grand Hotel. Do you have a reservation?",
    "Perfect, I found your reservation. Could I see your ID, please?",
    "Your room is on the 5th floor. Would you like help with your luggage?",
    "Is there anything else you need? Breakfast is served from 7 to 10 AM.",
  ],
  airport: [
    "Good morning! May I see your passport and boarding pass, please?",
    "Are you carrying any liquids over 100ml in your hand luggage?",
    "Perfect. Your flight departs from Gate B7. Boarding starts at 10:30.",
    "Have a pleasant flight!",
  ],
  shopping: [
    "Hello! Welcome to our store. Can I help you find something?",
    "This one comes in three sizes: small, medium, and large. What size do you wear?",
    "Would you like to try it on? The fitting rooms are right over there.",
    "That looks great on you! Would you like anything else?",
  ],
  business: [
    "Good morning everyone. Let's begin our quarterly review meeting.",
    "Could you share the latest sales figures with the team?",
    "That's an interesting point. What's your proposed solution?",
    "Let's schedule a follow-up meeting to discuss this further.",
  ],
  hospital: [
    "Hello, what brings you in today? Can you describe your symptoms?",
    "How long have you been experiencing these symptoms?",
    "I'm going to check your vitals. Have you taken any medication?",
    "Based on my examination, I recommend some rest and this prescription.",
  ],
  transport: [
    "Hello! Where are you headed today?",
    "Got it. Would you prefer the highway or local streets?",
    "We should arrive in about 15 minutes. Is the temperature okay?",
    "We're almost there. Would you like me to drop you off at the main entrance?",
  ],
};

const Chat: React.FC = () => {
  const navigate = useNavigate();
  const { scenarioId } = useParams<{ scenarioId: string }>();
  const { user, addConversation } = useApp();
  const { toast } = useToast();
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showTranslation, setShowTranslation] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [aiResponseIndex, setAiResponseIndex] = useState(0);

  const scenario = scenarios.find(s => s.id === scenarioId);

  useEffect(() => {
    if (scenario && messages.length === 0) {
      // Initial AI message
      const initialMessage: Message = {
        id: '1',
        role: 'assistant',
        content: aiResponses[scenario.id]?.[0] || "Hello! Let's practice together.",
        timestamp: new Date(),
      };
      setMessages([initialMessage]);
      setAiResponseIndex(1);
    }
  }, [scenario]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    // Simulate AI response
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1000));

    const responses = scenario ? aiResponses[scenario.id] : [];
    const aiMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: responses[aiResponseIndex % responses.length] || "That's a great response! Keep practicing.",
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, aiMessage]);
    setAiResponseIndex(prev => prev + 1);
    setIsTyping(false);
  };

  const handleFinishConversation = () => {
    const feedback: ConversationFeedback = {
      overallScore: 75 + Math.floor(Math.random() * 20),
      grammar: 70 + Math.floor(Math.random() * 25),
      vocabulary: 75 + Math.floor(Math.random() * 20),
      clarity: 80 + Math.floor(Math.random() * 15),
      fluency: 70 + Math.floor(Math.random() * 20),
      contextCoherence: 80 + Math.floor(Math.random() * 15),
      errors: [
        {
          original: "I want go there",
          corrected: "I want to go there",
          category: 'grammar',
          explanation: "Use 'to' before the infinitive verb",
        },
      ],
      improvements: [
        "Practice using articles (a, an, the)",
        "Work on verb tenses consistency",
      ],
      correctPhrases: [
        "Your greeting was natural and polite",
        "Good use of formal vocabulary",
      ],
      estimatedLevel: 'B1',
    };

    const conversation: Conversation = {
      id: Date.now().toString(),
      scenarioId: scenarioId || '',
      userId: user?.id || '',
      messages,
      startedAt: messages[0]?.timestamp || new Date(),
      endedAt: new Date(),
      feedback,
    };

    addConversation(conversation);
    navigate('/feedback', { state: { feedback, scenarioId } });
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

  const handleMic = () => {
    if (user?.plan === 'free_trial' || user?.plan === 'beginner') {
      toast({
        title: "Recurso Premium",
        description: "Faça upgrade para usar áudio.",
      });
      navigate('/plans');
    } else {
      toast({
        title: "Gravando...",
        description: "Fale agora.",
      });
    }
  };

  if (!scenario) {
    return <div>Cenário não encontrado</div>;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="bg-card border-b border-border px-4 py-3 flex items-center gap-3">
        <button 
          onClick={() => navigate('/home')}
          className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center"
        >
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${scenario.color} flex items-center justify-center`}>
          <span className="text-xl">{scenario.icon}</span>
        </div>
        <div className="flex-1">
          <h1 className="font-semibold text-foreground">{scenario.title}</h1>
          <p className="text-xs text-muted-foreground">{isTyping ? 'Digitando...' : 'Online'}</p>
        </div>
        <button className="w-10 h-10 rounded-xl hover:bg-muted flex items-center justify-center">
          <MoreVertical className="w-5 h-5 text-muted-foreground" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                message.role === 'user'
                  ? 'gradient-primary text-white rounded-br-md'
                  : 'bg-muted text-foreground rounded-bl-md'
              }`}
            >
              <p className="text-sm">{message.content}</p>
              <div className="flex items-center justify-end gap-2 mt-1">
                <span className={`text-xs ${message.role === 'user' ? 'text-white/70' : 'text-muted-foreground'}`}>
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
                {message.role === 'assistant' && (
                  <button
                    onClick={() => handleTranslate(message.id, message.content)}
                    className="text-xs text-primary hover:underline"
                  >
                    <Languages className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
        {isTyping && (
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

      {/* Input Area */}
      <div className="bg-card border-t border-border px-4 py-3 space-y-3">
        <div className="flex items-center gap-2">
          <div className="flex-1 relative">
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Digite sua mensagem..."
              className="pr-12"
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            />
            <button
              onClick={handleMic}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg hover:bg-muted flex items-center justify-center"
            >
              <Mic className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>
          <Button 
            size="icon" 
            onClick={handleSendMessage}
            disabled={!inputValue.trim()}
          >
            <Send className="w-5 h-5" />
          </Button>
        </div>
        <Button 
          variant="secondary" 
          size="lg" 
          className="w-full"
          onClick={handleFinishConversation}
        >
          Finalizar e gerar feedback
        </Button>
      </div>
    </div>
  );
};

export default Chat;
