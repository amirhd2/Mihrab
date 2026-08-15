import { useEffect } from 'react';

export const usePreventBodyScroll = (shouldPrevent: boolean) => {
  useEffect(() => {
    if (shouldPrevent) {
      const originalBodyOverflow = document.body.style.overflow;
      const originalHtmlOverflow = document.documentElement.style.overflow;
      
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';

      return () => {
        document.body.style.overflow = originalBodyOverflow;
        document.documentElement.style.overflow = originalHtmlOverflow;
      };
    }
  }, [shouldPrevent]);
};
