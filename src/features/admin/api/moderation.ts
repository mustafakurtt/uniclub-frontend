// Üyeler & içerik moderasyonu (tenant üstten müdahale) — §5.5
//   • üye listesi/çıkarma → `club.view` / `club.member.manage`
//   • duyuru/galeri kaldırma → `announcement.moderate` / `gallery.moderate`
// Kulüp-içi katman (officer/president/advisor) korunur; bunlar tenant
// yöneticisinin HERHANGİ bir kulüpte kullanabildiği override'lardır.
import { apiClient } from "@/shared/api/client";
import type { ApiEnvelope, ClubMemberRow } from "@/shared/types";
import { adminBase } from "./_base";

/** Üye listesi (bekleyenler dahil, `user` gömülü) — `club.view`. */
export const getAdminClubMembers = async (
  universityId: string,
  clubId: string
): Promise<ClubMemberRow[]> => {
  const response = await apiClient.get<ApiEnvelope<ClubMemberRow[]>>(
    `${adminBase(universityId)}/clubs/${clubId}/members`
  );
  return response.data.data;
};

export const removeAdminClubMember = async (
  universityId: string,
  clubId: string,
  userId: string
): Promise<void> => {
  await apiClient.delete(`${adminBase(universityId)}/clubs/${clubId}/members/${userId}`);
};

/** Duyuru LİSTESİ public alt-kaynaktan okunur; bu uç yalnızca KALDIRIR. */
export const removeAdminAnnouncement = async (
  universityId: string,
  clubId: string,
  announcementId: string
): Promise<void> => {
  await apiClient.delete(
    `${adminBase(universityId)}/clubs/${clubId}/announcements/${announcementId}`
  );
};

export const removeAdminGalleryImage = async (
  universityId: string,
  clubId: string,
  imageId: string
): Promise<void> => {
  await apiClient.delete(`${adminBase(universityId)}/clubs/${clubId}/gallery/${imageId}`);
};
