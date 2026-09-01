import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { RefreshCw } from 'lucide-react';

interface PullToRefreshProps {
  children: React.ReactNode;
  onRefresh: () => Promise<void>;
  disabled?: boolean;
}

const THRESHOLD = 70;
const MAX_PULL = 110;

export const PullToRefresh: React.FC<PullToRefreshProps> = ({
  children,
  onRefresh,
  disabled = false,
}) => {
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isPulling, setIsPulling] = useState(false);

  const startYRef = useRef(0);
  const startXRef = useRef(0);
  const currentYRef = useRef(0);
  const isDraggingRef = useRef(false);
  const isHorizontalScrollRef = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleTouchStart = (e: TouchEvent) => {
    if (disabled || isRefreshing) return;

    // Only activate if we are at the top of the page
    const scrollTop = window.scrollY || document.documentElement.scrollTop || 0;
    if (scrollTop > 5) return;

    const touch = e.touches[0];
    startYRef.current = touch.clientY;
    startXRef.current = touch.clientX;
    currentYRef.current = touch.clientY;
    isDraggingRef.current = true;
    isHorizontalScrollRef.current = false;
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (!isDraggingRef.current || isRefreshing || disabled) return;

    const touch = e.touches[0];
    const diffY = touch.clientY - startYRef.current;
    const diffX = touch.clientX - startXRef.current;

    // Check for horizontal dominance (avoid conflict with card swipes)
    if (!isPulling && Math.abs(diffX) > Math.abs(diffY)) {
      isHorizontalScrollRef.current = true;
      isDraggingRef.current = false;
      return;
    }

    if (isHorizontalScrollRef.current) return;

    const scrollTop = window.scrollY || document.documentElement.scrollTop || 0;
    if (scrollTop > 5 && diffY > 0) {
      isDraggingRef.current = false;
      return;
    }

    if (diffY > 0) {
      // Damped pull distance formula like Google Keep / Android
      const damped = Math.min(MAX_PULL, diffY * 0.45);
      setPullDistance(damped);
      setIsPulling(true);

      if (e.cancelable && damped > 10) {
        e.preventDefault();
      }
    } else {
      setPullDistance(0);
      setIsPulling(false);
    }
  };

  const handleTouchEnd = async () => {
    if (!isDraggingRef.current && !isPulling) return;
    isDraggingRef.current = false;
    setIsPulling(false);

    if (pullDistance >= THRESHOLD && !isRefreshing) {
      setIsRefreshing(true);
      setPullDistance(60); // Keep open at resting height while refreshing

      try {
        await onRefresh();
      } catch (err) {
        console.error('Pull to refresh failed:', err);
      } finally {
        // Smooth closing animation
        setTimeout(() => {
          setIsRefreshing(false);
          setPullDistance(0);
        }, 350);
      }
    } else {
      setPullDistance(0);
    }
  };

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const options = { passive: false };
    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, options);
    window.addEventListener('touchend', handleTouchEnd);
    window.addEventListener('touchcancel', handleTouchEnd);

    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
      window.removeEventListener('touchcancel', handleTouchEnd);
    };
  }, [disabled, isRefreshing, pullDistance]);

  const progress = Math.min(1, pullDistance / THRESHOLD);
  const rotation = progress * 360;

  return (
    <div ref={containerRef} className="relative w-full min-h-full flex-1 flex flex-col">
      {/* Google Keep Floating Refresh Bubble Indicator */}
      <AnimatePresence>
        {(isPulling || isRefreshing) && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5, y: -20 }}
            animate={{
              opacity: isRefreshing ? 1 : Math.max(0.2, progress),
              scale: isRefreshing ? 1 : 0.6 + progress * 0.4,
              y: isRefreshing ? 24 : Math.min(48, pullDistance * 0.7),
            }}
            exit={{ opacity: 0, scale: 0.4, y: -10 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            className="absolute left-1/2 -translate-x-1/2 z-40 flex items-center justify-center pointer-events-none"
            style={{ top: 0 }}
          >
            <div className="w-10 h-10 rounded-full bg-surface-card dark:bg-[#182234] border border-theme/40 shadow-xl flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <motion.div
                animate={isRefreshing ? { rotate: 360 } : { rotate: rotation }}
                transition={
                  isRefreshing
                    ? { repeat: Infinity, duration: 0.85, ease: 'linear' }
                    : { duration: 0 }
                }
              >
                <RefreshCw className="w-5 h-5" />
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content Body that translates down with pull */}
      <motion.div
        className="flex-1 flex flex-col w-full"
        animate={{
          y: isRefreshing ? 55 : pullDistance,
        }}
        transition={
          isPulling
            ? { duration: 0 }
            : { type: 'spring', stiffness: 380, damping: 30 }
        }
      >
        {children}
      </motion.div>
    </div>
  );
};
