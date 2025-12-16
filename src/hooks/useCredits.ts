import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface UserCredits {
  total_credits: number;
  used_credits: number;
  remaining_credits: number;
  trial_ends_at: Date | null;
  is_trial_expired: boolean;
}

export const useCredits = (userId: string | undefined, planId: string | undefined) => {
  const [credits, setCredits] = useState<UserCredits | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check if user has unlimited credits (paid plans)
  const hasUnlimitedCredits = planId && !['free_trial'].includes(planId);

  const fetchCredits = useCallback(async () => {
    if (!userId || hasUnlimitedCredits) {
      setIsLoading(false);
      if (hasUnlimitedCredits) {
        setCredits({
          total_credits: -1, // -1 indicates unlimited
          used_credits: 0,
          remaining_credits: -1,
          trial_ends_at: null,
          is_trial_expired: false,
        });
      }
      return;
    }

    try {
      const { data, error } = await supabase
        .from('user_credits')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        const trialEndsAt = new Date(data.trial_ends_at);
        const isExpired = new Date() > trialEndsAt;
        
        setCredits({
          total_credits: data.total_credits,
          used_credits: data.used_credits,
          remaining_credits: Math.max(0, data.total_credits - data.used_credits),
          trial_ends_at: trialEndsAt,
          is_trial_expired: isExpired,
        });
      } else {
        // Create new credits record for user
        const { data: newData, error: insertError } = await supabase
          .from('user_credits')
          .insert({
            user_id: userId,
            total_credits: 70,
            used_credits: 0,
          })
          .select()
          .single();

        if (insertError) throw insertError;

        if (newData) {
          const trialEndsAt = new Date(newData.trial_ends_at);
          setCredits({
            total_credits: newData.total_credits,
            used_credits: newData.used_credits,
            remaining_credits: newData.total_credits - newData.used_credits,
            trial_ends_at: trialEndsAt,
            is_trial_expired: false,
          });
        }
      }
    } catch (err) {
      console.error('Error fetching credits:', err);
      setError('Erro ao carregar créditos');
    } finally {
      setIsLoading(false);
    }
  }, [userId, hasUnlimitedCredits]);

  const useCredit = useCallback(async (): Promise<boolean> => {
    if (hasUnlimitedCredits) return true;
    if (!userId || !credits) return false;
    if (credits.remaining_credits <= 0 || credits.is_trial_expired) return false;

    try {
      const { error } = await supabase
        .from('user_credits')
        .update({ used_credits: credits.used_credits + 1 })
        .eq('user_id', userId);

      if (error) throw error;

      setCredits(prev => prev ? {
        ...prev,
        used_credits: prev.used_credits + 1,
        remaining_credits: prev.remaining_credits - 1,
      } : null);

      return true;
    } catch (err) {
      console.error('Error using credit:', err);
      return false;
    }
  }, [userId, credits, hasUnlimitedCredits]);

  const canSendMessage = useCallback((): boolean => {
    if (hasUnlimitedCredits) return true;
    if (!credits) return false;
    return credits.remaining_credits > 0 && !credits.is_trial_expired;
  }, [credits, hasUnlimitedCredits]);

  useEffect(() => {
    fetchCredits();
  }, [fetchCredits]);

  return {
    credits,
    isLoading,
    error,
    useCredit,
    canSendMessage,
    refetch: fetchCredits,
    hasUnlimitedCredits,
  };
};
