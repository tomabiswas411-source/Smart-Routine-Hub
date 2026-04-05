"use client";

import { useState, useEffect, useCallback } from 'react';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

interface PWAStatus {
  isInstalled: boolean;
  isStandalone: boolean;
  canInstall: boolean;
  isOnline: boolean;
  hasNotificationPermission: boolean;
}

interface PushNotificationData {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: {
    url?: string;
    semester?: number;
    year?: number;
    program?: string;
    changeType?: string;
  };
}

export function usePWA() {
  // Calculate initial state synchronously
  const getInitialState = (): PWAStatus => {
    const isStandalone = typeof window !== 'undefined' && 
      (window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true);
    
    return {
      isInstalled: isStandalone,
      isStandalone,
      canInstall: false,
      isOnline: typeof window !== 'undefined' ? navigator.onLine : true,
      hasNotificationPermission: typeof window !== 'undefined' && 'Notification' in window 
        ? Notification.permission === 'granted' 
        : false,
    };
  };

  const [status, setStatus] = useState<PWAStatus>(getInitialState);
  
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    // Check online status
    const updateOnlineStatus = () => {
      setStatus(prev => ({ ...prev, isOnline: navigator.onLine }));
    };

    // Check notification permission
    const checkNotificationPermission = () => {
      if ('Notification' in window) {
        setStatus(prev => ({
          ...prev,
          hasNotificationPermission: Notification.permission === 'granted'
        }));
      }
    };

    // Handle install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setStatus(prev => ({ ...prev, canInstall: true }));
    };

    // Handle app installed
    const handleAppInstalled = () => {
      setDeferredPrompt(null);
      setStatus(prev => ({ ...prev, canInstall: false, isInstalled: true }));
    };

    checkNotificationPermission();

    // Event listeners
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);

    // Register service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then((registration) => {
          console.log('SW registered:', registration.scope);
          
          // Check for updates
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  // New version available
                  console.log('New version available!');
                }
              });
            }
          });
        })
        .catch((error) => {
          console.error('SW registration failed:', error);
        });
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
    };
  }, []);

  // Install PWA
  const installPWA = useCallback(async () => {
    if (!deferredPrompt) return false;

    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
        setStatus(prev => ({ ...prev, canInstall: false, isInstalled: true }));
        return true;
      }
      return false;
    } catch (error) {
      console.error('Install prompt error:', error);
      return false;
    }
  }, [deferredPrompt]);

  // Request notification permission
  const requestNotificationPermission = useCallback(async () => {
    if (!('Notification' in window)) {
      console.log('Notifications not supported');
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      const granted = permission === 'granted';
      
      setStatus(prev => ({ ...prev, hasNotificationPermission: granted }));
      
      if (granted && 'serviceWorker' in navigator) {
        // Subscribe to push notifications
        const registration = await navigator.serviceWorker.ready;
        
        // Get push subscription
        let subscription = await registration.pushManager.getSubscription();
        
        if (!subscription) {
          // Create new subscription (would need VAPID keys from server)
          console.log('No existing push subscription');
        }
        
        return true;
      }
      
      return granted;
    } catch (error) {
      console.error('Notification permission error:', error);
      return false;
    }
  }, []);

  // Show local notification
  const showNotification = useCallback(async (data: PushNotificationData) => {
    if (!('Notification' in window) || Notification.permission !== 'granted') {
      console.log('Notifications not permitted');
      return false;
    }

    try {
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.ready;
        await registration.showNotification(data.title, {
          body: data.body,
          icon: data.icon || '/icons/icon-192x192.png',
          badge: data.badge || '/icons/badge-72x72.png',
          tag: data.tag || 'routine-notification',
          data: data.data,
          actions: [
            { action: 'view', title: 'View Details' },
            { action: 'dismiss', title: 'Dismiss' }
          ]
        } as NotificationOptions);
      } else {
        new Notification(data.title, {
          body: data.body,
          icon: data.icon || '/icons/icon-192x192.png',
        });
      }
      return true;
    } catch (error) {
      console.error('Show notification error:', error);
      return false;
    }
  }, []);

  return {
    ...status,
    installPWA,
    requestNotificationPermission,
    showNotification,
  };
}

// Hook for managing push notifications subscription
export function usePushNotifications() {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);

  // Subscribe to push notifications
  const subscribe = useCallback(async () => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      console.log('Push notifications not supported');
      return null;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      
      // For demo purposes, we'll use a dummy VAPID key
      // In production, this would come from your server
      const vapidPublicKey = 'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U';
      
      const pushSubscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey) as unknown as BufferSource
      });

      setSubscription(pushSubscription);
      setIsSubscribed(true);
      
      // Send subscription to server
      await fetch('/api/notifications/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pushSubscription)
      });

      return pushSubscription;
    } catch (error) {
      console.error('Push subscription error:', error);
      return null;
    }
  }, []);

  // Unsubscribe from push notifications
  const unsubscribe = useCallback(async () => {
    if (!subscription) return false;

    try {
      await subscription.unsubscribe();
      
      // Remove subscription from server
      await fetch('/api/notifications/subscribe', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endpoint: subscription.endpoint })
      });

      setSubscription(null);
      setIsSubscribed(false);
      return true;
    } catch (error) {
      console.error('Unsubscribe error:', error);
      return false;
    }
  }, [subscription]);

  // Check existing subscription on mount
  useEffect(() => {
    async function checkSubscription() {
      if (!('serviceWorker' in navigator)) return;

      try {
        const registration = await navigator.serviceWorker.ready;
        const existingSubscription = await registration.pushManager.getSubscription();
        
        if (existingSubscription) {
          setSubscription(existingSubscription);
          setIsSubscribed(true);
        }
      } catch (error) {
        console.error('Check subscription error:', error);
      }
    }

    checkSubscription();
  }, []);

  return {
    isSubscribed,
    subscription,
    subscribe,
    unsubscribe,
  };
}

// Helper function to convert VAPID key
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
