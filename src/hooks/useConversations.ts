import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Conversation, Message, ConversationFeedback } from '@/types';
import { Json } from '@/integrations/supabase/types';

interface DbMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  audioUrl?: string;
}

export const useConversations = (userId: string | undefined) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchConversations = useCallback(async () => {
    if (!userId) {
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedConversations: Conversation[] = (data || []).map((conv) => {
        const messages = (conv.messages as unknown as DbMessage[]) || [];
        const feedback = conv.feedback as unknown as ConversationFeedback | null;
        
        return {
          id: conv.id,
          scenarioId: conv.scenario_id,
          userId: conv.user_id,
          messages: messages.map((msg) => ({
            ...msg,
            timestamp: new Date(msg.timestamp),
          })),
          startedAt: new Date(conv.started_at),
          endedAt: conv.ended_at ? new Date(conv.ended_at) : undefined,
          feedback: feedback || undefined,
        };
      });

      setConversations(formattedConversations);
    } catch (err) {
      console.error('Error fetching conversations:', err);
      setError('Erro ao carregar conversas');
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  const saveConversation = useCallback(async (conversation: Conversation): Promise<boolean> => {
    if (!userId) return false;

    try {
      const messagesJson = conversation.messages.map(msg => ({
        id: msg.id,
        role: msg.role,
        content: msg.content,
        timestamp: msg.timestamp.toISOString(),
        audioUrl: msg.audioUrl,
      })) as unknown as Json;

      const feedbackJson = conversation.feedback ? (conversation.feedback as unknown as Json) : null;

      const { error } = await supabase
        .from('conversations')
        .upsert({
          id: conversation.id,
          user_id: userId,
          scenario_id: conversation.scenarioId,
          messages: messagesJson,
          started_at: conversation.startedAt.toISOString(),
          ended_at: conversation.endedAt?.toISOString() || null,
          feedback: feedbackJson,
        });

      if (error) throw error;

      // Update local state
      setConversations(prev => {
        const existing = prev.findIndex(c => c.id === conversation.id);
        if (existing >= 0) {
          const updated = [...prev];
          updated[existing] = conversation;
          return updated;
        }
        return [conversation, ...prev];
      });

      return true;
    } catch (err) {
      console.error('Error saving conversation:', err);
      return false;
    }
  }, [userId]);

  const deleteConversation = useCallback(async (conversationId: string): Promise<boolean> => {
    if (!userId) return false;

    try {
      const { error } = await supabase
        .from('conversations')
        .delete()
        .eq('id', conversationId)
        .eq('user_id', userId);

      if (error) throw error;

      setConversations(prev => prev.filter(c => c.id !== conversationId));
      return true;
    } catch (err) {
      console.error('Error deleting conversation:', err);
      return false;
    }
  }, [userId]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  return {
    conversations,
    isLoading,
    error,
    saveConversation,
    deleteConversation,
    refetch: fetchConversations,
  };
};
