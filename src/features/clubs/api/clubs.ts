// Clubs feature'ı — /api/clubs (docs/FRONTEND_CLUBS.md).
//
// Tüm rotalar Bearer ister ve JWT'deki üniversiteyle sınırlıdır (path'te
// universityId yoktur, §3). Yetki modeli İKİ katmanlıdır (§1):
//  • Buradaki yönetim uçları KULÜP-İÇİ rolden beslenir (officer/başkan/danışman)
//    — global permission KULLANILMAZ.
//  • Tenant çapındaki kulüp yönetimi (onay/durum/danışman/silme) api/admin.ts'tedir.
//
// Backend'in rota bölümlemesiyle (browse/applications/membership/management)
// aynı sırada gruplanmıştır.
import { apiClient } from "@/shared/api/client";
import type {
  Announcement,
  ApiEnvelope,
  Club,
  ClubApplication,
  ClubApplicationDetail,
  ClubApplicationHistory,
  ClubDetail,
  CreateClubApplicationResult,
  ClubMemberRow,
  ClubRole,
  ContactLink,
  ContactPlatform,
  GalleryImage,
  JoinPolicy,
} from "@/shared/types";

// ---------------------------------------------------------------------------
// Request DTO'ları — sayfalar kendi zod şemasını kurar; bunlar API imzası içindir.
// ---------------------------------------------------------------------------

export interface CreateClubApplicationDto {
  proposedName: string; // 3-256
  description?: string; // max 2000
}

export interface UpdateClubDto {
  // En az bir alan zorunlu; `status` BİLİNÇLİ olarak yok — durum admin'in işidir (§8.1).
  name?: string;
  description?: string;
  logoUrl?: string;
  coverUrl?: string;
  joinPolicy?: JoinPolicy;
}

export interface CreateContactLinkDto {
  platform: ContactPlatform;
  url: string; // max 512
}

export interface CreateAnnouncementDto {
  title: string; // 3-256
  content: string; // 1-5000
  visibility?: "university" | "members";
  pinned?: boolean;
  /** false → taslak; true → anında yayınla. scheduledPublishAtLocal varsa yok sayılır. */
  publish?: boolean;
  /** Tenant yerel YYYY-MM-DDTHH:mm — offset yok. */
  scheduledPublishAtLocal?: string;
}

export interface UpdateAnnouncementDto {
  pinned?: boolean;
  visibility?: "university" | "members";
  scheduledPublishAtLocal?: string | null;
}

export interface CreateGalleryImageDto {
  imageUrl: string; // max 512
  caption?: string; // max 256
}

// ---------------------------------------------------------------------------
// Keşif ve üyelik — her giriş yapmış kullanıcı (§5)
// ---------------------------------------------------------------------------

/** GET /clubs?search= — kendi üniversitemdeki onaylı kulüpler (ada göre alfabetik). */
export const getAvailableClubs = async (search?: string): Promise<Club[]> => {
  const response = await apiClient.get<ApiEnvelope<Club[]>>("/clubs", {
    params: search ? { search } : undefined,
  });
  return response.data.data;
};

/** GET /clubs/:clubId — kulüp + danışmanlar + onaylı üyeler + iletişim linkleri (§5.1). */
export const getClub = async (clubId: string): Promise<ClubDetail> => {
  const response = await apiClient.get<ApiEnvelope<ClubDetail>>(`/clubs/${clubId}`);
  return response.data.data;
};

/** GET /clubs/:clubId/members — onaylı üyeler, joinedAt artan (§5.2). */
export const getClubMembers = async (clubId: string): Promise<ClubMemberRow[]> => {
  const response = await apiClient.get<ApiEnvelope<ClubMemberRow[]>>(`/clubs/${clubId}/members`);
  return response.data.data;
};

/** POST /clubs/:clubId/join — joinPolicy open → approved, approval_required → pending (§5.3). */
export const joinClub = async (clubId: string): Promise<ClubMemberRow> => {
  const response = await apiClient.post<ApiEnvelope<ClubMemberRow>>(`/clubs/${clubId}/join`);
  return response.data.data;
};

/** DELETE /clubs/:clubId/leave — başkan devretmeden ayrılamaz (§5.4). */
export const leaveClub = async (clubId: string): Promise<void> => {
  await apiClient.delete(`/clubs/${clubId}/leave`);
};

