import { Link } from "react-router-dom";
import { Icon } from "@/shared/ui/Icon";

interface PublicNotFoundProps {
  title?: string;
  description?: string;
}

/** Kamuya açık 404 — hata ekranı değil, nötr "bulunamadı" mesajı. */
export default function PublicNotFound({
  title = "Bu içerik bulunamadı",
  description = "Bağlantı hatalı olabilir veya içerik artık kamuya açık değildir.",
}: PublicNotFoundProps) {
  return (
    <div className="card-gradient animate-scale-in px-8 py-12 text-center">
      <Icon name="notFound" size={40} className="mx-auto mb-4 text-brand-500" />
      <h1 className="font-display text-xl font-bold text-slate-800">{title}</h1>
      <p className="mx-auto mt-2 max-w-sm text-sm text-slate-500">{description}</p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Link to="/" className="btn-primary text-sm">
          <Icon name="home" size={16} /> Ana Sayfa
        </Link>
        <Link to="/login" className="btn-secondary text-sm">
          Giriş Yap
        </Link>
      </div>
    </div>
  );
}
