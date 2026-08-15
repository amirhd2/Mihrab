import React, { useEffect, useState, useRef } from 'react';
import { useLocation, useNavigationType } from 'react-router-dom';

// Track touch & edge swipe gestures to prevent duplicate animation on native swipe back
let lastEdgeSwipeTime = 0;
let isTouchingEdge = false;

if (typeof window !== 'undefined') {
  window.addEventListener(
    'touchstart',
    (e) => {
      if (e.touches && e.touches.length > 0) {
        const x = e.touches[0].clientX;
        // Edge touch: within 50px of either edge
        if (x < 50 || x > window.innerWidth - 50) {
          isTouchingEdge = true;
          lastEdgeSwipeTime = Date.now();
        }
      }
    },
    { passive: true }
  );

  window.addEventListener(
    'touchmove',
    () => {
      if (isTouchingEdge) {
        lastEdgeSwipeTime = Date.now();
      }
    },
    { passive: true }
  );

  window.addEventListener(
    'touchend',
    () => {
      if (isTouchingEdge) {
        lastEdgeSwipeTime = Date.now();
        setTimeout(() => {
          isTouchingEdge = false;
        }, 500);
      }
    },
    { passive: true }
  );

  window.addEventListener('popstate', () => {
    // If popstate occurs within 600ms of edge touch, mark as gesture swipe
    if (Date.now() - lastEdgeSwipeTime < 600) {
      lastEdgeSwipeTime = Date.now();
    }
  });
}

export const PageTransition: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const navType = useNavigationType();
  const prevPathRef = useRef(location.pathname);
  const [animClass, setAnimClass] = useState<string>('');

  useEffect(() => {
    const prevPath = prevPathRef.current;
    const currentPath = location.pathname;
    prevPathRef.current = currentPath;

    // Detect if this transition was caused by a swipe-to-back gesture
    const isSwiped = Date.now() - lastEdgeSwipeTime < 600;

    if (isSwiped) {
      // Suppress animation to prevent duplicate animation on swipe
      setAnimClass('');
      return;
    }

    if (prevPath === currentPath) {
      return;
    }

    // Navigating from Dashboard to one of the 4 sections or Settings (Forward)
    if (prevPath === '/' && currentPath !== '/') {
      setAnimClass('animate-slide-in-right');
    }
    // Navigating from a section or settings back to Dashboard (Back)
    else if (currentPath === '/' && prevPath !== '/') {
      setAnimClass('animate-slide-in-left');
    }
    // General navigation
    else if (navType === 'PUSH') {
      setAnimClass('animate-slide-in-right');
    } else if (navType === 'POP') {
      setAnimClass('animate-slide-in-left');
    } else {
      setAnimClass('');
    }

    // Scroll to top smoothly on navigation
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [location.pathname, navType]);

  return (
    <div key={location.pathname} className={`w-full ${animClass}`}>
      {children}
    </div>
  );
};
