import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getClubApplicationChecklist,
  updateClubApplicationChecklistItem,
} from "@/features/admin/api";
import { getErrorMessage } from "@/shared/api/client";
import type { ApplicationStatus } from "@/shared/types";

interface Props {
  universityId: string;
  applicationId: string;
  applicationStatus: ApplicationStatus;
}

export default function ClubApplicationChecklistSection({
  universityId,
  applicationId,
  applicationStatus,
}: Props) {
  const queryClient = useQueryClient();
  const editable = applicationStatus === "pending" || applicationStatus === "revision_requested";
  const [itemError, setItemError] = useState<string | null>(null);

  const checklistQuery = useQuery({
    queryKey: ["admin", universityId, "club-application-checklist", applicationId],
    queryFn: () => getClubApplicationChecklist(universityId, applicationId),
  });

  const updateMutation = useMutation({
    mutationFn: ({
      itemKey,
      checked,
      note,
    }: {
      itemKey: string;
      checked: boolean;
      note?: string;
    }) => updateClubApplicationChecklistItem(universityId, applicationId, itemKey, { checked, note }),
    onSuccess: (data) => {
      queryClient.setQueryData(
        ["admin", universityId, "club-application-checklist", applicationId],
        data
      );
      setItemError(null);
    },
    onError: (error) => setItemError(getErrorMessage(error, "Madde güncellenemedi.")),
  });

  if (checklistQuery.isLoading) {
    return (
      <section className="card p-5">
        <div className="skeleton h-6 w-48" />
        <div className="mt-4 space-y-3">
          <div className="skeleton h-14 w-full" />
          <div className="skeleton h-14 w-full" />
        </div>
      </section>
    );
  }

  if (checklistQuery.isError || !checklistQuery.data) {
    return (
      <section className="card p-5">
        <div className="alert-error">
          {getErrorMessage(checklistQuery.error, "Kontrol listesi yüklenemedi.")}
        </div>
      </section>
    );
  }

  const { items } = checklistQuery.data;

  if (items.length === 0) {
    return null;
  }

  return (
    <section className="card p-5">
      <h2 className="font-display text-base font-bold text-slate-900">İnceleme kontrol listesi</h2>
      <p className="mt-1 text-sm text-slate-500">
        Tenant kataloğundaki maddeler — her işaretleme denetim izine düşer.
      </p>

      {itemError && <div className="alert-error mt-4 text-sm">{itemError}</div>}

      <ul className="mt-4 space-y-4">
        {items.map((item) => (
          <li key={item.key} className="rounded-xl border border-slate-100 bg-slate-50/50 p-4">
            <label className="flex cursor-pointer items-start gap-3">
              <input
                type="checkbox"
                className="mt-1 h-4 w-4 rounded border-slate-300 text-brand-600"
                checked={item.checked}
                disabled={!editable || updateMutation.isPending}
                onChange={(e) =>
                  updateMutation.mutate({
                    itemKey: item.key,
                    checked: e.target.checked,
                    note: item.note ?? undefined,
                  })
                }
              />
              <span className="min-w-0 flex-1">
                <span className="text-sm font-semibold text-slate-900">
                  {item.label}
                  {item.required && (
                    <span className="ml-1.5 text-[10px] font-bold uppercase text-red-500">
                      Zorunlu
                    </span>
                  )}
                </span>
                {item.checked && item.checkedBy && item.checkedAt && (
                  <p className="mt-1 text-[11px] text-slate-400">
                    {item.checkedBy.firstName} {item.checkedBy.lastName} ·{" "}
                    {new Date(item.checkedAt).toLocaleString("tr-TR")}
                  </p>
                )}
              </span>
            </label>
            <div className="mt-3 pl-7">
              <label className="input-label text-xs" htmlFor={`checklist-note-${item.key}`}>
                Not (opsiyonel)
              </label>
              <textarea
                id={`checklist-note-${item.key}`}
                rows={2}
                className="input-field mt-1 text-sm"
                defaultValue={item.note ?? ""}
                disabled={!editable || updateMutation.isPending}
                onBlur={(e) => {
                  const note = e.target.value.trim();
                  if (note === (item.note ?? "")) return;
                  updateMutation.mutate({
                    itemKey: item.key,
                    checked: item.checked,
                    note: note || undefined,
                  });
                }}
              />
            </div>
          </li>
        ))}
      </ul>

      {!editable && (
        <p className="mt-3 text-xs text-slate-400">
          Bu başvuru durumunda kontrol listesi düzenlenemez.
        </p>
      )}
    </section>
  );
}
