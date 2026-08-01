import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useInfiniteQuery } from "@tanstack/react-query";
import { getFeed } from "@/features/dashboard/api/feed";
import { Icon, type IconName } from "@/shared/ui/Icon";
import type { FeedItem, FeedItemType } from "@/shared/types";

const KIND_META: Record<FeedItemType, { label: string; icon: IconName; tone: string }> = {
  activity: { label: "Etkinlik", icon: "calendar", tone: "bg-brand-50 text-brand-700" },
  announcement: { label: "Duyuru", icon: "announcement", tone: "bg-accent-50 text-accent-700" },
  university_announcement: {
    label: "Okul geneli",
    icon: "campus",
    tone: "bg-amber-50 text-amber-700",
  },
};

/** "3 saat önce" / "2 gün önce" — mutlak tarih başlıkta değil, satırda göreli. */
function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.round(diff / 60_000);
  if (minutes < 1) return "az önce";
  if (minutes < 60) return `${minutes} dk önce`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} saat önce`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days} gün önce`;
  return new Date(iso).toLocaleDateString("tr-TR", { day: "numeric", month: "long" });
}

/** Etkinlik satırında tarih; duyuruda içerik özeti. */
function itemSubtitle(row: FeedItem): string {
  if (row.type === "activity") {
    const startsAt = row.item.startsAt;
    if (!startsAt) return row.item.location ?? "";
    const when = new Date(startsAt).toLocaleString("tr-TR", {
      day: "numeric",
      month: "long",
      hour: "2-digit",
      minute: "2-digit",
    });
    return row.item.location ? `${when} · ${row.item.location}` : when;
  }
  const body = row.item.content ?? row.item.description ?? "";
  return body.length > 140 ? `${body.slice(0, 140)}…` : body;
}

function itemHref(row: FeedItem): string {
  if (row.type === "activity") return `/activities/${row.item.id}`;
  if (row.club) return `/clubs/${row.club.id}`;
  return "/dashboard";
}

function FeedRow({ row }: { row: FeedItem }) {
  const meta = KIND_META[row.type];
  return (
    <Link
      to={itemHref(row)}
      className="group flex gap-4 rounded-2xl p-4 transition-colors hover:bg-slate-50"
    >
      <div className="icon-tile h-11 w-11 shrink-0">
        <Icon name={meta.icon} size={20} className="text-brand-600" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${meta.tone}`}>
            {meta.label}
          </span>
          {row.club && (
            <span className="truncate text-xs font-semibold text-slate-500">{row.club.name}</span>
          )}
          <span className="text-xs text-slate-400">{relativeTime(row.at)}</span>
        </div>
        <p className="mt-1 truncate font-display font-bold text-slate-900 group-hover:text-brand-700">
          {row.item.title ?? "Başlıksız"}
        </p>
        {itemSubtitle(row) && (
          <p className="mt-0.5 line-clamp-2 text-sm text-slate-500">{itemSubtitle(row)}</p>
        )}
      </div>
    </Link>
  );
}

/**
 * Kampüs akışı — dashboard'un merkezi.
 *
 * Backend üç kaynağı tek akışta birleştiriyor (`GET /api/feed`); bu uç uzun
 * süre bağlanmamıştı ve dashboard yerine "Çok yakında" yer tutucuları
 * gösteriliyordu. Kapsam kullanıcının onaylı kulüp üyelikleri + okul geneli
 * duyurular olduğu için içerik kişiye göre değişir.
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

  return (
    <section className="card p-6">
      <div className="mb-2 flex items-center justify-between">
        <div>
          <h2 className="font-display text-xl font-extrabold text-slate-900">Kampüste ne oluyor</h2>
          <p className="text-sm text-slate-500">
            Kulüplerinden ve okuldan gelen son duyurular, yaklaşan etkinlikler.
          </p>
        </div>
        <Link to="/activities" className="shrink-0 text-sm font-bold text-brand-600 hover:underline">
          Etkinlikler →
        </Link>
      </div>

      {isLoading && (
        <div className="space-y-3 py-4">
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex gap-4 p-4">
              <div className="h-11 w-11 shrink-0 animate-pulse rounded-2xl bg-slate-100" />
              <div className="flex-1 space-y-2">
                <div className="h-3 w-24 animate-pulse rounded bg-slate-100" />
                <div className="h-4 w-2/3 animate-pulse rounded bg-slate-100" />
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

      {!isLoading && !isError && rows.length === 0 && (
        <div className="py-10 text-center">
          <Icon name="explore" size={28} className="mx-auto mb-3 text-brand-400" />
          <p className="font-display font-bold text-slate-800">Akışın henüz sessiz</p>
          <p className="mx-auto mt-1 max-w-sm text-sm text-slate-500">
            Bir kulübe katıldığında onun duyuruları ve etkinlikleri burada görünür.
          </p>
          <Link to="/clubs" className="btn-primary mt-5 inline-flex">
            Kulüpleri keşfet
          </Link>
        </div>
      )}

      {rows.length > 0 && (
        <>
          <div className="divide-y divide-slate-100">
            {rows.map((row) => (
              <FeedRow key={`${row.type}-${row.id}`} row={row} />
            ))}
          </div>
          {hasNextPage && (
            <button
              type="button"
              onClick={() => fetchNextPage()}
              disabled={isFetchingNextPage}
              className="mt-4 w-full rounded-2xl border border-slate-200 py-2.5 text-sm font-bold text-slate-600 transition-colors hover:bg-slate-50 disabled:opacity-60"
            >
              {isFetchingNextPage ? "Yükleniyor…" : "Daha fazla göster"}
            </button>
          )}
        </>
      )}
    </section>
  );
}
