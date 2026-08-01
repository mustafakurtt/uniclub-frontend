import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { castCommitteeVote, requestClubApplicationRevision } from "@/features/admin/api";
import ClubApplicationNoteDialog from "@/features/admin/components/ClubApplicationNoteDialog";
import {
  COMMITTEE_REJECT_REASON_MIN,
  COMMITTEE_VOTE_LABELS,
} from "@/features/admin/committeeLabels";
import {
  committeeApprovalThreshold,
  formatCommitteeApprovalProgress,
  formatCommitteeThresholdLabel,
} from "@/features/admin/committeeTallyDisplay";
import { getErrorMessage } from "@/shared/api/client";
import { Icon } from "@/shared/ui/Icon";
import type {
  ClubApplicationApproval,
  CommitteeApprovalTally,
  CommitteeVoteValue,
} from "@/shared/types";

interface ClubApplicationCommitteeVoteSectionProps {
  universityId: string;
  applicationId: string;
  proposedName: string;
  step: ClubApplicationApproval;
  tally: CommitteeApprovalTally;
}

function tallyStatusLine(tally: CommitteeApprovalTally): string {
  const threshold = committeeApprovalThreshold(tally);
  const progress = formatCommitteeApprovalProgress(tally.approveCount, threshold);
  return `${progress} · ${tally.notVotedCount} üye henüz oy vermedi`;
}

function isCommitteeMemberTally(
  tally: CommitteeApprovalTally
): tally is CommitteeApprovalTally & { myVote?: CommitteeApprovalTally["myVote"] } {
  return Object.prototype.hasOwnProperty.call(tally, "myVote");
}

