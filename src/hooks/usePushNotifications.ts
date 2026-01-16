import { useState, useEffect, useCallback } from 'react';

interface NotificationState {
  permission: NotificationPermission | 'unsupported';
  supported: boolean;
}

export function usePushNotifications() {
  const [state, setState] = useState<NotificationState>({
    permission: 'unsupported',
    supported: false
  });

  useEffect(() => {
    if ('Notification' in window) {
      setState({
        permission: Notification.permission,
        supported: true
      });
    }
  }, []);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!('Notification' in window)) {
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      setState({ permission, supported: true });
      return permission === 'granted';
    } catch {
      return false;
    }
  }, []);

  const showNotification = useCallback((title: string, options?: NotificationOptions) => {
    if (state.permission === 'granted') {
      new Notification(title, {
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        ...options
      });
    }
  }, [state.permission]);

  return { ...state, requestPermission, showNotification };
}

// Order status display mapping
export const ORDER_STATUS_MESSAGES: Record<string, { title: string; body: string }> = {
  confirmed: {
    title: '🎉 Order Confirmed!',
    body: 'Your order has been confirmed and the restaurant is preparing it.'
  },
  preparing: {
    title: '👨‍🍳 Preparing Your Food',
    body: 'The kitchen is now preparing your delicious meal.'
  },
  ready: {
    title: '✅ Order Ready!',
    body: 'Your order is ready and waiting for pickup/delivery.'
  },
  out_for_delivery: {
    title: '🚗 On The Way!',
    body: 'Your order is out for delivery. Track it live on the map!'
  },
  delivered: {
    title: '🎊 Delivered!',
    body: 'Your order has been delivered. Enjoy your meal!'
  },
  cancelled: {
    title: '❌ Order Cancelled',
    body: 'Your order has been cancelled. Contact support for help.'
  }
};
