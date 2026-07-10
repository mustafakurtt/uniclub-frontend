import { getErrorMessage } from "@/shared/api/client";

/** Bölüm içi hata bandı — backend mesajı (Turkçe) doğrudan gösterilir. */
export default function MutationError({ error }: { error: unknown }) {
  if (!error) return null;
  return <div className="alert-error mb-2">{getErrorMessage(error, "İşlem başarısız.")}</div>;
}
