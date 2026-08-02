/** Duyuru editedAt — okuyucuya sessiz "düzenlendi" işareti. */
export function formatEditedAtLabel(editedAt: string | null | undefined): string | null {
  if (!editedAt) return null;
  const date = new Date(editedAt).toLocaleDateString("tr-TR", {
    day: "numeric",
    month: "short",
  });
  return `düzenlendi ${date}`;
}