// ---------------------------------------------------------------------------
// Kulüp kurma başvuruları — başvuran self-service (§6)
// ---------------------------------------------------------------------------

/** POST /clubs/applications — tenant eşiğine göre başvuru veya kuruluş önerisi (§6.1 / §6A). */
export const createClubApplication = async (
  dto: CreateClubApplicationDto
): Promise<CreateClubApplicationResult> => {
  const response = await apiClient.post<ApiEnvelope<CreateClubApplicationResult>>(
    "/clubs/applications",
    dto
  );
  return response.data.data;
};

/** GET /clubs/applications/:id — yalnızca KENDİ başvurun; onay zinciri gömülü (§6.2). */
export const getMyClubApplication = async (
  applicationId: string
): Promise<ClubApplicationDetail> => {
  const response = await apiClient.get<ApiEnvelope<ClubApplicationDetail>>(
    `/clubs/applications/${applicationId}`
  );
  return response.data.data;
};

/** DELETE /clubs/applications/:id — yalnızca pending başvuru geri çekilebilir (§6.4). */
export const withdrawClubApplication = async (applicationId: string): Promise<void> => {
  await apiClient.delete(`/clubs/applications/${applicationId}`);
};

/** PATCH /clubs/applications/:id/resubmit — yalnızca revision_requested (§6.3). */
export const resubmitClubApplication = async (
  applicationId: string,
  dto: CreateClubApplicationDto
): Promise<ClubApplication> => {
  const response = await apiClient.patch<ApiEnvelope<ClubApplication>>(
    `/clubs/applications/${applicationId}/resubmit`,
    dto
  );
  return response.data.data;
};

/** POST /clubs/applications/:id/appeal — reddedilen başvuruya bir kez itiraz (T4.1). */
export const submitClubApplicationAppeal = async (
  applicationId: string,
  body: { note: string }
): Promise<{ id: string; status: string }> => {
  const response = await apiClient.post<ApiEnvelope<{ id: string; status: string }>>(
    `/clubs/applications/${applicationId}/appeal`,
    body
  );
  return response.data.data;
};

/** GET /clubs/applications/:id/history — kendi başvurunun olay geçmişi. */
export const getMyClubApplicationHistory = async (
  applicationId: string
): Promise<ClubApplicationHistory> => {
  const response = await apiClient.get<ApiEnvelope<ClubApplicationHistory>>(
    `/clubs/applications/${applicationId}/history`
  );
  return response.data.data;
};

// ---------------------------------------------------------------------------
// Kulüp-içi üyelik yönetimi — kulüp rolü gerektirir (§7)
// ---------------------------------------------------------------------------

/** GET /clubs/:clubId/join-requests — staff (danışman/officer/başkan) görüntüler (§7.1). */
export const getJoinRequests = async (clubId: string): Promise<ClubMemberRow[]> => {
  const response = await apiClient.get<ApiEnvelope<ClubMemberRow[]>>(
    `/clubs/${clubId}/join-requests`
  );
  return response.data.data;
};

/** PATCH /clubs/:clubId/join-requests/:userId — officer/başkan karar verir (§7.2). */
export const decideJoinRequest = async (
  clubId: string,
  userId: string,
  decision: "approved" | "rejected"
): Promise<void> => {
  await apiClient.patch(`/clubs/${clubId}/join-requests/${userId}`, { decision });
};

/** DELETE /clubs/:clubId/members/:userId — officer/başkan; başkan çıkarılamaz (§7.3). */
export const removeClubMember = async (clubId: string, userId: string): Promise<void> => {
  await apiClient.delete(`/clubs/${clubId}/members/${userId}`);
};

/** PATCH /clubs/:clubId/members/:userId/role — yalnızca başkan; member↔officer (§7.4). */
export const changeClubMemberRole = async (
  clubId: string,
  userId: string,
  role: Exclude<ClubRole, "president">
): Promise<void> => {
  await apiClient.patch(`/clubs/${clubId}/members/${userId}/role`, { role });
};

/** POST /clubs/:clubId/transfer-presidency — yalnızca başkan; eski başkan officer olur (§7.5). */
export const transferPresidency = async (
  clubId: string,
  newPresidentId: string
): Promise<ClubMemberRow> => {
  const response = await apiClient.post<ApiEnvelope<ClubMemberRow>>(
    `/clubs/${clubId}/transfer-presidency`,
    { newPresidentId }
  );
  return response.data.data;
};

