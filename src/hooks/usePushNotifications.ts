import { useState, useEffect, useCallback } from 'react';
import { req } from '../lib/api';

const VAPID_PUBLIC_KEY = 'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U';

interface PushSubscriptionJSON {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

interface PushNotificationOptions {
  onNotification?: (notification: Notification) => void;
}

export function usePushNotifications(options: PushNotificationOptions = {}) {
  const [isSupported, setIsSupported] = useState(false);
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check if push notifications are supported
  useEffect(() => {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      setIsSupported(true);
    }
  }, []);

  // Convert base64 to Uint8Array for VAPID key
  const urlBase64ToUint8Array = (base64String: string): Uint8Array => {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  };

  // Subscribe to push notifications
  const subscribe = useCallback(async () => {
    if (!isSupported) {
      setError('Push notifications are not supported in this browser');
      return false;
    }

    try {
      // Register service worker
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
        updateViaCache: 'none',
      });

      console.log('[push] Service Worker registered:', registration.scope);

      // Check existing subscription
      const existingSubscription = await registration.pushManager.getSubscription();
      if (existingSubscription) {
        setSubscription(existingSubscription);
        setIsSubscribed(true);
        console.log('[push] Existing subscription found');
        return true;
      }

      // Subscribe to push notifications
      const newSubscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY) as unknown as BufferSource,
      });

      console.log('[push] New subscription created');

      // Send subscription to backend
      await req('/push/subscribe', {
        method: 'POST',
        body: JSON.stringify({ subscription: newSubscription.toJSON() }),
      });

      setSubscription(newSubscription);
      setIsSubscribed(true);
      setError(null);
      console.log('[push] Subscribed successfully');
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to subscribe to push notifications';
      setError(message);
      console.error('[push] Subscription error:', message);
      return false;
    }
  }, [isSupported]);

  // Unsubscribe from push notifications
  const unsubscribe = useCallback(async () => {
    if (!subscription) {
      return false;
    }

    try {
      await subscription.unsubscribe();
      await req('/push/unsubscribe', { method: 'POST' });
      setSubscription(null);
      setIsSubscribed(false);
      console.log('[push] Unsubscribed successfully');
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to unsubscribe';
      setError(message);
      console.error('[push] Unsubscribe error:', message);
      return false;
    }
  }, [subscription]);

  // Send a test notification
  const sendTestNotification = useCallback(async () => {
    try {
      await req('/push/test', { method: 'POST' });
      return true;
    } catch (err) {
      console.error('[push] Test notification error:', err);
      return false;
    }
  }, []);

  return {
    isSupported,
    isSubscribed,
    subscription,
    error,
    subscribe,
    unsubscribe,
    sendTestNotification,
  };
}