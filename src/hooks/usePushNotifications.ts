/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

// Converte a chave VAPID base64 para Uint8Array (exigido pelo PushManager)
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export const usePushNotifications = (userId: string | undefined) => {
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [shouldShowModal, setShouldShowModal] = useState(false);

  // 1. Verifica se o navegador suporta notificações push
  useEffect(() => {
    const supported = "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
    setIsSupported(supported);
    if (!supported) setIsLoading(false);
  }, []);

  // 2. Verifica se já existe uma inscrição ativa para o usuário
  useEffect(() => {
    if (!isSupported || !userId) {
      setIsLoading(false);
      return;
    }

    const checkSubscription = async () => {
      try {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager?.getSubscription();

        if (subscription) {
          // Busca todas as inscrições do usuário no banco
          const { data, error } = await supabase
            .from("push_subscriptions")
            .select("subscription")
            .eq("user_id", userId);

          if (error) throw error;

          // Verifica se alguma inscrição salva tem o mesmo endpoint
          const exists =
            data?.some((row) => {
              try {
                const sub = JSON.parse(row.subscription);
                return sub.endpoint === subscription.endpoint;
              } catch {
                return false;
              }
            }) ?? false;

          setIsSubscribed(exists);
          setShouldShowModal(!exists && Notification.permission === "default");
        } else {
          setIsSubscribed(false);
          const dismissed = sessionStorage.getItem("push_modal_dismissed");
          setShouldShowModal(Notification.permission === "default" && !dismissed);
        }
      } catch (err) {
        console.error("[Push] Error checking subscription:", err);
      } finally {
        setIsLoading(false);
      }
    };

    checkSubscription();
  }, [isSupported, userId]);

  // 3. Função para assinar o usuário (chamada quando ele aceita)
  const subscribe = useCallback(async (): Promise<boolean> => {
    if (!isSupported || !userId) return false;

    try {
      // Solicita permissão
      const permission = await Notification.requestPermission();
      if (permission !== "granted") return false;

      // Registra o service worker (se ainda não estiver registrado)
      const registration = await navigator.serviceWorker.register("/sw.js");
      await navigator.serviceWorker.ready;

      // Lê a chave VAPID pública das variáveis de ambiente
      const vapidPublicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
      if (!vapidPublicKey) {
        console.error("[Push] VITE_VAPID_PUBLIC_KEY não configurada");
        return false;
      }

      // Cria a inscrição push
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
      });

      // Salva a inscrição no banco (apenas o JSON completo)
      const { error } = await supabase.from("push_subscriptions").insert({
        user_id: userId,
        subscription: JSON.stringify(subscription),
      });

      if (error) {
        console.error("[Push] Erro ao salvar subscription:", error);
        return false;
      }

      setIsSubscribed(true);
      setShouldShowModal(false);
      return true;
    } catch (err) {
      console.error("[Push] Erro ao assinar:", err);
      return false;
    }
  }, [isSupported, userId]);

  // 4. Função para dispensar o modal (sem assinar)
  const dismiss = useCallback(() => {
    sessionStorage.setItem("push_modal_dismissed", "true");
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
