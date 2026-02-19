/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

const VAPID_PUBLIC_KEY_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-push-notification`;

export const usePushNotifications = (userId: string | undefined) => {
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [shouldShowModal, setShouldShowModal] = useState(false);

  // Check if push is supported
  useEffect(() => {
    const supported = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
    setIsSupported(supported);
    if (!supported) setIsLoading(false);
  }, []);

  // Check existing subscription
  useEffect(() => {
    if (!isSupported || !userId) {
      setIsLoading(false);
      return;
    }

    const checkSubscription = async () => {
      try {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await (registration as any).pushManager?.getSubscription();
        
        if (subscription) {
          // Verify it exists in DB
          const { data } = await supabase
            .from('push_subscriptions')
            .select('id')
            .eq('user_id', userId)
            .eq('endpoint', subscription.endpoint)
            .maybeSingle();
          
          setIsSubscribed(!!data);
          setShouldShowModal(!data && Notification.permission === 'default');
        } else {
          setIsSubscribed(false);
          // Show modal only if permission hasn't been denied and user hasn't dismissed before
          const dismissed = sessionStorage.getItem('push_modal_dismissed');
          setShouldShowModal(Notification.permission === 'default' && !dismissed);
        }
      } catch (err) {
        console.error('[Push] Error checking subscription:', err);
      } finally {
        setIsLoading(false);
      }
    };

    checkSubscription();
  }, [isSupported, userId]);

  const subscribe = useCallback(async (): Promise<boolean> => {
    if (!isSupported || !userId) return false;

    try {
      // Get VAPID public key from edge function
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) return false;

      const keyResponse = await fetch(VAPID_PUBLIC_KEY_URL + '?action=get-vapid-key', {
        headers: { 'Authorization': `Bearer ${session.access_token}` },
      });
      
      if (!keyResponse.ok) return false;
      const { vapidPublicKey } = await keyResponse.json();
      if (!vapidPublicKey) return false;

      // Request permission
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') return false;

      // Register service worker
      const registration = await navigator.serviceWorker.register('/sw.js');
      await navigator.serviceWorker.ready;

      // Subscribe
      const subscription = await (registration as any).pushManager.subscribe({
        userApplicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
        applicationServerVisibility: 'public',
      });

      const subscriptionJson = subscription.toJSON();

      // Save to database
      const { error } = await supabase
        .from('push_subscriptions')
        .upsert({
          user_id: userId,
          endpoint: subscriptionJson.endpoint!,
          p256dh: subscriptionJson.keys!.p256dh!,
          auth: subscriptionJson.keys!.auth!,
        }, {
          onConflict: 'user_id,endpoint',
        });

      if (error) {
        console.error('[Push] Error saving subscription:', error);
        return false;
      }

      setIsSubscribed(true);
      setShouldShowModal(false);
      return true;
    } catch (err) {
      console.error('[Push] Error subscribing:', err);
      return false;
    }
  }, [isSupported, userId]);

  const dismiss = useCallback(() => {
    sessionStorage.setItem('push_modal_dismissed', 'true');
    setShouldShowModal(false);
  }, []);

  return {
    isSupported,
    isSubscribed,
    isLoading,
    shouldShowModal,
    subscribe,
    dismiss,
  };
};
