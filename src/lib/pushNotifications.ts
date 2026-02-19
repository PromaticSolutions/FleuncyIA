// Helper to trigger push notifications from the frontend via edge function
const PUSH_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-push-notification`;

export async function sendPushNotification(params: {
  userId?: string;
  userIds?: string[];
  title: string;
  body: string;
  url?: string;
  tag?: string;
  accessToken: string;
}): Promise<boolean> {
  try {
    const response = await fetch(PUSH_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${params.accessToken}`,
      },
      body: JSON.stringify({
        userId: params.userId,
        userIds: params.userIds,
        title: params.title,
        body: params.body,
        url: params.url || '/home',
        tag: params.tag || 'fluency-general',
      }),
    });
    return response.ok;
  } catch {
    console.error('[Push] Failed to send notification');
    return false;
  }
}
