import { useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

type EventCategory =
  | 'auth' 
  | 'acquisition' 
  | 'engagement' 
  | 'product' 
  | 'growth' 
  | 'monetization' 
  | 'feedback';

type EventName = 
  // Auth
  | 'user_signup'
  | 'user_login'
  | 'user_first_session'
  // Acquisition
  | 'page_view'
  | 'source_detected'
  // Engagement
  | 'session_start'
  | 'session_end'
  | 'feature_used'
  // Product
  | 'core_action_started'
  | 'core_action_completed'
  // Growth
  | 'invite_sent'
  | 'invite_accepted'
  // Monetization
  | 'plan_viewed'
  | 'checkout_started'
  | 'payment_completed'
  | 'subscription_created'
  | 'subscription_canceled'
  // Feedback
  | 'feedback_submitted'
  | 'nps_submitted';

interface TrackEventParams {
  eventName: EventName;
  category: EventCategory;
  metadata?: Record<string, unknown>;
}

const SESSION_KEY = 'analytics_session_id';
const SESSION_START_KEY = 'analytics_session_start';
const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes

function getSessionId(): string {
  const stored = sessionStorage.getItem(SESSION_KEY);
  const startTime = sessionStorage.getItem(SESSION_START_KEY);
  
  if (stored && startTime) {
    const elapsed = Date.now() - parseInt(startTime, 10);
    if (elapsed < SESSION_TIMEOUT) {
      return stored;
    }
  }
  
  // Create new session
  const newSessionId = crypto.randomUUID();
  sessionStorage.setItem(SESSION_KEY, newSessionId);
  sessionStorage.setItem(SESSION_START_KEY, Date.now().toString());
  return newSessionId;
}

function getSourceChannel(): string {
  const referrer = document.referrer;
  const urlParams = new URLSearchParams(window.location.search);
  
  // Check UTM parameters
  const utmSource = urlParams.get('utm_source');
  const utmMedium = urlParams.get('utm_medium');
  
  if (utmSource) {
    if (utmMedium === 'cpc' || utmMedium === 'paid') return 'paid';
    if (utmMedium === 'referral') return 'referral';
    return utmSource;
  }
  
  if (!referrer) return 'direct';
  
  const referrerUrl = new URL(referrer);
  const hostname = referrerUrl.hostname;
  
  // Organic search
  if (hostname.includes('google') || hostname.includes('bing') || hostname.includes('yahoo')) {
    return 'organic';
  }
  
  // Social
  if (hostname.includes('facebook') || hostname.includes('instagram') || 
      hostname.includes('twitter') || hostname.includes('linkedin')) {
    return 'social';
  }
  
  return 'referral';
}

export function useAnalyticsTracking() {
  const sessionIdRef = useRef<string | null>(null);
  const sessionStartedRef = useRef(false);

  const trackEvent = useCallback(async ({ eventName, category, metadata = {} }: TrackEventParams) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const sessionId = getSessionId();
      
      await supabase.from('analytics_events').insert({
        user_id: user?.id || null,
        session_id: sessionId,
        event_name: eventName,
        event_category: category,
        metadata: {
          ...metadata,
          url: window.location.pathname,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      console.error('Error tracking event:', error);
    }
  }, []);

  const startSession = useCallback(async () => {
    if (sessionStartedRef.current) return;
    sessionStartedRef.current = true;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      const sessionId = getSessionId();
      sessionIdRef.current = sessionId;
      
      const sourceChannel = getSourceChannel();
      const userAgent = navigator.userAgent;
      const isMobile = /iPhone|iPad|iPod|Android/i.test(userAgent);
      
      await supabase.from('analytics_sessions').insert({
        session_id: sessionId,
        user_id: user?.id || null,
        source_channel: sourceChannel,
        device_type: isMobile ? 'mobile' : 'desktop',
        browser: navigator.userAgent.split(' ').pop() || 'unknown',
      });

      // Track session start event
      await trackEvent({
        eventName: 'session_start',
        category: 'engagement',
        metadata: { source_channel: sourceChannel },
      });

      // Track source detection
      if (sourceChannel !== 'direct') {
        await trackEvent({
          eventName: 'source_detected',
          category: 'acquisition',
          metadata: { source: sourceChannel },
        });
      }
    } catch (error) {
      console.error('Error starting session:', error);
    }
  }, [trackEvent]);

  const endSession = useCallback(async () => {
    if (!sessionIdRef.current) return;

    try {
      const startTime = sessionStorage.getItem(SESSION_START_KEY);
      const duration = startTime ? Math.floor((Date.now() - parseInt(startTime, 10)) / 1000) : 0;
      
      await supabase
        .from('analytics_sessions')
        .update({
          ended_at: new Date().toISOString(),
          duration_seconds: duration,
        })
        .eq('session_id', sessionIdRef.current);

      await trackEvent({
        eventName: 'session_end',
        category: 'engagement',
        metadata: { duration_seconds: duration },
      });
    } catch (error) {
      console.error('Error ending session:', error);
    }
  }, [trackEvent]);

  const trackPageView = useCallback(async (pageName?: string) => {
    await trackEvent({
      eventName: 'page_view',
      category: 'acquisition',
      metadata: { page: pageName || window.location.pathname },
    });
  }, [trackEvent]);

  const trackFeatureUsed = useCallback(async (featureName: string, metadata?: Record<string, unknown>) => {
    await trackEvent({
      eventName: 'feature_used',
      category: 'engagement',
      metadata: { feature: featureName, ...metadata },
    });
  }, [trackEvent]);

  const trackCoreAction = useCallback(async (action: 'started' | 'completed', actionName: string, metadata?: Record<string, unknown>) => {
    await trackEvent({
      eventName: action === 'started' ? 'core_action_started' : 'core_action_completed',
      category: 'product',
      metadata: { action: actionName, ...metadata },
    });
  }, [trackEvent]);

  // Initialize session on mount
  useEffect(() => {
    startSession();

    // End session on page unload
    const handleUnload = () => {
      endSession();
    };

    window.addEventListener('beforeunload', handleUnload);
    return () => {
      window.removeEventListener('beforeunload', handleUnload);
    };
  }, [startSession, endSession]);

  return {
    trackEvent,
    trackPageView,
    trackFeatureUsed,
    trackCoreAction,
    startSession,
    endSession,
  };
}
