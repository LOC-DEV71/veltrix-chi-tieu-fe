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
    if (!user) return;

    const subscribeUser = async () => {
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        console.log('[Push] Trình duyệt không hỗ trợ Push Notification');
        return;
      }

      try {
        // Register service worker
        const registration = await navigator.serviceWorker.register('/sw.js');
        await navigator.serviceWorker.ready;

        // Ask permission
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') {
          console.log('[Push] Người dùng từ chối quyền thông báo');
          return;
        }

        const publicVapidKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
        if (!publicVapidKey) {
          console.warn('[Push] VITE_VAPID_PUBLIC_KEY chưa được cấu hình');
          return;
        }

        // Xóa subscription cũ (nếu có) để tạo mới - tránh lỗi key không khớp
        const existingSub = await registration.pushManager.getSubscription();
        if (existingSub) {
          // Kiểm tra xem key có khớp không
          const existingKey = existingSub.options?.applicationServerKey;
          const newKey = urlBase64ToUint8Array(publicVapidKey);
          
          // So sánh key - nếu khác thì unsubscribe rồi đăng ký lại
          let keyMatches = false;
          if (existingKey) {
            const existingKeyArr = new Uint8Array(existingKey);
            keyMatches = existingKeyArr.length === newKey.length &&
              existingKeyArr.every((v, i) => v === newKey[i]);
          }
          
          if (!keyMatches) {
            console.log('[Push] Key thay đổi, đăng ký lại subscription...');
            await existingSub.unsubscribe();
          } else {
            // Key giống, chỉ cần gửi lại subscription lên server
            await api.post('/notifications/subscribe', existingSub.toJSON());
            console.log('[Push] Đã cập nhật subscription lên server');
            return;
          }
        }

        // Tạo subscription mới
        const newSubscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicVapidKey),
        });

        // Gửi lên server
        await api.post('/notifications/subscribe', newSubscription.toJSON());
        console.log('[Push] Đăng ký push notification thành công!');
      } catch (error) {
        console.error('[Push] Lỗi khi đăng ký Push Notification:', error);
      }
    };

    subscribeUser();
  }, [user]);

  return null;
};

export default PushNotificationManager;