function formatVoteDate(iso: string): string {
  return new Date(iso).toLocaleString("tr-TR", {
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function ClubApplicationCommitteeVoteSection({
  universityId,
  applicationId,
  proposedName,
  step,
  tally,
}: ClubApplicationCommitteeVoteSectionProps) {
  const queryClient = useQueryClient();
  const [voteDraft, setVoteDraft] = useState<CommitteeVoteValue>("approve");
  const [reason, setReason] = useState("");
  const [reasonTouched, setReasonTouched] = useState(false);
  const [editingVote, setEditingVote] = useState(false);
  const [revisionOpen, setRevisionOpen] = useState(false);

  const isPendingStep = step.status === "pending";
  const isMember = isCommitteeMemberTally(tally);
  const myVote = isMember ? tally.myVote : undefined;
  const locked = !isPendingStep;
  const threshold = committeeApprovalThreshold(tally);
  const thresholdLabel = formatCommitteeThresholdLabel(threshold);

  const rejectReasonTrimmed = reason.trim();
  const rejectReasonLength = rejectReasonTrimmed.length;
  const rejectReasonRemaining = Math.max(0, COMMITTEE_REJECT_REASON_MIN - rejectReasonLength);
  const rejectReasonTooShort =
    voteDraft === "reject" && rejectReasonLength < COMMITTEE_REJECT_REASON_MIN;
  const showRejectReasonError =
    voteDraft === "reject" && reasonTouched && rejectReasonTooShort;
  const canSubmitVote =
    !locked &&
    isMember &&
    !(voteDraft === "reject" && rejectReasonTooShort);

  useEffect(() => {
    if (!myVote) {
      setEditingVote(true);
      return;
    }
    setVoteDraft(myVote.vote);
    setReason(myVote.reason ?? "");
    setReasonTouched(false);
    setEditingVote(false);
  }, [myVote]);

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["admin", universityId, "club-applications"] });
    queryClient.invalidateQueries({
      queryKey: ["admin", universityId, "club-application", applicationId],
    });
    queryClient.invalidateQueries({
      queryKey: ["admin", universityId, "club-application-history", applicationId],
    });
  };

  const voteMutation = useMutation({
    mutationFn: (body: { vote: CommitteeVoteValue; reason?: string }) =>
      castCommitteeVote(universityId, applicationId, body),
    onSuccess: () => {
      setEditingVote(false);
      setReasonTouched(false);
      invalidate();
    },
  });

  const revisionMutation = useMutation({
    mutationFn: (note: string) =>
      requestClubApplicationRevision(universityId, applicationId, { note }),
    onSuccess: () => {
      setRevisionOpen(false);
      invalidate();
    },
  });

  const handleVoteSubmit = () => {
    if (locked || !isMember) return;
    if (voteDraft === "reject") {
      setReasonTouched(true);
      if (rejectReasonTooShort) return;
    }
    voteMutation.mutate({
      vote: voteDraft,
      ...(voteDraft === "reject" ? { reason: rejectReasonTrimmed } : {}),
    });
  };

  const votesByUserId = new Map(tally.votes.map((row) => [row.voterUserId, row]));

  return (
    <section className="card border-violet-100 bg-violet-50/30 p-5">
      <h2 className="font-display text-base font-bold text-slate-900">Kurul oylaması</h2>
      <p className="mt-1 text-sm font-semibold text-slate-700">{tally.committeeName}</p>
      <p className="mt-1 text-sm text-slate-600">
        {tally.memberCount} üye · {thresholdLabel} onay gerekir · {tallyStatusLine(tally)}
      </p>
      <p className="mt-2 text-xs text-slate-500">
        {threshold != null ? (
          <>
            Karar için {threshold} onay gerekiyor; {tally.notVotedCount} üye henüz oy vermedi — oy
            vermeyenler onayı engeller.
          </>
        ) : (
          <>
            Gerekli onay sayısı henüz bildirilmedi. {tally.notVotedCount} üye henüz oy vermedi — oy
            vermeyenler onayı engeller.
          </>
        )}
      </p>

      <div className="mt-4">
        <h3 className="text-xs font-bold uppercase tracking-wide text-slate-400">Üye oyları</h3>
        <ul className="mt-2 divide-y divide-slate-100 rounded-2xl border border-slate-100 bg-white">
          {tally.votes.map((row) => {
            const voter = row.voter;
            return (
              <li key={row.voterUserId} className="px-4 py-3">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-slate-800">
                      {voter ? `${voter.firstName} ${voter.lastName}` : "Üye"}
                    </p>
                    {voter?.email && <p className="text-xs text-slate-400">{voter.email}</p>}
                  </div>
                  <span
                    className={`chip text-[10px] ${
                      row.vote === "approve"
                        ? "bg-green-50 text-green-700 border-green-100"
                        : "bg-red-50 text-red-700 border-red-100"
                    }`}
                  >
                    {COMMITTEE_VOTE_LABELS[row.vote]}
                  </span>
                </div>
                <p className="mt-1 text-[11px] text-slate-500">
                  {new Date(row.votedAt).toLocaleString("tr-TR")}
                  {row.reason && <> · "{row.reason}"</>}
                </p>
              </li>
            );
          })}
          {tally.notVotedCount > 0 && (
            <li className="px-4 py-3 text-sm text-slate-500">
              {tally.notVotedCount} üye henüz oy vermedi
              {tally.votes.length > 0 && !votesByUserId.size && null}
            </li>
          )}
        </ul>
      </div>

      {isMember && locked && (
        <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <h3 className="text-sm font-bold text-slate-900">Oyunuz</h3>
          {myVote ? (
            <p className="mt-2 text-sm text-slate-700">
              <span className="font-semibold">Oyunuz:</span> {COMMITTEE_VOTE_LABELS[myVote.vote]} —{" "}
              {formatVoteDate(myVote.votedAt)}
              {myVote.reason && (
                <span className="mt-1 block text-xs text-slate-500">Gerekçe: "{myVote.reason}"</span>
              )}
            </p>
          ) : (
            <p className="mt-2 text-sm text-slate-500">Bu kademede oy kullanmadınız.</p>
          )}
          <p className="mt-2 text-xs text-slate-500">
            Bu kademe kararı kesinleşti ({lockedReasonForStep(step.status)}) — oy değiştirilemez.
          </p>
        </div>
      )}

      {isMember && isPendingStep && (
        <div className="mt-5 rounded-2xl border border-violet-100 bg-white p-4">
          {myVote && !editingVote ? (
            <>
              <h3 className="text-sm font-bold text-slate-900">Oyunuz</h3>
              <p className="mt-2 text-sm text-slate-700">
                <span className="font-semibold">Oyunuz:</span> {COMMITTEE_VOTE_LABELS[myVote.vote]}{" "}
                — {formatVoteDate(myVote.votedAt)}
                {myVote.reason && (
                  <span className="mt-1 block text-xs text-slate-500">
                    Gerekçe: "{myVote.reason}"
                  </span>
                )}
              </p>
              <p className="mt-2 text-xs text-slate-500">
                Karar kesinleşmeden oyunuzu güncelleyebilirsiniz.
              </p>
              <button
                type="button"
                className="btn-secondary mt-3 text-sm"
                onClick={() => setEditingVote(true)}
              >
                <Icon name="edit" size={14} /> Oyunu değiştir
              </button>
            </>
          ) : (
            <>
              <h3 className="text-sm font-bold text-slate-900">
                {myVote ? "Oyunu değiştir" : "Oy ver"}
              </h3>
              {myVote && (
                <p className="mt-1 text-xs text-slate-500">
                  Mevcut: {COMMITTEE_VOTE_LABELS[myVote.vote]} — {formatVoteDate(myVote.votedAt)}
                </p>
              )}
              <div className="mt-3 flex flex-wrap gap-2">
                {(["approve", "reject"] as const).map((v) => (
                  <button
                    key={v}
                    type="button"
                    className={`btn-secondary text-sm ${voteDraft === v ? "ring-2 ring-brand-400" : ""}`}
                    onClick={() => setVoteDraft(v)}
                    disabled={voteMutation.isPending}
                  >
                    {v === "approve" ? (
                      <Icon name="check" size={14} />
                    ) : (
                      <Icon name="reject" size={14} />
                    )}{" "}
                    {COMMITTEE_VOTE_LABELS[v]}
                  </button>
                ))}
                <button
                  type="button"
                  className="btn-ghost text-sm text-violet-700 hover:bg-violet-50"
                  disabled={revisionMutation.isPending}
                  onClick={() => setRevisionOpen(true)}
                >
                  <Icon name="edit" size={14} /> Revizyon İste
                </button>
                {myVote && (
                  <button
                    type="button"
                    className="btn-ghost text-sm"
                    disabled={voteMutation.isPending}
                    onClick={() => {
                      setEditingVote(false);
                      setReasonTouched(false);
                      if (myVote) {
                        setVoteDraft(myVote.vote);
                        setReason(myVote.reason ?? "");
                      }
                      voteMutation.reset();
                    }}
                  >
                    İptal
                  </button>
                )}
              </div>
              {voteDraft === "reject" && (
                <div className="mt-3">
                  <label className="input-label" htmlFor="committee-reject-reason">
                    Ret gerekçesi (zorunlu)
                  </label>
                  <textarea
                    id="committee-reject-reason"
                    rows={3}
                    className={`input-field min-h-[4.5rem] resize-y ${
                      showRejectReasonError ? "border-red-400 ring-1 ring-red-200" : ""
                    }`}
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    onBlur={() => setReasonTouched(true)}
                    placeholder="Ret gerekçenizi yazın…"
                    aria-invalid={showRejectReasonError}
                    aria-describedby="committee-reject-reason-hint committee-reject-reason-error"
                  />
                  <p id="committee-reject-reason-hint" className="mt-1 text-xs text-slate-500">
                    {rejectReasonLength}/{COMMITTEE_REJECT_REASON_MIN} karakter
                    {rejectReasonRemaining > 0 && (
                      <span className="text-slate-400"> · {rejectReasonRemaining} karakter kaldı</span>
                    )}
                  </p>
                  {showRejectReasonError && (
                    <p id="committee-reject-reason-error" className="input-error mt-1">
                      Ret gerekçesi en az {COMMITTEE_REJECT_REASON_MIN} karakter olmalı
                    </p>
                  )}
                </div>
              )}
              {voteMutation.isError && (
                <div className="alert-error mt-3 text-sm">
                  {getErrorMessage(voteMutation.error, "Oy kaydedilemedi.")}
                </div>
              )}
              <button
                type="button"
                className="btn-primary mt-3 text-sm"
                disabled={voteMutation.isPending || !canSubmitVote}
                onClick={handleVoteSubmit}
              >
                {voteMutation.isPending ? "Kaydediliyor…" : myVote ? "Oyu güncelle" : "Oy ver"}
              </button>
              {!canSubmitVote && voteDraft === "reject" && (
                <p className="mt-2 text-xs text-slate-500">
                  Ret oyu için gerekçe en az {COMMITTEE_REJECT_REASON_MIN} karakter olmalı.
                </p>
              )}
            </>
          )}
        </div>
      )}

      <ClubApplicationNoteDialog
        variant="revision"
        open={revisionOpen}
        clubName={proposedName}
        loading={revisionMutation.isPending}
        error={revisionMutation.error}
        onConfirm={(note) => revisionMutation.mutate(note)}
        onClose={() => {
          setRevisionOpen(false);
          revisionMutation.reset();
        }}
      />
    </section>
  );
}

const APPROVAL_STATUS_LOCKED_REASON: Record<
  Exclude<ClubApplicationApproval["status"], "pending">,
  string
> = {
  approved: "onaylandı",
  rejected: "reddedildi",
  revision_requested: "revizyon istendi",
};

function lockedReasonForStep(status: ClubApplicationApproval["status"]): string {
  if (status === "pending") return "beklemede";
  return APPROVAL_STATUS_LOCKED_REASON[status];
}
