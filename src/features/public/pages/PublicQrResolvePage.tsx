import { useEffect } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { resolvePosterQr } from "@/features/public/api/public";
import { publicClubPath, publicActivityPath } from "@/features/public/routes";
import { POSTER_QR_RESOLVE_MESSAGES } from "@/features/poster-qr/labels";
import PageLoader from "@/shared/ui/PageLoader";
import { Icon } from "@/shared/ui/Icon";

/**
 * Afiş QR çözümleme — GET /api/public/qr/:code.
 * Bilinmeyen kod → 404; bilinen ama pasif → 200 + ayırt edilebilir mesaj.
 */
export default function PublicQrResolvePage() {
  const { code = "" } = useParams();
  const navigate = useNavigate();

  const resolveQuery = useQuery({
    queryKey: ["public", "qr", code],
    queryFn: () => resolvePosterQr(code),
    enabled: !!code,
    retry: (count, error) => {
      if (axios.isAxiosError(error) && error.response?.status === 404) return false;
      return count < 1;
    },
  });

  useEffect(() => {
    const result = resolveQuery.data;
    if (!result || result.status !== "active") return;
    const target = result.target;
    if (target.type === "club") {
      navigate(publicClubPath(target.universitySlug, target.clubSlug), { replace: true });
    } else {
      navigate(publicActivityPath(target.universitySlug, target.activityId), { replace: true });
    }
  }, [resolveQuery.data, navigate]);

  if (resolveQuery.isLoading) {
    return <PageLoader label="QR kodu çözümleniyor…" />;
  }

  const isUnknown =
    resolveQuery.isError &&
    axios.isAxiosError(resolveQuery.error) &&
    resolveQuery.error.response?.status === 404;

  if (isUnknown) {
    return (
      <div className="card mx-auto max-w-md p-10 text-center">
        <Icon name="notFound" size={40} className="mx-auto mb-4 text-brand-500" />
        <h1 className="font-display text-xl font-bold text-slate-900">Böyle bir QR kodu yok</h1>
        <p className="mt-2 text-sm text-slate-500">
          Bu kod sistemde kayıtlı değil veya yanlış okutulmuş olabilir.
        </p>
        <Link to="/" className="btn-primary mt-6 inline-flex">
          Ana Sayfa
        </Link>
      </div>
    );
  }

  if (resolveQuery.isError) {
    return (
      <div className="card mx-auto max-w-md p-10 text-center">
        <p className="text-sm text-slate-600">QR kodu çözümlenemedi. Lütfen tekrar deneyin.</p>
      </div>
    );
  }

  const result = resolveQuery.data;
  if (!result || result.status === "active") {
    return <PageLoader label="Yönlendiriliyor…" />;
  }

  return (
    <div className="card mx-auto max-w-md p-10 text-center">
      <Icon name="archive" size={36} className="mx-auto mb-4 text-slate-400" />
      <h1 className="font-display text-xl font-bold text-slate-900">Bu kampanya artık geçerli değil</h1>
      <p className="mt-3 text-sm leading-relaxed text-slate-600">
        {POSTER_QR_RESOLVE_MESSAGES[result.status]}
      </p>
      <Link to="/" className="btn-secondary mt-6 inline-flex">
        Ana Sayfa
      </Link>
    </div>
  );
}
