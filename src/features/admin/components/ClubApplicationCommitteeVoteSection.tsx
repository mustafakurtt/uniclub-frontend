import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { castCommitteeVote, requestClubApplicationRevision } from "@/features/admin/api";
import ClubApplicationNoteDialog from "@/features/admin/components/ClubApplicationNoteDialog";
import { COMMITTEE_VOTE_LABELS } from "@/features/admin/committeeLabels";
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
  return `${tally.approveCount} / ${tally.threshold} onay · ${tally.notVotedCount} üye henüz oy vermedi`;
}

function isCommitteeMemberTally(
  tally: CommitteeApprovalTally
): tally is CommitteeApprovalTally & { myVote?: CommitteeApprovalTally["myVote"] } {
  return Object.prototype.hasOwnProperty.call(tally, "myVote");
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
  const [revisionOpen, setRevisionOpen] = useState(false);

  const isPendingStep = step.status === "pending";
  const isMember = isCommitteeMemberTally(tally);
  const myVote = isMember ? tally.myVote : undefined;
  const locked = !isPendingStep;

  useEffect(() => {
    if (!myVote) return;
    setVoteDraft(myVote.vote);
    setReason(myVote.reason ?? "");
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
    onSuccess: invalidate,
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
    if (voteDraft === "reject" && reason.trim().length < 10) return;
    voteMutation.mutate({
      vote: voteDraft,
      ...(voteDraft === "reject" ? { reason: reason.trim() } : {}),
    });
  };

  const votesByUserId = new Map(tally.votes.map((row) => [row.voterUserId, row]));

  return (
    <section className="card border-violet-100 bg-violet-50/30 p-5">
      <h2 className="font-display text-base font-bold text-slate-900">Kurul oylaması</h2>
      <p className="mt-1 text-sm font-semibold text-slate-700">{tally.committeeName}</p>
      <p className="mt-1 text-sm text-slate-600">
        {tally.memberCount} üye · {tally.threshold} onay gerekir · {tallyStatusLine(tally)}
      </p>
      <p className="mt-2 text-xs text-slate-500">
        Karar için {tally.threshold} onay gerekiyor; oy vermeyen üyeler onayı engeller.
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

      {isMember && isPendingStep && (
        <div className="mt-5 rounded-2xl border border-violet-100 bg-white p-4">
          <h3 className="text-sm font-bold text-slate-900">Oyunuz</h3>
          {locked ? (
            <p className="mt-2 text-sm text-slate-500">
              Bu kademe kararı kesinleşti — oy değiştirilemez.
            </p>
          ) : (
            <>
              {myVote && (
                <p className="mt-2 text-xs text-slate-500">
                  Mevcut oyunuz: <strong>{COMMITTEE_VOTE_LABELS[myVote.vote]}</strong> — karar
                  kesinleşmeden değiştirebilirsiniz.
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
              </div>
              {voteDraft === "reject" && (
                <div className="mt-3">
                  <label className="input-label" htmlFor="committee-reject-reason">
                    Ret gerekçesi (zorunlu)
                  </label>
                  <textarea
                    id="committee-reject-reason"
                    rows={3}
                    className="input-field min-h-[4.5rem] resize-y"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Ret gerekçenizi yazın…"
                  />
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
                disabled={
                  voteMutation.isPending ||
                  (voteDraft === "reject" && reason.trim().length < 10)
                }
                onClick={handleVoteSubmit}
              >
                {voteMutation.isPending ? "Kaydediliyor…" : myVote ? "Oyu güncelle" : "Oy ver"}
              </button>
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
