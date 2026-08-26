import React, { useRef, useEffect, useState } from 'react';
import { Trash2 } from 'lucide-react';

interface SwipeToDeleteItemProps {
  id: string | number;
  onDelete: () => void;
  children: React.ReactNode;
  className?: string;
  cardClassName?: string;
}

const CARD_BTN_GAP = 12; // Gap between card and delete button edge
const BTN_BASE_SIZE = 52; // Initial circular size
const BTN_OPEN_WIDTH = 76; // Expanded width when open
const FULL_SWIPE_RATIO = 0.55; // 55% width threshold for auto-delete (iOS standard feel)

// Global store for active swipe close function
let globalActiveSwipeCloseFn: (() => void) | null = null;

export const SwipeToDeleteItem: React.FC<SwipeToDeleteItemProps> = ({
  id,
  onDelete,
  children,
  className = '',
  cardClassName = '',
}) => {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const deleteBtnRef = useRef<HTMLButtonElement>(null);
  const deleteIconRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const wrapper = wrapperRef.current;
    const card = cardRef.current;
    const deleteBtn = deleteBtnRef.current;
    const deleteIcon = deleteIconRef.current;

    if (!wrapper || !card || !deleteBtn || !deleteIcon) return;

    // Clean inline animation styles on mount/remount
    wrapper.style.height = '';
    wrapper.style.margin = '';
    wrapper.style.opacity = '';
    wrapper.style.touchAction = 'pan-y';
    wrapper.classList.remove('wrapper-animating');
    card.style.transform = '';
    card.style.transition = '';
    card.style.touchAction = '';
    card.classList.remove('card-animating', 'shadow-lg', 'shadow-md');
    deleteBtn.style.opacity = '0';
    deleteBtn.style.transition = '';
    deleteBtn.style.transform = 'scale(0.5)';
    deleteBtn.style.width = `${BTN_BASE_SIZE}px`;
    deleteIcon.style.transition = '';

    let startX = 0;
    let startY = 0;
    let startTime = 0;
    let initialTranslateX = 0;
    let currentTranslateX = 0;
    let isDragging = false;
    let isSlopPassed = false;
    let isVerticalScrolling = false;
    let isOpen = false;
    let wrapperWidth = 0;

    const getX = (e: TouchEvent | MouseEvent): number => {
      if ('touches' in e && e.touches.length > 0) {
        return e.touches[0].clientX;
      }
      if ('changedTouches' in e && e.changedTouches.length > 0) {
        return e.changedTouches[0].clientX;
      }
      return (e as MouseEvent).clientX;
    };

    const getY = (e: TouchEvent | MouseEvent): number => {
      if ('touches' in e && e.touches.length > 0) {
        return e.touches[0].clientY;
      }
      if ('changedTouches' in e && e.changedTouches.length > 0) {
        return e.changedTouches[0].clientY;
      }
      return (e as MouseEvent).clientY;
    };

    const updateUI = (translateX: number) => {
      const absX = Math.abs(translateX);

      // 1. Main card transform
      card.style.transform = `translate3d(${translateX}px, 0, 0)`;

      // 2. Hide button if position is zero
      if (absX <= 0) {
        deleteBtn.style.opacity = '0';
        deleteBtn.style.transform = 'scale(0.5)';
        return;
      }

      // 3. Fade & Scale In
      const appearThreshold = BTN_BASE_SIZE;
      const appearProgress = Math.min(1, Math.max(0, absX / appearThreshold));

      deleteBtn.style.opacity = `${appearProgress}`;
      const btnScale = 0.5 + appearProgress * 0.5;
      deleteBtn.style.transform = `scale(${btnScale})`;

      // 4. Calculate morphing button width
      const targetBtnWidth = Math.max(BTN_BASE_SIZE, absX - CARD_BTN_GAP);
      deleteBtn.style.width = `${targetBtnWidth}px`;

      // 5. Border radius morphing (50% circle -> 16px rounded box)
      const morphProgress = Math.min(
        1,
        Math.max(0, (targetBtnWidth - BTN_BASE_SIZE) / (BTN_OPEN_WIDTH - BTN_BASE_SIZE))
      );
      const currentRadiusPx = 26 - morphProgress * 10;
      deleteBtn.style.borderRadius = `${currentRadiusPx}px`;

      // 6. Icon centering offset
      const iconOffsetPx = -((targetBtnWidth - BTN_BASE_SIZE) / 2);
      deleteIcon.style.transform = `translate3d(${iconOffsetPx}px, 0, 0)`;
    };

    const openSwipe = () => {
      isOpen = true;
      globalActiveSwipeCloseFn = closeSwipe;

      currentTranslateX = -(BTN_OPEN_WIDTH + CARD_BTN_GAP);
      card.style.transition = '';
      deleteBtn.style.transition = '';
      deleteIcon.style.transition = '';
      card.classList.add('card-animating', 'rounded-2xl', 'shadow-md');
      deleteBtn.classList.add('btn-animating');
      deleteIcon.classList.add('icon-animating');

      updateUI(currentTranslateX);
    };

    const closeSwipe = () => {
      isOpen = false;
      if (globalActiveSwipeCloseFn === closeSwipe) {
        globalActiveSwipeCloseFn = null;
      }

      currentTranslateX = 0;
      card.style.transition = '';
      deleteBtn.style.transition = '';
      deleteIcon.style.transition = '';
      card.classList.add('card-animating');
      deleteBtn.classList.add('btn-animating');
      deleteIcon.classList.add('icon-animating');

      updateUI(0);

      setTimeout(() => {
        if (!isOpen && !isDragging) {
          card.classList.remove('shadow-lg', 'shadow-md');
        }
      }, 350);
    };

    const triggerFullDelete = () => {
      onDelete();
      closeSwipe();
    };

    const onTouchStart = (e: TouchEvent | MouseEvent) => {
      if (globalActiveSwipeCloseFn && globalActiveSwipeCloseFn !== closeSwipe) {
        globalActiveSwipeCloseFn();
      }

      isDragging = true;
      isSlopPassed = false;
      isVerticalScrolling = false;
      startX = getX(e);
      startY = getY(e);
      startTime = Date.now();
      wrapperWidth = wrapper.offsetWidth || 350;
      initialTranslateX = isOpen ? -(BTN_OPEN_WIDTH + CARD_BTN_GAP) : 0;

      card.style.transition = 'none';
      deleteBtn.style.transition = 'none';
      deleteIcon.style.transition = 'none';

      card.classList.remove('card-animating');
      deleteBtn.classList.remove('btn-animating');
      deleteIcon.classList.remove('icon-animating');

      window.addEventListener('touchmove', onTouchMove, { passive: false });
      window.addEventListener('touchend', onTouchEnd);
      window.addEventListener('touchcancel', onTouchCancel);
      window.addEventListener('mousemove', onTouchMove);
      window.addEventListener('mouseup', onTouchEnd);
    };

    const onTouchMove = (e: TouchEvent | MouseEvent) => {
      if (!isDragging) return;
      if (isVerticalScrolling) return;

      const x = getX(e);
      const y = getY(e);
      const diffX = startX - x; // Swiping left = positive delta
      const absDeltaX = Math.abs(diffX);
      const absDeltaY = Math.abs(startY - y);

      if (!isSlopPassed) {
        // If card is already open, any small horizontal gesture activates drag immediately
        if (isOpen && absDeltaX > 3) {
          isSlopPassed = true;
          startX = x;
          startY = y;
          card.classList.add('rounded-2xl', 'shadow-lg');
          wrapper.style.touchAction = 'none';
          card.style.touchAction = 'none';
        } else if (absDeltaX < 5 && absDeltaY < 5) {
          // Microscopic jitter zone (under 5px) - wait for clearer intent
          return;
        } else if (absDeltaX >= 5 && absDeltaX >= absDeltaY * 0.6) {
          // Horizontal swipe intent detected (supports natural diagonal thumb arcs up to ~60 degrees)
          isSlopPassed = true;
          startX = x;
          startY = y;
          card.classList.add('rounded-2xl', 'shadow-lg');
          wrapper.style.touchAction = 'none';
          card.style.touchAction = 'none';
        } else if (absDeltaY > 10 && absDeltaY > absDeltaX * 1.6) {
          // Unambiguous vertical page scroll intent
          isVerticalScrolling = true;
          isDragging = false;
          return;
        } else {
          // Transition zone: hold and sample next frame
          return;
        }
      }

      // Once horizontal swipe is active, prevent all vertical scroll interference
      if (e.cancelable) {
        e.preventDefault();
      }

      const deltaX = startX - x;
      let calculatedX = initialTranslateX - deltaX;

      // Elastic resistance when pulling right beyond 0
      if (calculatedX > 0) {
        calculatedX = calculatedX * 0.18;
      }

      currentTranslateX = calculatedX;
      updateUI(currentTranslateX);
    };

    const onTouchCancel = (e: TouchEvent | MouseEvent) => {
      if (!isDragging) return;
      // If user has already swiped past threshold when cancelled by system, finish deletion
      const absTranslate = Math.abs(currentTranslateX);
      const ratio = absTranslate / Math.max(1, wrapperWidth);
      if (ratio >= FULL_SWIPE_RATIO) {
        onTouchEnd(e);
        return;
      }
      onTouchEnd(e);
    };

    const onTouchEnd = (e?: TouchEvent | MouseEvent) => {
      if (!isDragging) return;
      isDragging = false;

      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
      window.removeEventListener('touchcancel', onTouchCancel);
      window.removeEventListener('mousemove', onTouchMove);
      window.removeEventListener('mouseup', onTouchEnd);

      wrapper.style.touchAction = 'pan-y';
      card.style.touchAction = '';

      card.style.transition = '';
      deleteBtn.style.transition = '';
      deleteIcon.style.transition = '';

      card.classList.add('card-animating');
      deleteBtn.classList.add('btn-animating');
      deleteIcon.classList.add('icon-animating');

      if (!isSlopPassed) {
        if (isOpen) {
          closeSwipe();
        }
        return;
      }

      const absTranslate = Math.abs(currentTranslateX);
      const ratio = absTranslate / Math.max(1, wrapperWidth);
      const elapsed = Date.now() - startTime;
      const movedDist = e ? (startX - getX(e)) : 0;
      const velocity = movedDist / Math.max(1, elapsed); // px / ms

      // Mode 1: Full swipe over 55% width OR quick swipe flick over 35% width
      if (ratio >= FULL_SWIPE_RATIO || (ratio >= 0.35 && velocity > 0.5)) {
        card.style.transform = `translate3d(-${wrapperWidth}px, 0, 0)`;
        deleteBtn.style.width = `${wrapperWidth}px`;
        deleteBtn.style.borderRadius = '16px';
        deleteBtn.style.opacity = '1';
        deleteBtn.style.transform = 'scale(1)';

        const finalIconOffset = -((wrapperWidth - BTN_BASE_SIZE) / 2);
        deleteIcon.style.transform = `translate3d(${finalIconOffset}px, 0, 0)`;

        triggerFullDelete();
      }
      // Mode 2: Swiped past 38px or brisk swipe -> Open button
      else if (absTranslate >= (BTN_OPEN_WIDTH + CARD_BTN_GAP) / 2 || (velocity > 0.35 && movedDist > 25)) {
        openSwipe();
      }
      // Mode 3: Small drag -> Close back
      else {
        closeSwipe();
      }
    };

    const handleBtnClick = (e: MouseEvent) => {
      e.stopPropagation();
      triggerFullDelete();
    };

    const onClick = (e: MouseEvent) => {
      if (isOpen || isSlopPassed) {
        e.stopPropagation();
        e.preventDefault();
      }
    };

    deleteBtn.addEventListener('click', handleBtnClick);
    card.addEventListener('click', onClick, true); // Capture phase
    card.addEventListener('touchstart', onTouchStart as any, { passive: true });
    card.addEventListener('mousedown', onTouchStart as any);

    return () => {
      deleteBtn.removeEventListener('click', handleBtnClick);
      card.removeEventListener('click', onClick, true);
      card.removeEventListener('touchstart', onTouchStart as any);
      card.removeEventListener('mousedown', onTouchStart as any);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
      window.removeEventListener('touchcancel', onTouchCancel);
      window.removeEventListener('mousemove', onTouchMove);
      window.removeEventListener('mouseup', onTouchEnd);
    };
  }, [onDelete]);

  return (
    <div
      ref={wrapperRef}
      className={`relative w-full ios-item-wrapper select-none overflow-hidden rounded-2xl ${className || 'min-h-[58px] my-1'}`}
      style={{ touchAction: 'pan-y' }}
    >
      {/* Red Delete Button Background (Revealed from underneath on swipe) */}
      <div className="absolute inset-0 flex items-center justify-start pointer-events-none p-0 z-0">
        <button
          ref={deleteBtnRef}
          type="button"
          aria-label="حذف"
          className="delete-btn h-[52px] bg-red-600 dark:bg-red-600 text-white flex items-center justify-center pointer-events-auto overflow-hidden opacity-0 relative transition-colors active:bg-red-700"
          style={{
            width: `${BTN_BASE_SIZE}px`,
            borderRadius: '9999px',
            transform: 'scale(0.5)',
          }}
        >
          {/* Trash Icon absolute centered */}
          <Trash2
            ref={deleteIconRef as any}
            className="w-5 h-5 shrink-0 delete-icon absolute stroke-[2]"
            style={{
              left: '50%',
              top: '50%',
              marginLeft: '-10px',
              marginTop: '-10px',
            }}
          />
        </button>
      </div>

      {/* Foreground Content Card (Solid opaque layer strictly on top of delete button) */}
      <div
        ref={cardRef}
        className={`card-content relative z-10 w-full h-full rounded-2xl flex items-center justify-between cursor-grab active:cursor-grabbing shadow-2xs hover:shadow-md transition-colors transition-shadow duration-200 bg-surface-card ${
          cardClassName || 'border border-neutral-200/80 dark:border-neutral-800/80'
        }`}
      >
        <div className="w-full h-full flex flex-col justify-between">{children}</div>
      </div>
    </div>
  );
};
