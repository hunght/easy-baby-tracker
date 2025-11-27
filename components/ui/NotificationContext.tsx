import React, { createContext, useContext, useState } from 'react';

import { NotificationBar } from './NotificationBar';

type NotificationType = 'success' | 'error' | 'info';

type NotificationState = {
  visible: boolean;
  message: string;
  type: NotificationType;
};

type NotificationContextType = {
  showNotification: (message: string, type?: NotificationType) => void;
};

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notification, setNotification] = useState<NotificationState>({
    visible: false,
    message: '',
    type: 'info',
  });

  const showNotification = (message: string, type: NotificationType = 'info') => {
    setNotification({
      visible: true,
      message,
      type,
    });
  };

  const hideNotification = () => {
    setNotification((prev) => ({ ...prev, visible: false }));
  };

  return (
    <NotificationContext.Provider value={{ showNotification }}>
      {children}
      <NotificationBar
        visible={notification.visible}
        message={notification.message}
        type={notification.type}
        onDismiss={hideNotification}
      />
    </NotificationContext.Provider>
  );
}

export function useNotification() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
}

