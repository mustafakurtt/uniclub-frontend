/**
 * Markalı tam sayfa / bölge yükleme göstergesi.
 * `fullScreen` ekranı kaplar (route guard'lar için),
 * aksi halde içerik alanında ortalanır.
 */
export default function PageLoader({ fullScreen = false, label = "Yükleniyor..." }: { fullScreen?: boolean; label?: string }) {
  return (
    <div className={`flex flex-col items-center justify-center gap-5 ${fullScreen ? "min-h-screen bg-club-light" : "min-h-[50vh]"}`}>
      <div className="relative w-16 h-16">
        {/* Dönen gradyan halka */}
        <div className="absolute inset-0 rounded-full border-4 border-brand-100" />
        <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-brand-600 border-r-accent-400 animate-spin" />
        {/* Ortada nabız atan logo noktası */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-5 h-5 rounded-lg bg-gradient-to-br from-brand-600 to-accent-400 animate-pulse-soft shadow-glow" />
        </div>
      </div>
      <p className="text-sm font-semibold text-slate-400 animate-pulse-soft">{label}</p>
    </div>
  );
}
