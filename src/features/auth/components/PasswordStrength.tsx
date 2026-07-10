/**
 * Canlı şifre gücü göstergesi — kayıt formunda yazarken dolan 4 segmentli
 * çubuk. Skor tamamen istemci tarafı bir his/oyunlaştırma öğesidir; gerçek
 * kural (min 6 karakter) zod şemasında ve backend'dedir.
 */

function scorePassword(password: string): number {
  let score = 0;
  if (password.length >= 6) score++;
  if (password.length >= 10) score++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[^a-zA-Z0-9]/.test(password)) score++;
  return Math.min(4, score);
}

const LEVELS: { label: string; text: string; bar: string }[] = [
  { label: "Çok zayıf", text: "text-red-500", bar: "bg-red-400" },
  { label: "Zayıf", text: "text-orange-500", bar: "bg-orange-400" },
  { label: "İdare eder", text: "text-amber-500", bar: "bg-amber-400" },
  { label: "Güçlü", text: "text-emerald-600", bar: "bg-emerald-400" },
  { label: "Efsane", text: "text-brand-600", bar: "bg-gradient-to-r from-brand-500 to-accent-400" },
];

export function PasswordStrength({ password }: { password: string }) {
  if (!password) return null;

  const score = scorePassword(password);
  const level = LEVELS[score];

  return (
    <div className="mt-2 animate-fade-in">
      <div className="flex gap-1.5">
        {[0, 1, 2, 3].map((i) => (
          <span
            key={i}
            className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
              i < Math.max(1, score) ? level.bar : "bg-slate-100"
            }`}
          />
        ))}
      </div>
      <p className={`mt-1.5 text-xs font-bold ${level.text}`}>{level.label}</p>
    </div>
  );
}
