import { useEffect } from 'react';
import api from '../services/api';

const urlBase64ToUint8Array = (base64String) => {
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
};

const PushNotificationManager = ({ user }) => {
  useEffect(() => {
    if (!user) return; // Only subscribe if logged in

    const subscribeUser = async () => {
      if ('serviceWorker' in navigator && 'PushManager' in window) {
        try {
          const registration = await navigator.serviceWorker.register('/sw.js');
          
          const permission = await Notification.requestPermission();
          if (permission !== 'granted') return;

          let subscription = await registration.pushManager.getSubscription();
          
          if (!subscription) {
            const publicVapidKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
            subscription = await registration.pushManager.subscribe({
              userVisibleOnly: true,
              applicationServerKey: urlBase64ToUint8Array(publicVapidKey)
            });
          }

          // Gửi subscription lên server
          await api.post('/notifications/subscribe', subscription);
          console.log('Push notification subscribed!');
        } catch (error) {
          console.error('Lỗi khi đăng ký Push Notification:', error);
        }
      }
    };

    subscribeUser();
  }, [user]);

  return null; // This component doesn't render anything
};

export default PushNotificationManager;
