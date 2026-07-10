import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { getAccessibleUniversities } from "@/features/admin/api";
import type { University } from "@/shared/types";

/**
 * Yönetim panelinin TENANT KAPSAMI (FRONTEND_RUTBE_VE_PLATFORM.md §2).
 *
 * Hedef üniversite artık `user.universityId`'den okunamaz: platform hesaplarında
 * o alan `null`'dır ve `/admin/universities/null/users` gibi URL'ler üretirdi.
 * Doğru kaynak `GET /api/admin/universities` — "bu kullanıcı yönetim bağlamında
 * hangi üniversiteleri görebilir?".
 *
 *   • 1 üniversite  → seçici gösterme, doğrudan onu kullan (tenant yöneticisi)
 *   • N üniversite  → seçici göster (platform hesabı)
 *   • 0 üniversite  → yönetilecek tenant yok; sayfalar bunu bildirir
 *
 * Bölge (region) katmanı geldiğinde bu uç kendiliğinden birden çok üniversite
 * dönmeye başlar; panel şimdiden "N dönebilir" varsayımıyla yazılmıştır (§8).
 */
interface AdminScopeValue {
  /** Yönetim kapsamındaki üniversiteler (yetkiye göre backend filtreler). */
  universities: University[];
  /** Seçili üniversite id'si — hiçbiri yoksa null. Tüm /admin/... URL'lerinde bu kullanılır. */
  universityId: string | null;
  /** Seçili üniversite objesi (başlıkta göstermek için). */
  university: University | null;
  /** true → üniversite seçici gösterilmeli (birden çok tenant erişimi var). */
  canSelect: boolean;
  setUniversityId: (id: string) => void;
  isLoading: boolean;
  isError: boolean;
  error: unknown;
}

const AdminScopeContext = createContext<AdminScopeValue | undefined>(undefined);

// Platform hesabı sayfa yenilediğinde seçimini kaybetmesin.
const STORAGE_KEY = "admin:universityId";

export function AdminScopeProvider({ children }: { children: ReactNode }) {
  const universitiesQuery = useQuery({
    queryKey: ["admin", "accessibleUniversities"],
    queryFn: getAccessibleUniversities,
  });

  const universities = useMemo(() => universitiesQuery.data ?? [], [universitiesQuery.data]);
  const [selectedId, setSelectedId] = useState<string | null>(() =>
    localStorage.getItem(STORAGE_KEY)
  );

  // Seçim listeyle tutarlı olmalı: liste gelince (ya da yetki değişince) doğrula.
  // Geçersiz/boş seçimde ilk üniversiteye düş — tek tenant'lı kullanıcı hiç
  // seçim yapmadan çalışsın diye.
  useEffect(() => {
    if (universities.length === 0) return;
    const isValid = selectedId !== null && universities.some((u) => u.id === selectedId);
    if (!isValid) setSelectedId(universities[0].id);
  }, [universities, selectedId]);

  const setUniversityId = useCallback((id: string) => {
    setSelectedId(id);
    localStorage.setItem(STORAGE_KEY, id);
  }, []);

  // Doğrulanmamış bir id'yi dışarı sızdırma: liste boşken/eşleşmezken null dön.
  const universityId =
    selectedId !== null && universities.some((u) => u.id === selectedId) ? selectedId : null;

  const value: AdminScopeValue = {
    universities,
    universityId,
    university: universities.find((u) => u.id === universityId) ?? null,
    canSelect: universities.length > 1,
    setUniversityId,
    isLoading: universitiesQuery.isLoading,
    isError: universitiesQuery.isError,
    error: universitiesQuery.error,
  };

  return <AdminScopeContext.Provider value={value}>{children}</AdminScopeContext.Provider>;
}

export function useAdminScope(): AdminScopeValue {
  const ctx = useContext(AdminScopeContext);
  if (!ctx) throw new Error("useAdminScope, AdminScopeProvider içinde kullanılmalıdır.");
  return ctx;
}
