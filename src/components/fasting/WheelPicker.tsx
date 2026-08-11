import React, { useRef, useEffect } from 'react';

interface WheelPickerProps {
  options: { label: string; value: string | number }[];
  value: string | number;
  onChange: (val: string | number) => void;
  flex?: number;
}

const ITEM_HEIGHT = 44;
const VISIBLE_HEIGHT = 220;
const SPACER_HEIGHT = (VISIBLE_HEIGHT - ITEM_HEIGHT) / 2;

export const WheelPicker: React.FC<WheelPickerProps> = ({ options, value, onChange, flex = 1 }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = scrollRef.current;
    const container = containerRef.current;
    if (!element || !container) return;
    
    let lastSelectedIndex = -1;
    let isScrolling = false;
    let scrollTimeout: any = null;
    let rafId: any = null;

    const clamp = (val: number, min: number, max: number) => Math.min(Math.max(val, min), max);

    const update3DEffects = () => {
      const scrollTop = element.scrollTop;
      const items = container.children as HTMLCollectionOf<HTMLElement>;
      const centerOffset = scrollTop;

      let closestIndex = Math.round(scrollTop / ITEM_HEIGHT);
      closestIndex = clamp(closestIndex, 0, items.length - 1);

      lastSelectedIndex = closestIndex;

      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        const itemTop = i * ITEM_HEIGHT;
        const distanceFromCenter = itemTop - centerOffset;
        const normalizedDist = distanceFromCenter / ITEM_HEIGHT;

        const absDist = Math.abs(normalizedDist);

        if (absDist > 3.5) {
          item.style.opacity = '0';
          item.style.transform = 'scale(0.7)';
        } else {
          const opacity = Math.max(0.2, 1 - Math.pow(absDist / 2.8, 1.5));
          const scale = Math.max(0.75, 1 - absDist * 0.08);
          const rotateX = clamp(normalizedDist * -24, -70, 70);

          item.style.opacity = opacity.toFixed(2);
          item.style.transform = `rotateX(${rotateX}deg) scale(${scale.toFixed(3)})`;

          if (absDist < 0.5) {
            item.classList.add('text-primary-theme', 'font-bold');
            item.classList.remove('text-secondary-theme', 'font-normal');
          } else {
            item.classList.remove('text-primary-theme', 'font-bold');
            item.classList.add('text-secondary-theme', 'font-normal');
          }
        }
      }
    };

    const snapAndSelect = () => {
      const scrollTop = element.scrollTop;
      const targetIndex = clamp(Math.round(scrollTop / ITEM_HEIGHT), 0, container.children.length - 1);
      const targetScrollTop = targetIndex * ITEM_HEIGHT;

      if (Math.abs(element.scrollTop - targetScrollTop) > 1) {
        element.scrollTo({
          top: targetScrollTop,
          behavior: 'smooth'
        });
      }

      const selectedValue = options[targetIndex]?.value;
      if (selectedValue !== undefined && selectedValue !== value) {
        onChange(selectedValue);
      }
    };

    const handleScroll = () => {
      if (!isScrolling) {
        isScrolling = true;
      }

      if (!rafId) {
        rafId = requestAnimationFrame(() => {
          update3DEffects();
          rafId = null;
        });
      }

      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        isScrolling = false;
        snapAndSelect();
      }, 80);
    };

    element.addEventListener('scroll', handleScroll, { passive: true });
    
    // Initial setup
    const index = options.findIndex(o => o.value === value);
    if (index !== -1) {
      element.scrollTop = index * ITEM_HEIGHT;
      update3DEffects();
    }

    return () => {
      element.removeEventListener('scroll', handleScroll);
      clearTimeout(scrollTimeout);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [options, value, onChange]);

  // Handle external value changes
  useEffect(() => {
    const index = options.findIndex(o => o.value === value);
    if (index !== -1 && scrollRef.current) {
      const targetScrollTop = index * ITEM_HEIGHT;
      if (Math.abs(scrollRef.current.scrollTop - targetScrollTop) > 1) {
        scrollRef.current.scrollTo({ top: targetScrollTop, behavior: 'smooth' });
      }
    }
  }, [value, options]);

  return (
    <div 
      style={{ flex, scrollSnapType: 'y mandatory', WebkitOverflowScrolling: 'touch', perspective: '1000px' }} 
      className="h-full overflow-y-scroll no-scrollbar relative outline-none" 
      ref={scrollRef}
      tabIndex={0}
    >
      <div style={{ height: SPACER_HEIGHT }} className="w-full shrink-0" />
      <div ref={containerRef} className="w-full">
        {options.map((opt) => (
          <div
            key={opt.value}
            style={{ scrollSnapAlign: 'center', transformStyle: 'preserve-3d', userSelect: 'none' }}
            className="h-[44px] flex items-center justify-center font-semibold text-base transition-colors duration-75 text-secondary-theme cursor-pointer"
            onClick={() => {
              const idx = options.findIndex(o => o.value === opt.value);
              if (idx !== -1 && scrollRef.current) {
                scrollRef.current.scrollTo({ top: idx * ITEM_HEIGHT, behavior: 'smooth' });
              }
            }}
          >
            {opt.label}
          </div>
        ))}
      </div>
      <div style={{ height: SPACER_HEIGHT }} className="w-full shrink-0" />
    </div>
  );
};
