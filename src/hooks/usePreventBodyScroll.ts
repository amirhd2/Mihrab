import { useEffect } from 'react';

export const usePreventBodyScroll = (shouldPrevent: boolean) => {
  useEffect(() => {
    if (shouldPrevent) {
      const originalStyle = window.getComputedStyle(document.body).overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalStyle;
      };
    }
  }, [shouldPrevent]);
};
