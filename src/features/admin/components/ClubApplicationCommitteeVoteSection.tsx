import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  castCommitteeVote,
  requestClubApplicationRevision,
} from "@/features/admin/api";
import ClubApplicationNoteDialog from "@/features/admin/components/ClubApplicationNoteDialog";
import { COMMITTEE_VOTE_LABELS } from "@/features/admin/committeeLabels";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { getErrorMessage } from "@/shared/api/client";
import { Icon } from "@/shared/ui/Icon";
import type {
  ApprovalCommittee,
  ClubApplicationApproval,
  CommitteeVoteResult,
  CommitteeVoteRow,
  CommitteeVoteTally,
  CommitteeVoteValue,
} from "@/shared/types";

interface ClubApplicationCommitteeVoteSectionProps {
  universityId: string;
  applicationId: string;
  proposedName: string;
  step: ClubApplicationApproval;
  committee: ApprovalCommittee;
}

function tallyStatusLine(tally: CommitteeVoteTally): string {
  const abstaining = tally.memberCount - tally.votes;
  return `${tally.approveCount} / ${tally.threshold} onay · ${abstaining} üye henüz oy vermedi`;
}

export default function ClubApplicationCommitteeVoteSection({
  universityId,
  applicationId,
  proposedName,
  step,
  committee,
}: ClubApplicationCommitteeVoteSectionProps) {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [tally, setTally] = useState<CommitteeVoteTally | null>(null);
  const [voteRows, setVoteRows] = useState<Record<string, CommitteeVoteRow>>({});
  const [finalized, setFinalized] = useState(false);
  const [voteDraft, setVoteDraft] = useState<CommitteeVoteValue>("approve");
  const [reason, setReason] = useState("");
  const [revisionOpen, setRevisionOpen] = useState(false);

  const isPendingStep = step.status === "pending";
  const isMember = committee.members.some((m) => m.userId === user?.id);
  const myVote = user ? voteRows[user.id] : undefined;
  const locked = !isPendingStep || finalized;

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["admin", universityId, "club-applications"] });
    queryClient.invalidateQueries({
      queryKey: ["admin", universityId, "club-application", applicationId],
    });
    queryClient.invalidateQueries({
      queryKey: ["admin", universityId, "club-application-history", applicationId],
    });
  };

  const applyVoteResult = (result: CommitteeVoteResult, row: CommitteeVoteRow) => {
    setTally(result.tally);
    setFinalized(result.finalized);
    setVoteRows((prev) => ({ ...prev, [row.voterUserId]: row }));
  };

  const voteMutation = useMutation({
    mutationFn: (body: { vote: CommitteeVoteValue; reason?: string }) =>
      castCommitteeVote(universityId, applicationId, body),
    onSuccess: (result, variables) => {
      if (!user) return;
      applyVoteResult(result, {
        voterUserId: user.id,
        vote: variables.vote,
        reason: variables.reason?.trim() || null,
        votedAt: new Date().toISOString(),
        voter: user,
      });
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
    if (voteDraft === "reject" && reason.trim().length < 10) return;
    voteMutation.mutate({
      vote: voteDraft,
      ...(voteDraft === "reject" ? { reason: reason.trim() } : {}),
    });
  };

  const displayTally = tally;
  const thresholdHint = displayTally
    ? `Karar için ${displayTally.threshold} onay gerekiyor; oy vermeyen üyeler onayı engeller.`
    : `${committee.members.length} üyeli kurul salt çoğunlukla karar verir; oy vermeyen üyeler çoğunluğa ulaşılmasını engeller.`;

  return (
    <section className="card border-violet-100 bg-violet-50/30 p-5">
      <h2 className="font-display text-base font-bold text-slate-900">Kurul oylaması</h2>
      <p className="mt-1 text-sm font-semibold text-slate-700">{committee.name}</p>
      <p className="mt-1 text-sm text-slate-600">
        {committee.members.length} üye
        {displayTally && (
          <>
            {" "}
            · {displayTally.threshold} onay gerekir · {tallyStatusLine(displayTally)}
          </>
        )}
      </p>
      <p className="mt-2 text-xs text-slate-500">{thresholdHint}</p>

      <div className="mt-4">
        <h3 className="text-xs font-bold uppercase tracking-wide text-slate-400">Üye oyları</h3>
        <ul className="mt-2 divide-y divide-slate-100 rounded-2xl border border-slate-100 bg-white">
          {committee.members.map((m) => {
            const row = voteRows[m.userId];
            return (
              <li key={m.userId} className="px-4 py-3">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-slate-800">
                      {m.user.firstName} {m.user.lastName}
                    </p>
                    <p className="text-xs text-slate-400">{m.user.email}</p>
                  </div>
                  {row ? (
                    <span
                      className={`chip text-[10px] ${
                        row.vote === "approve"
                          ? "bg-green-50 text-green-700 border-green-100"
                          : "bg-red-50 text-red-700 border-red-100"
                      }`}
                    >
                      {COMMITTEE_VOTE_LABELS[row.vote]}
                    </span>
                  ) : (
                    <span className="chip text-[10px] bg-amber-50 text-amber-700 border-amber-100">
                      Oy vermedi
                    </span>
                  )}
                </div>
                {row && (
                  <p className="mt-1 text-[11px] text-slate-500">
                    {new Date(row.votedAt).toLocaleString("tr-TR")}
                    {row.reason && <> · "{row.reason}"</>}
                  </p>
                )}
              </li>
            );
          })}
        </ul>
        {Object.keys(voteRows).length === 0 && (
          <p className="mt-2 text-xs text-slate-400">
            Bireysel oylar yalnızca bu oturumda oy kullanıldıkça görünür; kalıcı okuma ucu
            sözleşmede yok.
          </p>
        )}
      </div>

      {isMember && isPendingStep && (
        <div className="mt-5 rounded-2xl border border-violet-100 bg-white p-4">
          <h3 className="text-sm font-bold text-slate-900">Oyunuz</h3>
          {locked ? (
            <p className="mt-2 text-sm text-slate-500">
              {step.status !== "pending"
                ? "Bu kademe kararı kesinleşti — oy değiştirilemez."
                : "Kurul kararı kesinleşti — oy değiştirilemez."}
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
