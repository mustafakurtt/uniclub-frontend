import { Link } from "react-router-dom";
import AuroraBackground from "@/shared/ui/AuroraBackground";
import { Icon } from "@/shared/ui/Icon";

export default function Forbidden() {
  return (
    <div className="min-h-[70vh] relative flex flex-col items-center justify-center text-center p-6 overflow-hidden">
      <AuroraBackground variant="light" />

      <div className="relative z-10 animate-scale-in">
        <Icon name="lock" size={60} className="mx-auto mb-6 animate-float text-brand-500" />
        <h1 className="font-display text-7xl md:text-8xl font-extrabold text-gradient mb-4">403</h1>
        <p className="font-display text-xl font-bold text-slate-800 mb-2">Bu kapı sana kapalı.</p>
        <p className="text-slate-500 max-w-md mx-auto mb-8">
          Bu sayfayı görüntülemek için yetkin bulunmuyor. Yanlışlık olduğunu düşünüyorsan kulüp yöneticinle iletişime geç.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <Link to="/dashboard" className="btn-primary">Panele Dön</Link>
          <Link to="/clubs" className="btn-secondary">Kulüpleri Keşfet</Link>
        </div>
      </div>
    </div>
  );
}
