// Öğrenci başvuru süreci — durum cümlesi (onay zinciri türetimi).
import { approverRoleLabel } from "@/features/admin/labels";
import { findCurrentApprovalStep } from "@/features/admin/approvalChain";
import type { ClubApplication, ClubApplicationDetail } from "@/shared/types";

function waitingAtRolePhrase(approverRole: string): string {
  if (approverRole === "student_affairs") return "SKS incelemesinde";
  if (approverRole === "advisor") return "Danışman onayı bekleniyor";
  if (approverRole === "club_approver") return "Kulüp onay yetkilisi incelemesinde";
  return `${approverRoleLabel(approverRole)} onayı bekleniyor`;
}

/** Öğrencinin sayfada ilk görmesi gereken tek cümlelik durum. */
export function getStudentApplicationStatusLine(application: ClubApplicationDetail): string {
  if (application.status === "revision_requested") {
    return "Sizden düzeltme bekleniyor";
  }
  if (application.status === "approved") {
    return "Başvurunuz onaylandı — kulüp oluşturma süreci tamamlandı";
  }
  if (application.status === "rejected") {
    if (application.appeal?.status === "pending") return "İtirazınız inceleniyor";
    if (application.appeal?.status === "upheld") return "İtirazınız kabul edildi — yeniden değerlendiriliyor";
    if (application.appeal?.status === "dismissed") return "İtirazınız reddedildi";
    if (application.canAppeal) return "Başvurunuz reddedildi — itiraz edebilirsiniz";
    return "Başvurunuz reddedildi";
  }

  const current = findCurrentApprovalStep(application.approvals);
  if (current?.approverRole) {
    return waitingAtRolePhrase(current.approverRole);
  }

  const sorted = [...application.approvals].sort((a, b) => a.step - b.step);
  const allApproved = sorted.length > 0 && sorted.every((a) => a.status === "approved");
  if (allApproved) return "Tüm onay kademeleri tamamlandı";

  if (sorted.length === 1 && sorted[0].status === "pending") {
    return waitingAtRolePhrase(sorted[0].approverRole);
  }

  return "Başvurunuz değerlendiriliyor";
}

/** Dashboard kartı için açık başvuru mu? (liste ucu yalnızca özet döner). */
export function isOpenClubApplication(application: Pick<ClubApplication, "status">): boolean {
  return (
    application.status === "pending" ||
    application.status === "revision_requested" ||
    application.status === "rejected"
  );
}
