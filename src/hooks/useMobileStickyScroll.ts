import { useState, useEffect, useRef } from 'react';

export function useMobileStickyScroll() {
  const [isVisible, setIsVisible] = useState(true);
  const lastScrollYRef = useRef(0);
  const tickingRef = useRef(false);

  useEffect(() => {
    lastScrollYRef.current =
      window.scrollY ||
      document.documentElement.scrollTop ||
      document.body.scrollTop ||
      0;

    const handleScroll = () => {
      if (tickingRef.current) return;

      tickingRef.current = true;
      requestAnimationFrame(() => {
        tickingRef.current = false;

        // On larger screens, always show
        if (window.innerWidth >= 768) {
          setIsVisible(true);
          return;
        }

        const currentScrollY =
          window.scrollY ||
          document.documentElement.scrollTop ||
          document.body.scrollTop ||
          0;

        // Near top of page, always show header/sticky items
        if (currentScrollY <= 50) {
          setIsVisible(true);
          lastScrollYRef.current = currentScrollY;
          return;
        }

        const diff = currentScrollY - lastScrollYRef.current;

        // Require a noticeable scroll change (at least 8px) to prevent micro-jitter
        if (diff > 8) {
          // Scrolling down -> Show floating button / hide top bar
          setIsVisible(true);
          lastScrollYRef.current = currentScrollY;
        } else if (diff < -8) {
          // Scrolling up -> Hide floating button / show top bar
          setIsVisible(false);
          lastScrollYRef.current = currentScrollY;
        }
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
    };
  }, []);

  return isVisible;
}


