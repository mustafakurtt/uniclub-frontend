// Yönetim kapsamındaki üniversiteler — GET /api/admin/universities
// (FRONTEND_RUTBE_VE_PLATFORM.md §2).
//
// "Bu kullanıcı yönetim bağlamında hangi üniversiteleri görebilir?" sorusunun
// TEK doğru cevabı. Yalnızca Authorization ister, ekstra permission istemez:
//   • super_admin / platform_support → tüm üniversiteler
//   • university_admin, student_affairs, auditor … → yalnızca kendi tenant'ı (1)
//   • bypass rolü olmayan platform hesabı → boş dizi
//
// Public `GET /api/universities` (features/universities/api) kayıt formu içindir
// ve bilinçli olarak GLOBAL'dir — yönetim panelinde ASLA kullanılmaz, yoksa bir
// university_admin başka okulları da listeler.
import { apiClient } from "@/shared/api/client";
import type { ApiEnvelope, University } from "@/shared/types";

export const getAccessibleUniversities = async (): Promise<University[]> => {
  const response = await apiClient.get<ApiEnvelope<University[]>>("/admin/universities");
  return response.data.data;
};
