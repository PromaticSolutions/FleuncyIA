const subscribe = useCallback(async (): Promise<boolean> => {
  if (!isSupported || !userId) return false;

  try {
    const permission = await Notification.requestPermission();
    if (permission !== "granted") return false;

    const registration = await navigator.serviceWorker.register("/sw.js");
    await navigator.serviceWorker.ready;

    const vapidPublicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
    if (!vapidPublicKey) return false;

    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
    });

    const subscriptionJson = subscription.toJSON();

    const { error } = await supabase.from("push_subscriptions").upsert(
      {
        user_id: userId,
        endpoint: subscriptionJson.endpoint!,
        subscription: JSON.stringify(subscription),
      },
      {
        onConflict: "user_id,endpoint",
      },
    );

    if (error) {
      console.error("[Push] Error saving subscription:", error);
      return false;
    }

    setIsSubscribed(true);
    setShouldShowModal(false);
    return true;
  } catch (err) {
    console.error("[Push] Error subscribing:", err);
    return false;
  }
}, [isSupported, userId]);
