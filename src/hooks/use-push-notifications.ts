"use client";

import { useState, useEffect, useCallback, useRef } from "react";

interface PushNotificationOptions {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: Record<string, unknown>;
  requireInteraction?: boolean;
  silent?: boolean;
}

interface PushNotificationState {
  isSupported: boolean;
  isSubscribed: boolean;
  permission: NotificationPermission;
  subscription: PushSubscription | null;
  isLoading: boolean;
  error: string | null;
}

interface UsePushNotificationsReturn extends PushNotificationState {
  requestPermission: () => Promise<boolean>;
  subscribe: () => Promise<void>;
  unsubscribe: () => Promise<void>;
  sendNotification: (options: PushNotificationOptions) => Promise<void>;
  playSound: () => Promise<void>;
  clearBadge: () => Promise<void>;
}

// Storage keys
const SOUND_ENABLED_KEY = "smartRoutineHub_soundEnabled";
const NOTIFICATION_ENABLED_KEY = "smartRoutineHub_notificationsEnabled";

export function usePushNotifications(): UsePushNotificationsReturn {
  const [state, setState] = useState<PushNotificationState>({
    isSupported: false,
    isSubscribed: false,
    permission: "default",
    subscription: null,
    isLoading: true,
    error: null,
  });

  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Initialize audio for notification sound
  useEffect(() => {
    if (typeof window !== "undefined") {
      audioRef.current = new Audio("/notification.mp3");
      audioRef.current.volume = 0.7;
    }

    return () => {
      if (audioRef.current) {
        audioRef.current = null;
      }
    };
  }, []);

  // Check support and initial state
  useEffect(() => {
    const checkSupport = async () => {
      try {
        const isSupported = 
          typeof window !== "undefined" &&
          "serviceWorker" in navigator &&
          "PushManager" in window &&
          "Notification" in window;

        if (!isSupported) {
          setState((prev) => ({
            ...prev,
            isSupported: false,
            isLoading: false,
          }));
          return;
        }

        const permission = Notification.permission;
        
        // Check for existing subscription
        const registration = await navigator.serviceWorker.ready;
        const existingSubscription = await registration.pushManager.getSubscription();

        setState((prev) => ({
          ...prev,
          isSupported: true,
          permission,
          isSubscribed: !!existingSubscription,
          subscription: existingSubscription,
          isLoading: false,
        }));
      } catch (error) {
        console.error("Error checking push notification support:", error);
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: "Failed to check notification support",
        }));
      }
    };

    checkSupport();
  }, []);

  // Request notification permission
  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!state.isSupported) return false;

    try {
      const permission = await Notification.requestPermission();
      setState((prev) => ({ ...prev, permission }));
      return permission === "granted";
    } catch (error) {
      console.error("Error requesting permission:", error);
      return false;
    }
  }, [state.isSupported]);

  // Subscribe to push notifications
  const subscribe = useCallback(async () => {
    if (!state.isSupported) return;

    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      // Request permission first
      const granted = await requestPermission();
      if (!granted) {
        throw new Error("Notification permission denied");
      }

      // Get service worker registration
      const registration = await navigator.serviceWorker.ready;

      // Check for VAPID key (you'll need to generate this)
      const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

      // Subscribe
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: vapidPublicKey
          ? urlBase64ToUint8Array(vapidPublicKey)
          : undefined,
      });

      // Send subscription to server
      await fetch("/api/notifications/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(subscription),
      });

      // Store preference
      localStorage.setItem(NOTIFICATION_ENABLED_KEY, "true");

      setState((prev) => ({
        ...prev,
        isSubscribed: true,
        subscription,
        isLoading: false,
      }));
    } catch (error) {
      console.error("Error subscribing:", error);
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: "Failed to subscribe to notifications",
      }));
    }
  }, [state.isSupported, requestPermission]);

  // Unsubscribe from push notifications
  const unsubscribe = useCallback(async () => {
    if (!state.subscription) return;

    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      // Unsubscribe from push manager
      await state.subscription.unsubscribe();

      // Notify server
      await fetch("/api/notifications/subscribe", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ endpoint: state.subscription.endpoint }),
      });

      // Clear preference
      localStorage.setItem(NOTIFICATION_ENABLED_KEY, "false");

      setState((prev) => ({
        ...prev,
        isSubscribed: false,
        subscription: null,
        isLoading: false,
      }));
    } catch (error) {
      console.error("Error unsubscribing:", error);
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: "Failed to unsubscribe",
      }));
    }
  }, [state.subscription]);

  // Send a notification (for testing or local use)
  const sendNotification = useCallback(async (options: PushNotificationOptions) => {
    if (state.permission !== "granted") {
      const granted = await requestPermission();
      if (!granted) return;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      
      await registration.showNotification(options.title, {
        body: options.body,
        icon: options.icon || "/icons/icon-192x192.png",
        badge: options.badge || "/icons/badge-72x72.png",
        tag: options.tag || "routine-notification",
        requireInteraction: options.requireInteraction || false,
        silent: options.silent || false,
        data: options.data || {},
        vibrate: [100, 50, 100],
      });

      // Play sound if enabled
      const soundEnabled = localStorage.getItem(SOUND_ENABLED_KEY) !== "false";
      if (soundEnabled) {
        await playSound();
      }
    } catch (error) {
      console.error("Error showing notification:", error);
    }
  }, [state.permission, requestPermission]);

  // Play notification sound
  const playSound = useCallback(async () => {
    try {
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        await audioRef.current.play();
      }
    } catch (error) {
      console.error("Error playing sound:", error);
    }
  }, []);

  // Clear app badge
  const clearBadge = useCallback(async () => {
    try {
      if ("clearAppBadge" in navigator) {
        await (navigator as Navigator & { clearAppBadge: () => Promise<void> }).clearAppBadge();
      }

      // Also notify service worker
      const registration = await navigator.serviceWorker.ready;
      if (registration.active) {
        registration.active.postMessage({ type: "CLEAR_BADGE" });
      }
    } catch (error) {
      console.error("Error clearing badge:", error);
    }
  }, []);

  return {
    ...state,
    requestPermission,
    subscribe,
    unsubscribe,
    sendNotification,
    playSound,
    clearBadge,
  };
}

// Helper function to convert VAPID key
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

// Hook for managing notification sound preference
export function useNotificationSound() {
  // Initialize from localStorage on first render
  const getInitialSoundState = (): boolean => {
    if (typeof window === "undefined") return true;
    const stored = localStorage.getItem(SOUND_ENABLED_KEY);
    return stored !== "false";
  };

  const [soundEnabled, setSoundEnabled] = useState(getInitialSoundState);

  const toggleSound = useCallback(() => {
    setSoundEnabled((prev) => {
      const newValue = !prev;
      localStorage.setItem(SOUND_ENABLED_KEY, String(newValue));
      return newValue;
    });
  }, []);

  return { soundEnabled, toggleSound };
}

// Hook for system notification badge
export function useNotificationBadge() {
  const setBadge = useCallback(async (count: number) => {
    try {
      if ("setAppBadge" in navigator) {
        await (navigator as Navigator & { setAppBadge: (count: number) => Promise<void> }).setAppBadge(count);
      }
    } catch (error) {
      console.error("Error setting badge:", error);
    }
  }, []);

  const clearBadge = useCallback(async () => {
    try {
      if ("clearAppBadge" in navigator) {
        await (navigator as Navigator & { clearAppBadge: () => Promise<void> }).clearAppBadge();
      }
    } catch (error) {
      console.error("Error clearing badge:", error);
    }
  }, []);

  return { setBadge, clearBadge };
}

export default usePushNotifications;
