import { Link } from "react-router-dom";
import EmptyState from "@/shared/ui/EmptyState";
import { Icon } from "@/shared/ui/Icon";

export default function HomeModerationLanding() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-lg font-bold text-slate-900">Moderasyon kuyruğu</h2>
        <p className="mt-1 text-sm text-slate-500">
          Uygunsuz içerik ve üye müdahaleleri — doğrudan moderasyon çalışma alanına geç.
        </p>
      </div>
      <Link to="/admin/moderation" className="card card-hover flex items-center gap-4 p-6">
        <span className="icon-tile">
          <Icon name="moderation" size={28} className="text-brand-600" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-display font-bold text-slate-900">Moderasyon panelini aç</p>
          <p className="text-sm text-slate-500">Kulüp seçerek üye, duyuru ve galeri incelemesi yap.</p>
        </div>
        <Icon name="chevronRight" size={18} className="text-slate-300" />
      </Link>
      <EmptyState
        icon="moderation"
        title="Kulüp seçimi moderasyon sayfasında yapılır"
        description="Buradan doğrudan kuyruğa gidebilirsin; sidebar'daki diğer bölümler de erişilebilir."
      />
    </div>
  );
}
