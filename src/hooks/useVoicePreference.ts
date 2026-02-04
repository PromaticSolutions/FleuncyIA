import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface UseVoicePreferenceOptions {
  userId?: string;
}

export function useVoicePreference({ userId }: UseVoicePreferenceOptions = {}) {
  const [voiceEnabled, setVoiceEnabled] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasAskedPreference, setHasAskedPreference] = useState(false);
  const loadedRef = useRef(false);

  // Load preference from database on mount
  useEffect(() => {
    if (!userId || loadedRef.current) return;
    
    const loadPreference = async () => {
      try {
        setIsLoading(true);
        
        const { data, error } = await supabase
          .from('user_settings')
          .select('voice_enabled')
          .eq('user_id', userId)
          .maybeSingle();
        
        if (error) {
          console.error('[VoicePreference] Error loading:', error);
          // Fall back to localStorage
          const savedPreference = localStorage.getItem('fluency_voice_preference');
          if (savedPreference !== null) {
            setVoiceEnabled(savedPreference === 'true');
            setHasAskedPreference(true);
          }
          return;
        }
        
        if (data) {
          loadedRef.current = true;
          // If voice_enabled is explicitly set (not default null behavior)
          setVoiceEnabled(data.voice_enabled);
          setHasAskedPreference(true);
          // Sync to localStorage for offline access
          localStorage.setItem('fluency_voice_preference', String(data.voice_enabled));
        } else {
          // No settings record yet - check localStorage
          const savedPreference = localStorage.getItem('fluency_voice_preference');
          if (savedPreference !== null) {
            setVoiceEnabled(savedPreference === 'true');
            setHasAskedPreference(true);
          }
        }
      } catch (err) {
        console.error('[VoicePreference] Error:', err);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadPreference();
  }, [userId]);

  // Save preference to database and localStorage
  const setPreference = useCallback(async (enabled: boolean) => {
    setVoiceEnabled(enabled);
    setHasAskedPreference(true);
    localStorage.setItem('fluency_voice_preference', String(enabled));
    
    if (!userId) return;
    
    try {
      const { error } = await supabase
        .from('user_settings')
        .upsert({
          user_id: userId,
          voice_enabled: enabled,
        }, {
          onConflict: 'user_id',
        });
      
      if (error) {
        console.error('[VoicePreference] Error saving:', error);
      }
    } catch (err) {
      console.error('[VoicePreference] Save error:', err);
    }
  }, [userId]);

  return {
    voiceEnabled,
    isLoading,
    hasAskedPreference,
    setPreference,
    // Show modal only if never asked before AND preference is not loaded
    shouldShowModal: !isLoading && !hasAskedPreference && voiceEnabled === null,
  };
}
