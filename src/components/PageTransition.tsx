import React, { createContext, useContext, useRef, useState, useCallback } from 'react';
import { useNavigate, useLocation, Location } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';

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

// Faster, snappier native-feeling transition variables
const pageVariants = {
  initial: (direction: Direction) => {
    if (direction === 'none') return { x: 0, opacity: 1, scale: 1 };
    return {
      x: direction === 'forward' ? 25 : direction === 'back' ? -25 : 0,
      opacity: 0,
      scale: 0.99,
    };
  },
  animate: (direction: Direction) => {
    if (direction === 'none') {
      return {
        x: 0,
        opacity: 1,
        scale: 1,
        transition: { duration: 0 },
      };
    }
    return {
      x: 0,
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.25,
        ease: [0.22, 1, 0.36, 1], // smooth deceleration
      },
    };
  },
  exit: (direction: Direction) => {
    if (direction === 'none') {
      return {
        x: 0,
        opacity: 1,
        scale: 1,
        transition: { duration: 0 },
      };
    }
    return {
      x: direction === 'forward' ? -20 : direction === 'back' ? 20 : 0,
      opacity: 0,
      scale: 0.99,
      transition: {
        duration: 0.15, // fast exit so mode="wait" doesn't feel like lag
        ease: [0.22, 1, 0.36, 1],
      },
    };
  },
};

export const PageTransition: React.FC<{
  children: React.ReactNode;
  location: Location;
}> = ({ children, location }) => {
  const routerNavigate = useNavigate();
  const [directionState, setDirectionState] = useState<Direction>('forward');
  const prevPathRef = useRef(location.pathname);
  const explicitDirectionRef = useRef<Direction | null>(null);

  // Synchronously calculate direction during render to prevent 1-frame lag/mismatches
  let currentDirection = directionState;
  
  if (prevPathRef.current !== location.pathname) {
    const fromPath = prevPathRef.current;
    const toPath = location.pathname;
    
    if (explicitDirectionRef.current) {
      currentDirection = explicitDirectionRef.current;
      explicitDirectionRef.current = null;
    } else {
      // If navigation happens without explicit UI interaction (e.g. native swipe-to-back, browser back button)
      // we disable our JS animation to avoid conflicting with the browser's native snapshot animation
      currentDirection = 'none';
    }
    
    setDirectionState(currentDirection);
    prevPathRef.current = toPath;
    
    // Quick scroll restore
    if (typeof window !== 'undefined') {
      window.scrollTo(0, 0);
    }
  }

  const navigateTo = useCallback(
    (to: string | number, options?: { isBack?: boolean }) => {
      const currentPath = location.pathname;
      if (typeof to === 'string' && to === currentPath) return;

      const isBack = options?.isBack !== undefined ? options.isBack : (typeof to === 'number' ? to < 0 : to === '/');
      const dir: Direction = isBack ? 'back' : 'forward';
      explicitDirectionRef.current = dir;

      if (typeof to === 'number') {
        routerNavigate(to);
      } else {
        routerNavigate(to);
      }
    },
    [location.pathname, routerNavigate]
  );

  return (
    <NavigationContext.Provider value={{ navigateTo, direction: currentDirection }}>
      <AnimatePresence mode="wait" custom={currentDirection}>
        <motion.div
          key={location.pathname}
          custom={currentDirection}
          variants={pageVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          className="w-full will-change-transform"
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </NavigationContext.Provider>
  );
};