// ---------------------------------------------------------------------------
// Kulüp profili ve iletişim linkleri (§8)
// ---------------------------------------------------------------------------

/** PATCH /clubs/:clubId — yalnızca başkan; durum HARİÇ profil alanları (§8.1). */
export const updateClub = async (clubId: string, dto: UpdateClubDto): Promise<Club> => {
  const response = await apiClient.patch<ApiEnvelope<Club>>(`/clubs/${clubId}`, dto);
  return response.data.data;
};

/** POST /clubs/:clubId/contact-links — officer/başkan; platform başına tek link (§8.2). */
export const createContactLink = async (
  clubId: string,
  dto: CreateContactLinkDto
): Promise<ContactLink> => {
  const response = await apiClient.post<ApiEnvelope<ContactLink>>(
    `/clubs/${clubId}/contact-links`,
    dto
  );
  return response.data.data;
};

/** PATCH /clubs/:clubId/contact-links/:linkId — yalnızca url; platform sabit (§8.2). */
export const updateContactLink = async (
  clubId: string,
  linkId: string,
  url: string
): Promise<ContactLink> => {
  const response = await apiClient.patch<ApiEnvelope<ContactLink>>(
    `/clubs/${clubId}/contact-links/${linkId}`,
    { url }
  );
  return response.data.data;
};

export const deleteContactLink = async (clubId: string, linkId: string): Promise<void> => {
  await apiClient.delete(`/clubs/${clubId}/contact-links/${linkId}`);
};

// ---------------------------------------------------------------------------
// Duyurular ve galeri — yazma yetkisi "staff": danışman/officer/başkan (§9)
// ---------------------------------------------------------------------------

/** GET /clubs/:clubId/announcements — herkes; createdAt azalan, gömülü author (§9.1). */
export const getAnnouncements = async (clubId: string): Promise<Announcement[]> => {
  const response = await apiClient.get<ApiEnvelope<Announcement[]>>(
    `/clubs/${clubId}/announcements`
  );
  return response.data.data;
};

export const createAnnouncement = async (
  clubId: string,
  dto: CreateAnnouncementDto
): Promise<Announcement> => {
  const response = await apiClient.post<ApiEnvelope<Announcement>>(
    `/clubs/${clubId}/announcements`,
    dto
  );
  return response.data.data;
};

export const deleteAnnouncement = async (
  clubId: string,
  announcementId: string
): Promise<void> => {
  await apiClient.delete(`/clubs/${clubId}/announcements/${announcementId}`);
};

/** POST /clubs/:clubId/announcements/:id/publish — taslak → yayın. */
export const publishAnnouncement = async (
  clubId: string,
  announcementId: string
): Promise<Announcement> => {
  const response = await apiClient.post<ApiEnvelope<Announcement>>(
    `/clubs/${clubId}/announcements/${announcementId}/publish`
  );
  return response.data.data;
};

/** PATCH /clubs/:clubId/announcements/:id — sabitleme / görünürlük. */
export const updateAnnouncement = async (
  clubId: string,
  announcementId: string,
  dto: UpdateAnnouncementDto
): Promise<Announcement> => {
  const response = await apiClient.patch<ApiEnvelope<Announcement>>(
    `/clubs/${clubId}/announcements/${announcementId}`,
    dto
  );
  return response.data.data;
};

/** GET /clubs/:clubId/gallery — herkes (§9.2). */
export const getGallery = async (clubId: string): Promise<GalleryImage[]> => {
  const response = await apiClient.get<ApiEnvelope<GalleryImage[]>>(`/clubs/${clubId}/gallery`);
  return response.data.data;
};

export const addGalleryImage = async (
  clubId: string,
  dto: CreateGalleryImageDto
): Promise<GalleryImage> => {
  const response = await apiClient.post<ApiEnvelope<GalleryImage>>(`/clubs/${clubId}/gallery`, dto);
  return response.data.data;
};

export const deleteGalleryImage = async (clubId: string, imageId: string): Promise<void> => {
  await apiClient.delete(`/clubs/${clubId}/gallery/${imageId}`);
};
