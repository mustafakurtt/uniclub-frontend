import { Link } from "react-router-dom";
import { Icon } from "@/shared/ui/Icon";

interface PublicJoinCtaProps {
  /** Giriş yapmış kullanıcı için uygulama içi hedef (otomatik yönlendirme ayrı hook'ta). */
  label?: string;
  hint?: string;
}

/** Kayıtsız ziyaretçi için katılım CTA — auth akışına yönlendirir. */
export default function PublicJoinCta({
  label = "Katılmak için giriş yap",
  hint = "Üniversite e-postanla kayıt ol veya giriş yap; ardından etkinliğe katılabilirsin.",
}: PublicJoinCtaProps) {
  return (
    <div className="card-gradient p-6 text-center">
      <Icon name="member" size={32} className="mx-auto mb-3 text-brand-600" />
      <h2 className="font-display text-lg font-bold text-slate-900">{label}</h2>
      <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">{hint}</p>
      <div className="mt-5 flex flex-wrap justify-center gap-3">
        <Link to="/login" className="btn-primary">
          Giriş Yap
        </Link>
        <Link to="/register" className="btn-secondary">
          Kayıt Ol
        </Link>
      </div>
    </div>
  );
}
