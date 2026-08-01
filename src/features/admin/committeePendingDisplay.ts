/** Başvurunun ne kadar süredir beklediğini Türkçe gösterir (yaklaşık). */
export function formatApplicationWaitingSince(createdAt: string): string {
  const diffMs = Date.now() - new Date(createdAt).getTime();
  if (diffMs < 0) return "Az önce";

  const minutes = Math.floor(diffMs / (1000 * 60));
  if (minutes < 1) return "Az önce";
  if (minutes < 60) return `${minutes} dakikadır bekliyor`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} saattir bekliyor`;

  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} gündür bekliyor`;

  const months = Math.floor(days / 30);
  return `${months} aydır bekliyor`;
}
