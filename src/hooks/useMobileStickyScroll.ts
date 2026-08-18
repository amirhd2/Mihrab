import { useState, useEffect, useRef } from 'react';

export function useMobileStickyScroll() {
  const [isVisible, setIsVisible] = useState(true);
  const lastScrollYRef = useRef(0);
  const touchStartYRef = useRef<number | null>(null);

  useEffect(() => {
    // Initialize current scroll position
    lastScrollYRef.current =
      window.scrollY ||
      document.documentElement.scrollTop ||
      document.body.scrollTop ||
      0;

    const handleScroll = () => {
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

      const diff = currentScrollY - lastScrollYRef.current;

      // React to small scroll changes (threshold of 2px)
      if (diff > 2) {
        // Scrolling down the page -> Show
        setIsVisible(true);
      } else if (diff < -2) {
        // Scrolling up the page -> Hide
        setIsVisible(false);
      }

      lastScrollYRef.current = currentScrollY;
    };

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        touchStartYRef.current = e.touches[0].clientY;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (window.innerWidth >= 768 || touchStartYRef.current === null || e.touches.length === 0) {
        return;
      }

      const currentY = e.touches[0].clientY;
      const touchDiff = touchStartYRef.current - currentY; // positive = moving finger UP (scrolling DOWN)

      if (touchDiff > 4) {
        // Finger moving UP -> Page scrolling DOWN -> Show
        setIsVisible(true);
        touchStartYRef.current = currentY;
      } else if (touchDiff < -4) {
        // Finger moving DOWN -> Page scrolling UP -> Hide
        setIsVisible(false);
        touchStartYRef.current = currentY;
      }
    };

    const handleWheel = (e: WheelEvent) => {
      if (window.innerWidth >= 768) {
        setIsVisible(true);
        return;
      }

      if (e.deltaY > 2) {
        // Scrolling down -> Show
        setIsVisible(true);
      } else if (e.deltaY < -2) {
        // Scrolling up -> Hide
        setIsVisible(false);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('wheel', handleWheel, { passive: true });
    window.addEventListener('resize', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('wheel', handleWheel);
      window.removeEventListener('resize', handleScroll);
    };
  }, []);

  return isVisible;
}

