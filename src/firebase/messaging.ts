import { getMessaging, getToken, onMessage, isSupported } from 'firebase/messaging';
import app, { isFirebaseConfigured, db } from './config';
import { doc, setDoc } from 'firebase/firestore';

const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY || "";

/**
 * Requests Notification permission and registers FCM device token
 */
export async function registerPushNotifications(userId: string): Promise<string | null> {
  try {
    const supported = await isSupported();
    if (!supported) {
      console.log('Firebase Cloud Messaging is not supported in this browser environment');
      return null;
    }

    if (!('Notification' in window)) {
      console.log('Notifications API not supported');
      return null;
    }

    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.log('Notification permission denied by user');
      return null;
    }

    if (!isFirebaseConfigured) {
      // In demo mode, simulate notification permission granted
      new Notification('Udhaar Book Notifications Active', {
        body: 'You will receive reminders for overdue and upcoming loans.',
        icon: '/pwa-192x192.svg'
      });
      return 'demo-push-token-enabled';
    }

    const messaging = getMessaging(app);

    // Register service worker if not already registered
    let swRegistration: ServiceWorkerRegistration | undefined;
    if ('serviceWorker' in navigator) {
      swRegistration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
    }

    const currentToken = await getToken(messaging, {
      vapidKey: VAPID_KEY || undefined,
      serviceWorkerRegistration: swRegistration,
    });

    if (currentToken) {
      // Store token in Firestore under user doc
      await setDoc(doc(db, `users/${userId}/fcmTokens`, currentToken), {
        token: currentToken,
        createdAt: Date.now(),
        platform: navigator.userAgent,
      }, { merge: true });

      return currentToken;
    } else {
      console.log('No registration token available. Request permission to generate one.');
      return null;
    }
  } catch (err) {
    console.error('An error occurred while retrieving push token:', err);
    return null;
  }
}

/**
 * Set up foreground message listener
 */
export async function setupForegroundNotifications(onReceive: (payload: unknown) => void) {
  try {
    const supported = await isSupported();
    if (!supported || !isFirebaseConfigured) return () => {};

    const messaging = getMessaging(app);
    return onMessage(messaging, (payload) => {
      onReceive(payload);
    });
  } catch (e) {
    console.warn('Foreground notification setup failed:', e);
    return () => {};
  }
}
