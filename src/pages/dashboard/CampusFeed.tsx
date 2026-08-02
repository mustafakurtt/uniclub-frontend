import { useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { useInfiniteQuery } from "@tanstack/react-query";
import { getFeed } from "@/features/dashboard/api/feed";
import CampusFeedStrip from "@/pages/dashboard/CampusFeedStrip";
import { toVisualFeedCards } from "@/pages/dashboard/campusFeedVisual";
import { Icon } from "@/shared/ui/Icon";

/**
 * Kampüs görsel akışı — `GET /api/feed` içinden etkinlik + galeri kartları.
 * Metin duyuruları dashboard'da gösterilmez (kulüp/okul sayfalarında kalır).
 */
export default function CampusFeed() {
  const { data, isLoading, isError, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useInfiniteQuery({
      queryKey: ["feed"],
      queryFn: ({ pageParam }) => getFeed({ limit: 12, cursor: pageParam }),
      initialPageParam: null as string | null,
      getNextPageParam: (last) => last.nextCursor,
    });

  const rows = useMemo(() => (data?.pages ?? []).flatMap((p) => p.items), [data]);
  const visualCards = useMemo(() => toVisualFeedCards(rows), [rows]);

  // Sayfada yalnızca duyuru varsa sonraki sayfayı otomatik dene.
  useEffect(() => {
    if (
      !isLoading &&
      !isFetchingNextPage &&
      hasNextPage &&
      rows.length > 0 &&
      visualCards.length === 0
    ) {
      fetchNextPage();
    }
  }, [
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    rows.length,
    visualCards.length,
  ]);

  return (
    <section className="card p-6">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-xl font-extrabold text-slate-900">Kampüste ne oluyor</h2>
          <p className="text-sm text-slate-500">
            Kulüplerinden gelen görseller ve etkinlik kapakları — kaydırarak keşfet.
          </p>
        </div>
        <Link to="/activities" className="shrink-0 text-sm font-bold text-brand-600 hover:underline">
          Etkinlikler →
        </Link>
      </div>

      {isLoading && (
        <div className="flex gap-4 overflow-hidden">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="card w-[min(85vw,18rem)] shrink-0 overflow-hidden p-0 sm:w-72"
              aria-hidden
            >
              <div className="aspect-[16/9] animate-pulse bg-slate-100" />
              <div className="space-y-2 p-4">
                <div className="h-3 w-16 animate-pulse rounded bg-slate-100" />
                <div className="h-4 w-3/4 animate-pulse rounded bg-slate-100" />
              </div>
            </div>
          ))}
        </div>
      )}

      {isError && (
        <p className="py-8 text-center text-sm text-slate-500">
          Akış şu an yüklenemedi. Sayfayı yenilemeyi deneyebilirsin.
        </p>
      )}

      {!isLoading && !isError && visualCards.length === 0 && (
        <div className="py-10 text-center">
          <Icon name="gallery" size={28} className="mx-auto mb-3 text-brand-400" />
          <p className="font-display font-bold text-slate-800">Henüz görsel içerik yok</p>
          <p className="mx-auto mt-1 max-w-sm text-sm text-slate-500">
            Kulüp galerileri ve etkinlik kapakları burada görünür. Duyurular kulüp sayfalarında,
            etkinlikler etkinlikler sayfasında.
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-3">
            <Link to="/activities" className="btn-primary inline-flex">
              Etkinliklere git
            </Link>
            <Link to="/clubs" className="btn-secondary inline-flex">
              Kulüpleri keşfet
            </Link>
          </div>
        </div>
      )}

      {visualCards.length > 0 && (
        <CampusFeedStrip
          cards={visualCards}
          hasNextPage={!!hasNextPage}
          isFetchingNextPage={isFetchingNextPage}
          onLoadMore={() => fetchNextPage()}
        />
      )}
    </section>
  );
}
