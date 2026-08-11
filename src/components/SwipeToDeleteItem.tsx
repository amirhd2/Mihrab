import React, { useRef, useEffect, useState } from 'react';
import { Trash2 } from 'lucide-react';

interface SwipeToDeleteItemProps {
  id: string | number;
  onDelete: () => void;
  children: React.ReactNode;
}

const CARD_BTN_GAP = 12; // Gap between card and delete button edge
const BTN_BASE_SIZE = 52; // Initial circular size
const BTN_OPEN_WIDTH = 76; // Expanded width when open
const FULL_SWIPE_RATIO = 0.70; // 70% width threshold for auto-delete
const SLOP_THRESHOLD = 4; // Threshold to start drag

// Global store for active swipe close function
let globalActiveSwipeCloseFn: (() => void) | null = null;

export const SwipeToDeleteItem: React.FC<SwipeToDeleteItemProps> = ({
  id,
  onDelete,
  children,
}) => {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const deleteBtnRef = useRef<HTMLButtonElement>(null);
  const deleteIconRef = useRef<SVGSVGElement>(null);

  const [showConfirmModal, setShowConfirmModal] = useState(false);

  useEffect(() => {
    const wrapper = wrapperRef.current;
    const card = cardRef.current;
    const deleteBtn = deleteBtnRef.current;
    const deleteIcon = deleteIconRef.current;

    if (!wrapper || !card || !deleteBtn || !deleteIcon) return;

    let startX = 0;
    let initialTranslateX = 0;
    let currentTranslateX = 0;
    let isDragging = false;
    let isSlopPassed = false;
    let isOpen = false;
    let wrapperWidth = 0;

    const getX = (e: TouchEvent | MouseEvent): number => {
      if ('touches' in e && e.touches.length > 0) {
        return e.touches[0].clientX;
      }
      return (e as MouseEvent).clientX;
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
      card.classList.add('card-animating');
      deleteBtn.classList.add('btn-animating');
      deleteIcon.classList.add('icon-animating');

      updateUI(0);

      setTimeout(() => {
        if (!isOpen && !isDragging) {
          card.classList.remove('rounded-2xl', 'shadow-lg', 'shadow-md');
        }
      }, 350);
    };

    const triggerFullDelete = () => {
      wrapper.classList.add('wrapper-animating');
      wrapper.style.height = '0px';
      wrapper.style.margin = '0px';
      wrapper.style.opacity = '0';

      setTimeout(() => {
        onDelete();
      }, 350);
    };

    const onTouchStart = (e: TouchEvent | MouseEvent) => {
      if (globalActiveSwipeCloseFn && globalActiveSwipeCloseFn !== closeSwipe) {
        globalActiveSwipeCloseFn();
      }

      isDragging = true;
      isSlopPassed = false;
      startX = getX(e);
      wrapperWidth = wrapper.offsetWidth;
      initialTranslateX = isOpen ? -(BTN_OPEN_WIDTH + CARD_BTN_GAP) : 0;

      card.classList.remove('card-animating');
      deleteBtn.classList.remove('btn-animating');
      deleteIcon.classList.remove('icon-animating');

      window.addEventListener('touchmove', onTouchMove, { passive: false });
      window.addEventListener('touchend', onTouchEnd);
      window.addEventListener('mousemove', onTouchMove);
      window.addEventListener('mouseup', onTouchEnd);
    };

    const onTouchMove = (e: TouchEvent | MouseEvent) => {
      if (!isDragging) return;

      const x = getX(e);
      const deltaX = startX - x; // Swiping left = positive delta

      if (!isSlopPassed) {
        if (Math.abs(deltaX) > SLOP_THRESHOLD) {
          isSlopPassed = true;
          card.classList.add('rounded-2xl', 'shadow-lg');
        } else {
          return;
        }
      }

      let calculatedX = initialTranslateX - deltaX;

      // Elastic resistance when pulling right beyond 0
      if (calculatedX > 0) {
        calculatedX = calculatedX * 0.2;
      }

      currentTranslateX = calculatedX;
      updateUI(currentTranslateX);
    };

    const onTouchEnd = () => {
      if (!isDragging) return;
      isDragging = false;

      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
      window.removeEventListener('mousemove', onTouchMove);
      window.removeEventListener('mouseup', onTouchEnd);

      card.classList.add('card-animating');
      deleteBtn.classList.add('btn-animating');
      deleteIcon.classList.add('icon-animating');

      if (!isSlopPassed) return;

      const absTranslate = Math.abs(currentTranslateX);
      const ratio = absTranslate / wrapperWidth;

      // Mode 1: Full swipe over 70% width
      if (ratio >= FULL_SWIPE_RATIO) {
        card.style.transform = `translate3d(-${wrapperWidth}px, 0, 0)`;
        deleteBtn.style.width = `${wrapperWidth}px`;
        deleteBtn.style.borderRadius = '16px';
        deleteBtn.style.opacity = '1';
        deleteBtn.style.transform = 'scale(1)';

        const finalIconOffset = -((wrapperWidth - BTN_BASE_SIZE) / 2);
        deleteIcon.style.transform = `translate3d(${finalIconOffset}px, 0, 0)`;

        triggerFullDelete();
      }
      // Mode 2: Swiped past half of button width -> Open button
      else if (absTranslate >= (BTN_OPEN_WIDTH + CARD_BTN_GAP) / 2) {
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

    deleteBtn.addEventListener('click', handleBtnClick);
    card.addEventListener('touchstart', onTouchStart as any, { passive: true });
    card.addEventListener('mousedown', onTouchStart as any);

    return () => {
      deleteBtn.removeEventListener('click', handleBtnClick);
      card.removeEventListener('touchstart', onTouchStart as any);
      card.removeEventListener('mousedown', onTouchStart as any);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
      window.removeEventListener('mousemove', onTouchMove);
      window.removeEventListener('mouseup', onTouchEnd);
    };
  }, [onDelete]);

  return (
    <div
      ref={wrapperRef}
      className="relative w-full ios-item-wrapper min-h-[58px] my-1 select-none overflow-hidden"
    >
      {/* Red Delete Button Background (flush right, gap on left) */}
      <div className="absolute inset-0 flex items-center justify-start pointer-events-none p-0 z-0">
        <button
          ref={deleteBtnRef}
          type="button"
          className="delete-btn h-[52px] bg-red-600 dark:bg-red-600 text-white flex items-center justify-center shadow-md pointer-events-auto overflow-hidden opacity-0 relative transition-colors active:bg-red-700"
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

      {/* Foreground Content Card */}
      <div
        ref={cardRef}
        className="card-content absolute inset-0 z-10 bg-surface-card rounded-xl flex items-center justify-between cursor-grab active:cursor-grabbing border border-neutral-200/80 dark:border-neutral-800/80 will-change-transform shadow-2xs"
      >
        <div className="w-full h-full flex items-center">{children}</div>
      </div>
    </div>
  );
};
