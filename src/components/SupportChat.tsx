import React, { useState, useRef, useEffect } from 'react';
import { X, Send, Loader2, MessageSquare, Phone, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useApp } from '@/contexts/AppContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

interface SupportChatProps {
  isOpen: boolean;
  onClose: () => void;
}

const SUPPORT_CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/support-chat`;
const WHATSAPP_NUMBER = '5511999999999'; // Substituir pelo número real

export function SupportChat({ isOpen, onClose }: SupportChatProps) {
  const { user } = useApp();
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [ticketId, setTicketId] = useState<string | null>(null);
  const [showEscalation, setShowEscalation] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([{
        id: '1',
        role: 'assistant',
        content: `Olá${user?.name ? `, ${user.name.split(' ')[0]}` : ''}! 👋 Sou o assistente de suporte do Fluency IA. Como posso ajudar você hoje?`
      }]);
      createTicket();
    }
  }, [isOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const createTicket = async () => {
    if (!user?.id || ticketId) return;
    
    try {
      const { data, error } = await supabase
        .from('support_tickets')
        .insert({
          user_id: user.id,
          user_name: user.name || 'Usuário',
          user_email: user.email,
          description: 'Ticket criado automaticamente',
          status: 'open',
          conversation_history: []
        })
        .select()
        .single();

      if (error) throw error;
      setTicketId(data.id);
    } catch (error) {
      console.error('Error creating ticket:', error);
    }
  };

  const updateTicket = async (newMessages: Message[]) => {
    if (!ticketId) return;
    
    try {
      const conversationData = newMessages.map(m => ({ id: m.id, role: m.role, content: m.content }));
      await supabase
        .from('support_tickets')
        .update({
          conversation_history: conversationData as any,
          description: newMessages.find(m => m.role === 'user')?.content || 'Sem descrição'
        })
        .eq('id', ticketId);
    } catch (error) {
      console.error('Error updating ticket:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInputValue('');
    setIsLoading(true);

    try {
      const response = await fetch(SUPPORT_CHAT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          messages: newMessages.map(m => ({ role: m.role, content: m.content })),
          userName: user?.name,
          ticketId
        }),
      });

      if (!response.ok) {
        throw new Error('Falha ao obter resposta');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let assistantContent = '';
      const assistantMessageId = (Date.now() + 1).toString();

      setMessages(prev => [...prev, {
        id: assistantMessageId,
        role: 'assistant',
        content: ''
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

      // Check if we should show escalation option
      const userMessageCount = newMessages.filter(m => m.role === 'user').length;
      if (userMessageCount >= 3 && !showEscalation) {
        setShowEscalation(true);
      }

      // Update ticket with conversation
      const finalMessages = [...newMessages, { id: assistantMessageId, role: 'assistant' as const, content: assistantContent }];
      await updateTicket(finalMessages);

    } catch (error) {
      console.error('Support chat error:', error);
      toast({
        title: "Erro",
        description: "Não foi possível enviar a mensagem.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleWhatsApp = () => {
    const message = encodeURIComponent(
      `Olá, me chamo ${user?.name || 'Usuário'} e preciso de ajuda. Ticket: ${ticketId || 'N/A'}`
    );
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${message}`, '_blank');
    
    // Update ticket status to escalated
    if (ticketId) {
      supabase
        .from('support_tickets')
        .update({ status: 'escalated' })
        .eq('id', ticketId);
    }
  };

  const handleClose = () => {
    if (ticketId && messages.length > 1) {
      supabase
        .from('support_tickets')
        .update({ 
          status: 'resolved',
          resolved_at: new Date().toISOString()
        })
        .eq('id', ticketId);
    }
    setMessages([]);
    setTicketId(null);
    setShowEscalation(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-end p-4 sm:items-center sm:justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={handleClose} />
      
      <div className="relative w-full max-w-md h-[80vh] max-h-[600px] bg-card rounded-2xl shadow-fluency-lg flex flex-col overflow-hidden animate-scale-in">
        {/* Header */}
        <div className="gradient-primary px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-white">Suporte Fluency IA</h3>
              <p className="text-xs text-white/70">
                {ticketId ? `Ticket: ${ticketId.slice(0, 8)}...` : 'Online'}
              </p>
            </div>
          </div>
          <button 
            onClick={handleClose}
            className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors"
          >
            <X className="w-4 h-4 text-white" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-2.5 ${
                  message.role === 'user'
                    ? 'gradient-primary text-white rounded-br-md'
                    : 'bg-muted text-foreground rounded-bl-md'
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
              </div>
            </div>
          ))}
          
          {isLoading && (
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

        {/* Escalation */}
        {showEscalation && (
          <div className="px-4 py-3 bg-muted/50 border-t border-border">
            <p className="text-xs text-muted-foreground mb-2">
              Não conseguimos resolver? Fale com um atendente:
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={handleWhatsApp}
              className="w-full gap-2"
            >
              <Phone className="w-4 h-4" />
              Falar no WhatsApp
              <ExternalLink className="w-3 h-3" />
            </Button>
          </div>
        )}

        {/* Input */}
        <div className="p-4 border-t border-border">
          <div className="flex items-center gap-2">
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Digite sua mensagem..."
              className="flex-1"
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              disabled={isLoading}
            />
            <Button 
              size="icon" 
              onClick={handleSendMessage}
              disabled={!inputValue.trim() || isLoading}
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
