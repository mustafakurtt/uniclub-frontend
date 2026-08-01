// Kuruluş önerisi + dijital destek (FRONTEND_CLUB_FORMATION.md, T1.1)
import type { SafeUser } from "./user";

export type FormationProposalStatus =
  | "collecting_support"
  | "submitted"
  | "withdrawn"
  | "expired";

/** Öğrenci keşif/liste/detay — destekçi kimliği YOK (KVKK). */
export interface FormationProposal {
  id: string;
  proposedName: string;
  description: string | null;
  status: FormationProposalStatus;
  supportCount: number;
  supportThreshold: number;
  expiresAt: string;
  createdAt: string;
  proposer: SafeUser | null;
  /** Oturum açmış kullanıcı bu öneriyi destekledi mi (öğrenci liste/detay). */
  hasSupported?: boolean;
}

/** GET detay — ek alanlar. */
export interface FormationProposalDetail extends FormationProposal {
  isProposer: boolean;
  submittedAt: string | null;
  applicationId: string | null;
}

/** POST /clubs/applications yanıtı — tenant eşiğe göre ayrım. */
export type CreateClubApplicationResult =
  | ({ kind: "application" } & import("./club").ClubApplication)
  | ({ kind: "formation_proposal"; supportThreshold: number } & FormationProposal);

/** Admin detay — destekçi listesi yalnızca SKS (denetim). */
export interface FormationProposalSupporter {
  supportedAt: string;
  user: SafeUser;
}

export interface AdminFormationProposalDetail extends FormationProposal {
  submittedAt: string | null;
  applicationId: string | null;
  supporters: FormationProposalSupporter[];
}
