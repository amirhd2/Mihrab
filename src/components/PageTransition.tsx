import React, { createContext, useContext, useRef, useEffect, useState, useCallback } from 'react';
import { useNavigate, useLocation, Location } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';

// Swipe detection logic to prevent duplicate animation on native/gesture swipe back
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

  window.addEventListener('touchmove', () => {
    if (isTouchingEdge) lastEdgeSwipeTime = Date.now();
  }, { passive: true });

  window.addEventListener('touchend', () => {
    if (isTouchingEdge) {
      lastEdgeSwipeTime = Date.now();
      setTimeout(() => { isTouchingEdge = false; }, 500);
    }
  }, { passive: true });

  window.addEventListener('popstate', () => {
    if (Date.now() - lastEdgeSwipeTime < 600) lastEdgeSwipeTime = Date.now();
  });
}

export type Direction = 'forward' | 'back' | 'none';

interface NavigationContextType {
  navigateTo: (to: string | number, options?: { isBack?: boolean }) => void;
  direction: Direction;
}

export const NavigationContext = createContext<NavigationContextType>({
  navigateTo: () => {},
  direction: 'forward',
});

export const useAppNavigate = () => {
  const ctx = useContext(NavigationContext);
  const routerNavigate = useNavigate();
  return ctx?.navigateTo || routerNavigate;
};

// Smooth, native-feeling transition variables
const pageVariants = {
  initial: (direction: Direction) => ({
    x: direction === 'forward' ? 30 : direction === 'back' ? -30 : 0,
    opacity: 0,
    scale: 0.98,
  }),
  animate: {
    x: 0,
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.35,
      ease: [0.22, 1, 0.36, 1], // smooth deceleration
    },
  },
  exit: (direction: Direction) => ({
    x: direction === 'forward' ? -30 : direction === 'back' ? 30 : 0,
    opacity: 0,
    scale: 0.98,
    transition: {
      duration: 0.25,
      ease: [0.22, 1, 0.36, 1],
    },
  }),
};

export const PageTransition: React.FC<{
  children: React.ReactNode;
  location: Location;
}> = ({ children, location }) => {
  const routerNavigate = useNavigate();
  const prevPathRef = useRef(location.pathname);
  const [direction, setDirection] = useState<Direction>('none');
  const explicitDirectionRef = useRef<Direction | null>(null);

  const determineDirection = useCallback((fromPath: string, toPath: string): Direction => {
    if (explicitDirectionRef.current) {
      const d = explicitDirectionRef.current;
      explicitDirectionRef.current = null;
      return d;
    }
    if (toPath === '/' && fromPath !== '/') return 'back';
    if (fromPath === '/' && toPath !== '/') return 'forward';
    return 'forward';
  }, []);

  const navigateTo = useCallback(
    (to: string | number, options?: { isBack?: boolean }) => {
      const currentPath = location.pathname;
      if (typeof to === 'string' && to === currentPath) return;

      const isBack = options?.isBack !== undefined ? options.isBack : (typeof to === 'number' ? to < 0 : to === '/');
      const dir: Direction = isBack ? 'back' : 'forward';
      explicitDirectionRef.current = dir;
      setDirection(dir);

      if (typeof to === 'number') {
        routerNavigate(to);
      } else {
        routerNavigate(to);
      }
    },
    [location.pathname, routerNavigate]
  );

  useEffect(() => {
    const prevPath = prevPathRef.current;
    const currentPath = location.pathname;

    if (prevPath !== currentPath) {
      const dir = determineDirection(prevPath, currentPath);
      setDirection(dir);
      prevPathRef.current = currentPath;
      window.scrollTo(0, 0);
    }
  }, [location.pathname, determineDirection]);

  const isSwiped = Date.now() - lastEdgeSwipeTime < 600;
  // If swiped back via native gesture, disable animation
  const currentDirection = isSwiped ? 'none' : direction;

  return (
    <NavigationContext.Provider value={{ navigateTo, direction }}>
      <AnimatePresence mode="wait" initial={false} custom={currentDirection}>
        <motion.div
          key={location.pathname}
          custom={currentDirection}
          variants={pageVariants}
          initial={currentDirection === 'none' ? false : "initial"}
          animate="animate"
          exit={currentDirection === 'none' ? false : "exit"}
          className="w-full will-change-transform"
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </NavigationContext.Provider>
  );
};
