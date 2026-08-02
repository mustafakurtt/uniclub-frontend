import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FocusEvent,
  type KeyboardEvent,
  type WheelEvent,
} from "react";
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
/** ~22 px/s — kart başlığı okunabilir hızda. */
const AUTO_SCROLL_PX_PER_SEC = 22;
const MANUAL_IDLE_MS = 3000;
const END_THRESHOLD = 4;
const SCROLL_TOLERANCE = 2;

interface PauseFlags {
  user: boolean;
  hover: boolean;
  focus: boolean;
  touch: boolean;
  manual: boolean;
}

function isPaused(flags: PauseFlags, reducedMotion: boolean) {
  return (
    reducedMotion ||
    flags.user ||
    flags.hover ||
    flags.focus ||
    flags.touch ||
    flags.manual
  );
}

export default function CampusFeedStrip({
  cards,
  hasNextPage,
  isFetchingNextPage,
  onLoadMore,
}: CampusFeedStripProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);
  const lastFrameTimeRef = useRef<number | null>(null);
  const directionRef = useRef<1 | -1>(1);
  const expectedScrollLeftRef = useRef<number | null>(null);
  const idleResumeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pauseRef = useRef<PauseFlags>({
    user: false,
    hover: false,
    focus: false,
    touch: false,
    manual: false,
  });
  const reducedMotionRef = useRef(false);
  const scrollUiRef = useRef({ canLeft: false, canRight: false });
  const onLoadMoreRef = useRef(onLoadMore);

  const hasNextPageRef = useRef(hasNextPage);
  const isFetchingNextPageRef = useRef(isFetchingNextPage);
  hasNextPageRef.current = hasNextPage;
  isFetchingNextPageRef.current = isFetchingNextPage;
  onLoadMoreRef.current = onLoadMore;

  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  /** Yalnızca Duraklat/Oynat düğmesi etiketi için — rAF bunu okumaz. */
  const [userPaused, setUserPaused] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  /** snap-x ↔ snap-none; yalnızca duraklatma değişiminde güncellenir, kare başına değil. */
  const [snapEnabled, setSnapEnabled] = useState(() =>
    isPaused(pauseRef.current, reducedMotion),
  );

  reducedMotionRef.current = reducedMotion;

  const refreshSnapMode = useCallback(() => {
    const next = isPaused(pauseRef.current, reducedMotionRef.current);
    setSnapEnabled((prev) => (prev === next ? prev : next));
  }, []);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = (event: MediaQueryListEvent) => {
      reducedMotionRef.current = event.matches;
      setReducedMotion(event.matches);
      refreshSnapMode();
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [refreshSnapMode]);

  const clearIdleResumeTimer = useCallback(() => {
    if (idleResumeTimerRef.current !== null) {
      clearTimeout(idleResumeTimerRef.current);
      idleResumeTimerRef.current = null;
    }
  }, []);

  const syncScrollUi = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const maxScroll = el.scrollWidth - el.clientWidth;
    const canLeft = el.scrollLeft > 8;
    const canRight = el.scrollLeft < maxScroll - 8;

    if (canLeft !== scrollUiRef.current.canLeft) {
      scrollUiRef.current.canLeft = canLeft;
      setCanScrollLeft(canLeft);
    }
    if (canRight !== scrollUiRef.current.canRight) {
      scrollUiRef.current.canRight = canRight;
      setCanScrollRight(canRight);
    }
  }, []);

  const maybeLoadMore = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const maxScroll = el.scrollWidth - el.clientWidth;
    if (
      hasNextPageRef.current &&
      !isFetchingNextPageRef.current &&
      maxScroll - el.scrollLeft < 120
    ) {
      onLoadMoreRef.current();
    }
  }, []);

  const interruptAutoScroll = useCallback(() => {
    pauseRef.current.manual = true;
    refreshSnapMode();
    clearIdleResumeTimer();
    idleResumeTimerRef.current = setTimeout(() => {
      pauseRef.current.manual = false;
      refreshSnapMode();
      idleResumeTimerRef.current = null;
    }, MANUAL_IDLE_MS);
  }, [clearIdleResumeTimer, refreshSnapMode]);

  useEffect(() => {
    syncScrollUi();
    maybeLoadMore();
  }, [cards.length, maybeLoadMore, syncScrollUi]);

  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (el) {
      const expected = expectedScrollLeftRef.current;
      const isProgrammatic =
        expected !== null && Math.abs(el.scrollLeft - expected) <= SCROLL_TOLERANCE;
      if (!isProgrammatic) {
        expectedScrollLeftRef.current = null;
        interruptAutoScroll();
      }
    }
    syncScrollUi();
    maybeLoadMore();
  }, [interruptAutoScroll, maybeLoadMore, syncScrollUi]);

  const scrollBy = useCallback(
    (delta: number) => {
      interruptAutoScroll();
      scrollRef.current?.scrollBy({ left: delta, behavior: "smooth" });
    },
    [interruptAutoScroll],
  );

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
    interruptAutoScroll();
    el.scrollLeft += event.deltaY;
    event.preventDefault();
    syncScrollUi();
    maybeLoadMore();
  };

  const handleFocusIn = () => {
    pauseRef.current.focus = true;
    refreshSnapMode();
  };

  const handleFocusOut = (event: FocusEvent<HTMLDivElement>) => {
    const wrapper = wrapperRef.current;
    const next = event.relatedTarget;
    if (wrapper && next instanceof Node && wrapper.contains(next)) return;
    pauseRef.current.focus = false;
    refreshSnapMode();
  };

  const handleTouchStart = () => {
    pauseRef.current.touch = true;
    refreshSnapMode();
  };

  const handleTouchEnd = () => {
    pauseRef.current.touch = false;
    refreshSnapMode();
    interruptAutoScroll();
  };

  const handleTogglePause = () => {
    pauseRef.current.user = !pauseRef.current.user;
    setUserPaused(pauseRef.current.user);
    refreshSnapMode();
  };

  // rAF döngüsü mount'ta bir kez kurulur; pause bayrakları ref'ten okunur.
  useEffect(() => {
    if (reducedMotion) return;

    const tick = (time: number) => {
      const el = scrollRef.current;

      if (!el || isPaused(pauseRef.current, reducedMotionRef.current)) {
        lastFrameTimeRef.current = null;
        rafRef.current = requestAnimationFrame(tick);
        return;
      }

      const maxScroll = el.scrollWidth - el.clientWidth;
      if (maxScroll <= END_THRESHOLD) {
        lastFrameTimeRef.current = null;
        rafRef.current = requestAnimationFrame(tick);
        return;
      }

      if (lastFrameTimeRef.current !== null) {
        const deltaMs = Math.min(time - lastFrameTimeRef.current, 50);
        const step = (AUTO_SCROLL_PX_PER_SEC / 1000) * deltaMs * directionRef.current;
        let nextLeft = el.scrollLeft + step;

        if (nextLeft >= maxScroll - END_THRESHOLD) {
          nextLeft = maxScroll;
          if (hasNextPageRef.current || isFetchingNextPageRef.current) {
            directionRef.current = 1;
          } else {
            directionRef.current = -1;
          }
        } else if (nextLeft <= END_THRESHOLD) {
          nextLeft = 0;
          directionRef.current = 1;
        }

        expectedScrollLeftRef.current = nextLeft;
        el.scrollLeft = nextLeft;

        if (
          hasNextPageRef.current &&
          !isFetchingNextPageRef.current &&
          maxScroll - nextLeft < 120
        ) {
          onLoadMoreRef.current();
        }
      }

      lastFrameTimeRef.current = time;
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      clearIdleResumeTimer();
    };
  }, [clearIdleResumeTimer, reducedMotion]);

  return (
    <div
      ref={wrapperRef}
      onMouseEnter={() => {
        pauseRef.current.hover = true;
        refreshSnapMode();
      }}
      onMouseLeave={() => {
        pauseRef.current.hover = false;
        refreshSnapMode();
      }}
      onFocusCapture={handleFocusIn}
      onBlurCapture={handleFocusOut}
    >
      {!reducedMotion && (
        <div className="mb-2 flex justify-end">
          <button
            type="button"
            onClick={handleTogglePause}
            className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
            aria-label={userPaused ? "Oynat" : "Duraklat"}
          >
            <Icon name={userPaused ? "play" : "pause"} size={14} />
            {userPaused ? "Oynat" : "Duraklat"}
          </button>
        </div>
      )}

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
          onScroll={handleScroll}
          onKeyDown={handleKeyDown}
          onWheel={handleWheel}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          onTouchCancel={handleTouchEnd}
          className={`no-scrollbar flex gap-4 overflow-x-auto pb-2 pt-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 ${
            snapEnabled ? "scroll-smooth snap-x snap-mandatory" : "snap-none"
          }`}
        >
          {cards.map((card) => (
            <CampusFeedCard key={card.key} card={card} />
          ))}
          {isFetchingNextPage && (
            <div
              className="card flex w-[min(78vw,20rem)] shrink-0 snap-start items-center justify-center sm:w-80"
              aria-hidden
            >
              <div className="h-40 w-full animate-pulse bg-slate-100" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
