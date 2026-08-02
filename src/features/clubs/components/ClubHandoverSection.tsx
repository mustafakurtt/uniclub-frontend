import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { formatActivityDateTime } from "@/features/activities/formatActivityDateTime";
import { createHandoverRecord, getHandoverRecord } from "@/features/clubs/api/clubPanel";
import { listGeneralMeetings } from "@/features/clubs/api/generalMeetings";
import HandoverRecordDetail from "@/features/clubs/components/HandoverRecordDetail";
import { GENERAL_MEETING_TYPE_LABELS } from "@/features/clubs/generalMeetingLabels";
import { useTenantTimezone } from "@/features/auth/hooks/useTenantTimezone";
import { getErrorMessage } from "@/shared/api/client";
import Modal from "@/shared/ui/Modal";
import SelectField from "@/shared/ui/SelectField";
import EmptyState from "@/shared/ui/EmptyState";
import { Icon } from "@/shared/ui/Icon";
import type { HandoverRecord } from "@/shared/types";

const schema = z.object({
  generalMeetingId: z.string().uuid("Geçerli bir genel kurul seçin."),
});

type FormValues = z.infer<typeof schema>;

interface Props {
  clubId: string;
  universityId: string;
  records: HandoverRecord[];
  canCreate: boolean;
  isLoading: boolean;
}

export default function ClubHandoverSection({
  clubId,
  universityId,
  records,
  canCreate,
  isLoading,
}: Props) {
  const timezone = useTenantTimezone();
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const meetingsQuery = useQuery({
    queryKey: ["clubs", clubId, "general-meetings"],
    queryFn: () => listGeneralMeetings(clubId),
    enabled: createOpen,
  });

  const detailQuery = useQuery({
    queryKey: ["clubs", clubId, "handover-records", selectedId],
    queryFn: () => getHandoverRecord(clubId, selectedId!),
    enabled: !!selectedId,
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const createMutation = useMutation({
    mutationFn: (values: FormValues) => createHandoverRecord(clubId, values),
    onSuccess: (record) => {
      queryClient.invalidateQueries({ queryKey: ["clubs", clubId, "handover-records"] });
      queryClient.invalidateQueries({ queryKey: ["clubs", clubId, "current-board"] });
      queryClient.invalidateQueries({ queryKey: ["clubs", clubId] });
      setCreateOpen(false);
      reset();
      setSelectedId(record.id);
    },
  });

  const meetings = meetingsQuery.data ?? [];

  return (
    <section className="card p-6">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-lg font-extrabold text-slate-900">Devir teslim</h2>
          <p className="mt-1 text-sm text-slate-500">
            Dönemsel görev devri genel kurul kararına bağlanır — kayıt oluştururken ilgili
            toplantıyı seçmen gerekir.
          </p>
        </div>
        {canCreate && (
          <button type="button" className="btn-primary text-sm" onClick={() => setCreateOpen(true)}>
            <Icon name="add" size={14} /> Devir kaydı oluştur
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-2">
          <div className="skeleton h-12 w-full" />
          <div className="skeleton h-12 w-full" />
        </div>
      ) : records.length === 0 ? (
        <EmptyState
          icon="archive"
          title="Henüz devir teslim kaydı yok"
          description={
            canCreate
              ? "Genel kurulda kurul seçimi yaptıktan sonra devir teslim kaydını buradan oluşturabilirsin."
              : "Kulüp yetkilileri devir teslim kayıtlarını burada görür."
          }
        />
      ) : (
        <ul className="divide-y divide-slate-100">
          {records.map((record) => (
            <li key={record.id}>
              <button
                type="button"
                onClick={() => setSelectedId(record.id === selectedId ? null : record.id)}
                className="flex w-full items-center justify-between gap-3 py-3 text-left transition hover:bg-slate-50/80"
              >
                <div>
                  <p className="font-semibold text-slate-900">
                    {record.academicTerm?.name ?? "Dönem"} ·{" "}
                    {formatActivityDateTime(record.handoverAt, timezone)}
                  </p>
                  {record.generalMeeting && (
                    <p className="text-xs text-slate-500">
                      {GENERAL_MEETING_TYPE_LABELS[record.generalMeeting.meetingType]} genel kurul
                    </p>
                  )}
                </div>
                <Icon
                  name={selectedId === record.id ? "chevronDown" : "chevronRight"}
                  size={18}
                  className="shrink-0 text-slate-400"
                />
              </button>
              {selectedId === record.id && detailQuery.data && (
                <div className="pb-4">
                  <HandoverRecordDetail universityId={universityId} record={detailQuery.data} />
                </div>
              )}
              {selectedId === record.id && detailQuery.isLoading && (
                <div className="skeleton mb-4 h-32 w-full" />
              )}
            </li>
          ))}
        </ul>
      )}

      <Modal
        open={createOpen}
        onClose={() => {
          setCreateOpen(false);
          createMutation.reset();
          reset();
        }}
        title="Devir teslim kaydı"
        description="Devir teslim yalnızca kurul seçimi yapılmış bir genel kurul toplantısına bağlanabilir. Bu alan boş bırakılamaz."
        footer={
          <>
            <button type="button" className="btn-secondary" onClick={() => setCreateOpen(false)}>
              İptal
            </button>
            <button
              type="submit"
              form="create-handover-form"
              className="btn-primary"
              disabled={createMutation.isPending}
            >
              {createMutation.isPending ? "Kaydediliyor…" : "Kaydı oluştur"}
            </button>
          </>
        }
      >
        <form
          id="create-handover-form"
          onSubmit={handleSubmit((v) => createMutation.mutate(v))}
          className="space-y-4"
        >
          <div>
            <label htmlFor="generalMeetingId" className="input-label">
              Genel kurul toplantısı <span className="text-red-500">*</span>
            </label>
            <SelectField
              id="generalMeetingId"
              {...register("generalMeetingId")}
              className="input-field mt-1"
              disabled={meetingsQuery.isLoading}
            >
              <option value="">Toplantı seçin…</option>
              {meetings.map((m) => (
                <option key={m.id} value={m.id}>
                  {GENERAL_MEETING_TYPE_LABELS[m.meetingType]} ·{" "}
                  {formatActivityDateTime(m.heldAt, timezone)} · {m.location}
                </option>
              ))}
            </SelectField>
            {errors.generalMeetingId && (
              <p className="input-error mt-1">{errors.generalMeetingId.message}</p>
            )}
            <p className="mt-2 text-xs text-slate-500">
              Seçilen toplantıda kurul üyesi tanımlı olmalıdır. Aynı toplantı için yalnızca bir
              devir kaydı oluşturulabilir.
            </p>
          </div>
          {createMutation.isError && (
            <div className="alert-error text-sm">
              {getErrorMessage(createMutation.error, "Devir kaydı oluşturulamadı.")}
            </div>
          )}
        </form>
      </Modal>
    </section>
  );
}
