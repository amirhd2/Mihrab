import { useState, useEffect, useCallback } from 'react';

export function useMobileStickyScroll() {
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  const handleScroll = useCallback(() => {
    // Only apply on mobile (window width < 768px for standard md breakpoint)
    if (window.innerWidth >= 768) {
      setIsVisible(true);
      return;
    }

    const currentScrollY =
      window.scrollY ||
      document.documentElement.scrollTop ||
      document.body.scrollTop ||
      0;

    // Small buffer to avoid micro-jitter
    if (Math.abs(currentScrollY - lastScrollY) < 3) {
      return;
    }

    // Scroll up the page (currentScrollY < lastScrollY) -> HIDE
    // Scroll down the page (currentScrollY > lastScrollY) -> SHOW
    if (currentScrollY > lastScrollY) {
      // Scrolling down -> show
      setIsVisible(true);
    } else if (currentScrollY < lastScrollY) {
      // Scrolling up -> hide
      setIsVisible(false);
    }

    // Check if at the absolute bottom of the page -> always show
    const scrollHeight = Math.max(
      document.documentElement.scrollHeight,
      document.body.scrollHeight,
      document.body.offsetHeight
    );
    if (window.innerHeight + currentScrollY >= scrollHeight - 50) {
      setIsVisible(true);
    }

    setLastScrollY(currentScrollY);
  }, [lastScrollY]);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
    };
  }, [handleScroll]);

  return isVisible;
}

