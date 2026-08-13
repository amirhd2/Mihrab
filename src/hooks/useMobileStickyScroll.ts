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

    const currentScrollY = window.scrollY;
    
    // When near the top, always show
    if (currentScrollY < 50) {
      setIsVisible(true);
      setLastScrollY(currentScrollY);
      return;
    }

    // Scroll down the page (current > last) -> HIDE
    // Scroll up the page (current < last) -> SHOW
    if (currentScrollY > lastScrollY + 2) {
      // Scrolling down
      setIsVisible(false);
    } else if (currentScrollY < lastScrollY - 2) {
      // Scrolling up
      setIsVisible(true);
    }

    // Check if at the absolute bottom of the page
    if (window.innerHeight + currentScrollY >= document.body.offsetHeight - 50) {
      setIsVisible(true);
    }

    setLastScrollY(currentScrollY);
  }, [lastScrollY]);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll, { passive: true });
    
    // Initial check
    handleScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
    };
  }, [handleScroll]);

  return isVisible;
}
