import { useCallback, useEffect, useRef, useState, type KeyboardEvent, type WheelEvent } from "react";
import CampusFeedCard from "@/pages/dashboard/CampusFeedCard";
import type { VisualFeedCard } from "@/pages/dashboard/campusFeedVisual";
import { Icon } from "@/shared/ui/Icon";

interface CampusFeedStripProps {
  cards: VisualFeedCard[];
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  onLoadMore: () => void;
}

const SCROLL_STEP = 300;

export default function CampusFeedStrip({
  cards,
  hasNextPage,
  isFetchingNextPage,
  onLoadMore,
}: CampusFeedStripProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateScrollState = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const maxScroll = el.scrollWidth - el.clientWidth;
    setCanScrollLeft(el.scrollLeft > 8);
    setCanScrollRight(el.scrollLeft < maxScroll - 8);

    if (hasNextPage && !isFetchingNextPage && maxScroll - el.scrollLeft < 120) {
      onLoadMore();
    }
  }, [hasNextPage, isFetchingNextPage, onLoadMore]);

  useEffect(() => {
    updateScrollState();
  }, [cards.length, updateScrollState]);

  const scrollBy = (delta: number) => {
    scrollRef.current?.scrollBy({ left: delta, behavior: "smooth" });
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "ArrowRight") {
      event.preventDefault();
      scrollBy(SCROLL_STEP);
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      scrollBy(-SCROLL_STEP);
    }
  };

  const handleWheel = (event: WheelEvent<HTMLDivElement>) => {
    const el = scrollRef.current;
    if (!el || Math.abs(event.deltaY) < Math.abs(event.deltaX)) return;
    el.scrollLeft += event.deltaY;
    event.preventDefault();
    updateScrollState();
  };

  return (
    <div className="relative">
      {canScrollLeft && (
        <button
          type="button"
          aria-label="Önceki kartlar"
          onClick={() => scrollBy(-SCROLL_STEP)}
          className="absolute left-0 top-1/2 z-10 hidden -translate-y-1/2 rounded-full border border-slate-200 bg-white/95 p-2 shadow-md transition hover:bg-white md:flex"
        >
          <Icon name="arrowLeft" size={18} />
        </button>
      )}
      {canScrollRight && (
        <button
          type="button"
          aria-label="Sonraki kartlar"
          onClick={() => scrollBy(SCROLL_STEP)}
          className="absolute right-0 top-1/2 z-10 hidden -translate-y-1/2 rounded-full border border-slate-200 bg-white/95 p-2 shadow-md transition hover:bg-white md:flex"
        >
          <Icon name="arrowRight" size={18} />
        </button>
      )}

      <div
        ref={scrollRef}
        tabIndex={0}
        role="region"
        aria-label="Kampüs görsel akışı"
        onScroll={updateScrollState}
        onKeyDown={handleKeyDown}
        onWheel={handleWheel}
        className="flex gap-4 overflow-x-auto scroll-smooth snap-x snap-mandatory pb-2 pt-1
          [-ms-overflow-style:none] [scrollbar-width:thin] focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400"
      >
        {cards.map((card) => (
          <CampusFeedCard key={card.key} card={card} />
        ))}
        {isFetchingNextPage && (
          <div
            className="card flex w-[min(85vw,18rem)] shrink-0 snap-start items-center justify-center sm:w-72"
            aria-hidden
          >
            <div className="h-40 w-full animate-pulse bg-slate-100" />
          </div>
        )}
      </div>
    </div>
  );
}
