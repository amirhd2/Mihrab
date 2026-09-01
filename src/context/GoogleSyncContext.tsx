import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { googleSyncService, GoogleSyncState } from '../services/googleSyncService';
import { ToastType } from '../hooks/useToast';

interface GoogleSyncContextType extends GoogleSyncState {
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  syncNow: (options?: { silent?: boolean; forceToast?: boolean }) => Promise<{ success: boolean; message: string }>;
  triggerAutoSync: () => void;
}

const GoogleSyncContext = createContext<GoogleSyncContextType | null>(null);

export interface GoogleSyncProviderProps {
  children: React.ReactNode;
  onShowToast?: (message: string, type?: ToastType) => void;
}

export const GoogleSyncProvider: React.FC<GoogleSyncProviderProps> = ({ children, onShowToast }) => {
  const [syncState, setSyncState] = useState<GoogleSyncState>(googleSyncService.getState());

  useEffect(() => {
    const unsubscribe = googleSyncService.subscribe((state) => {
      setSyncState(state);
    });
    return () => unsubscribe();
  }, []);

  const signIn = useCallback(async () => {
    try {
      await googleSyncService.signIn();
      if (onShowToast) {
        onShowToast('ورود با حساب گوگل و همگام‌سازی اولیه با موفقیت انجام شد.', 'success');
      }
    } catch (err: any) {
      if (onShowToast) {
        onShowToast(err?.message || 'خطا در ورود به حساب گوگل', 'error');
      }
      throw err;
    }
  }, [onShowToast]);

  const signOut = useCallback(async () => {
    try {
      await googleSyncService.signOut();
      if (onShowToast) {
        onShowToast('از حساب گوگل خارج شدید.', 'info');
      }
    } catch (err: any) {
      if (onShowToast) {
        onShowToast('خطا در خروج از حساب گوگل', 'error');
      }
      throw err;
    }
  }, [onShowToast]);

  const syncNow = useCallback(
    async (options: { silent?: boolean; forceToast?: boolean } = {}) => {
      const res = await googleSyncService.sync({ silent: options.silent });
      
      // Always show toast if forceToast is true or not explicitly silent
      if (onShowToast && (options.forceToast || !options.silent)) {
        if (res.success) {
          onShowToast('همگام‌سازی با حساب گوگل با موفقیت انجام شد.', 'success');
        } else {
          onShowToast(res.message, 'warning');
        }
      }
      return res;
    },
    [onShowToast]
  );

  const triggerAutoSync = useCallback(() => {
    googleSyncService.triggerAutoSync();
  }, []);

  return (
    <GoogleSyncContext.Provider
      value={{
        ...syncState,
        signIn,
        signOut,
        syncNow,
        triggerAutoSync,
      }}
    >
      {children}
    </GoogleSyncContext.Provider>
  );
};

export const useGoogleSync = () => {
  const context = useContext(GoogleSyncContext);
  if (!context) {
    throw new Error('useGoogleSync must be used within a GoogleSyncProvider');
  }
  return context;
};
