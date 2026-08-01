import { useEffect, useMemo, useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createGeneralMeeting } from "@/features/clubs/api/generalMeetings";
import {
  BOARD_SEAT_TYPE_LABELS,
  BOARD_TITLE_LABELS,
  BOARD_TYPE_LABELS,
  GENERAL_MEETING_TYPE_LABELS,
  quorumRequiredCount,
} from "@/features/clubs/generalMeetingLabels";
import { useTenantTimezone } from "@/features/auth/hooks/useTenantTimezone";
import { listAcademicTerms } from "@/features/universities/api/academicTerms";
import { getTenantSettings } from "@/features/universities/api/tenantSettings";
import { getErrorMessage } from "@/shared/api/client";
import { localDatetimeToIsoOffset } from "@/shared/lib/tenantLocalDatetime";
import Modal from "@/shared/ui/Modal";
import { Icon } from "@/shared/ui/Icon";
import type { BoardMemberInput, ClubMemberRow } from "@/shared/types";

const boardMemberSchema = z.object({
  userId: z.string().uuid(),
  boardType: z.enum(["management", "audit"]),
  seatType: z.enum(["principal", "alternate"]),
  title: z.enum(["president", "vice_president", "secretary", "treasurer", "member"]),
});

const formSchema = z.object({
  academicTermId: z.string().uuid("Akademik dönem seçiniz."),
  meetingType: z.enum(["ordinary", "extraordinary"]),
  heldAtLocal: z.string().min(1, "Tarih ve saat zorunludur."),
  location: z.string().trim().min(1, "Yer zorunludur.").max(256),
  decisions: z.string().trim().min(1, "Alınan kararlar zorunludur.").max(10000),
  attendeeUserIds: z.array(z.string().uuid()).min(1, "En az bir katılımcı seçiniz."),
  boardMembers: z.array(boardMemberSchema),
});

type FormValues = z.infer<typeof formSchema>;

interface Props {
  open: boolean;
  universityId: string;
  clubId: string;
  approvedMembers: ClubMemberRow[];
  onClose: () => void;
  onCreated?: (meetingId: string) => void;
}

export default function CreateGeneralMeetingModal({
  open,
  universityId,
  clubId,
  approvedMembers: membersProp,
  onClose,
  onCreated,
}: Props) {
  const queryClient = useQueryClient();
  const timezone = useTenantTimezone();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const termsQuery = useQuery({
    queryKey: ["admin", universityId, "academic-terms"],
    queryFn: () => listAcademicTerms(universityId),
    enabled: open,
  });

  const settingsQuery = useQuery({
    queryKey: ["admin", universityId, "tenant-settings"],
    queryFn: () => getTenantSettings(universityId),
    enabled: open,
    retry: false,
  });

  const {
    register,
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      academicTermId: "",
      meetingType: "ordinary",
      heldAtLocal: "",
      location: "",
      decisions: "",
      attendeeUserIds: [],
      boardMembers: [],
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: "boardMembers" });

  useEffect(() => {
    if (!open) return;
    reset({
      academicTermId: "",
      meetingType: "ordinary",
      heldAtLocal: "",
      location: "",
      decisions: "",
      attendeeUserIds: [],
      boardMembers: [],
    });
    setSubmitError(null);
  }, [open, reset]);

  const members = useMemo(
    () => membersProp.filter((m) => m.status === "approved"),
    [membersProp]
  );

  const attendeeIds = watch("attendeeUserIds");
  const quorumPercent =
    (settingsQuery.data?.["club.general_meeting.quorum_percent"]?.value as number | undefined) ??
    50;
  const quorumRequired = quorumRequiredCount(members.length, quorumPercent);

  const mutation = useMutation({
    mutationFn: (values: FormValues) =>
      createGeneralMeeting(clubId, {
        academicTermId: values.academicTermId,
        meetingType: values.meetingType,
        heldAt: localDatetimeToIsoOffset(values.heldAtLocal, timezone),
        location: values.location,
        decisions: values.decisions,
        attendeeUserIds: values.attendeeUserIds,
        boardMembers: values.boardMembers as BoardMemberInput[],
      }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["clubs", clubId, "general-meetings"] });
      queryClient.invalidateQueries({ queryKey: ["clubs", clubId] });
      queryClient.invalidateQueries({ queryKey: ["club", clubId, "membership-history"] });
      queryClient.invalidateQueries({ queryKey: ["auth", "clubMemberships"] });
      onCreated?.(data.id);
      onClose();
    },
    onError: (e) => setSubmitError(getErrorMessage(e, "Genel kurul kaydı oluşturulamadı.")),
  });

  const toggleAttendee = (userId: string) => {
    const current = watch("attendeeUserIds");
    if (current.includes(userId)) {
      setValue(
        "attendeeUserIds",
        current.filter((id) => id !== userId),
        { shouldValidate: true }
      );
    } else {
      setValue("attendeeUserIds", [...current, userId], { shouldValidate: true });
    }
  };

  const selectAllAttendees = () => {
    setValue(
      "attendeeUserIds",
      members.map((m) => m.userId),
      { shouldValidate: true }
    );
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Genel kurul kaydı"
      description="Toplantı tutanağını ve kurul seçimini kaydedin. Yeter sayı bilgisi yalnızca bilgilendirme amaçlıdır."
      size="lg"
      footer={
        <>
          <button type="button" className="btn-ghost" onClick={onClose} disabled={isSubmitting}>
            Vazgeç
          </button>
          <button
            type="submit"
            form="create-general-meeting-form"
            className="btn-primary"
            disabled={isSubmitting || mutation.isPending}
          >
            {mutation.isPending ? "Kaydediliyor…" : "Kaydet"}
          </button>
        </>
      }
    >
      <form
        id="create-general-meeting-form"
        className="space-y-5"
        onSubmit={handleSubmit((v) => {
          setSubmitError(null);
          mutation.mutate(v);
        })}
      >
        {submitError && <div className="alert-error text-sm">{submitError}</div>}

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="input-label" htmlFor="gm-term">
              Akademik dönem
            </label>
            <select
              id="gm-term"
              className="input-field"
              {...register("academicTermId")}
              disabled={termsQuery.isLoading}
            >
              <option value="">Seçiniz…</option>
              {(termsQuery.data ?? []).map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                  {t.isActive ? " (aktif)" : ""}
                </option>
              ))}
            </select>
            {errors.academicTermId && <p className="input-error">{errors.academicTermId.message}</p>}
          </div>
          <div>
            <label className="input-label" htmlFor="gm-type">
              Toplantı türü
            </label>
            <select id="gm-type" className="input-field" {...register("meetingType")}>
              {(Object.keys(GENERAL_MEETING_TYPE_LABELS) as Array<keyof typeof GENERAL_MEETING_TYPE_LABELS>).map(
                (k) => (
                  <option key={k} value={k}>
                    {GENERAL_MEETING_TYPE_LABELS[k]}
                  </option>
                )
              )}
            </select>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="input-label" htmlFor="gm-held-at">
              Tarih ve saat
            </label>
            <input id="gm-held-at" type="datetime-local" className="input-field" {...register("heldAtLocal")} />
            {errors.heldAtLocal && <p className="input-error">{errors.heldAtLocal.message}</p>}
          </div>
          <div>
            <label className="input-label" htmlFor="gm-location">
              Yer
            </label>
            <input id="gm-location" className="input-field" {...register("location")} />
            {errors.location && <p className="input-error">{errors.location.message}</p>}
          </div>
        </div>

        <div>
          <label className="input-label" htmlFor="gm-decisions">
            Alınan kararlar
          </label>
          <textarea
            id="gm-decisions"
            rows={8}
            className="input-field min-h-[10rem] resize-y"
            {...register("decisions")}
          />
          {errors.decisions && <p className="input-error">{errors.decisions.message}</p>}
        </div>

        <section className="space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <label className="input-label mb-0">Katılımcılar</label>
            <button type="button" className="btn-ghost text-xs" onClick={selectAllAttendees}>
              Tüm onaylı üyeleri seç
            </button>
          </div>
          <div
            className={`rounded-2xl border p-3 text-sm ${
              attendeeIds.length >= quorumRequired
                ? "border-emerald-200 bg-emerald-50/60 text-emerald-800"
                : "border-amber-200 bg-amber-50/60 text-amber-800"
            }`}
          >
            Yeter sayı bilgisi: %{quorumPercent} → en az <strong>{quorumRequired}</strong> katılımcı
            gerekir (toplam {members.length} onaylı üye). Seçili:{" "}
            <strong>{attendeeIds.length}</strong>. Kayıt backend tarafından doğrulanır.
          </div>
          <div className="max-h-40 overflow-y-auto rounded-2xl border border-slate-100">
            {members.map((m) => (
              <label
                key={m.userId}
                className="flex cursor-pointer items-center gap-3 border-b border-slate-50 px-3 py-2 last:border-0 hover:bg-slate-50"
              >
                <input
                  type="checkbox"
                  checked={attendeeIds.includes(m.userId)}
                  onChange={() => toggleAttendee(m.userId)}
                />
                <span className="text-sm text-slate-800">
                  {m.user.firstName} {m.user.lastName}
                </span>
              </label>
            ))}
          </div>
          {errors.attendeeUserIds && <p className="input-error">{errors.attendeeUserIds.message}</p>}
        </section>

        <section className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <label className="input-label mb-0">Kurul seçimi (isteğe bağlı)</label>
            <button
              type="button"
              className="btn-ghost text-xs"
              onClick={() =>
                append({
                  userId: members[0]?.userId ?? "",
                  boardType: "management",
                  seatType: "principal",
                  title: "member",
                })
              }
              disabled={members.length === 0}
            >
              <Icon name="add" size={14} /> Satır ekle
            </button>
          </div>
          {fields.map((field, index) => (
            <div
              key={field.id}
              className="grid gap-2 rounded-2xl border border-slate-100 bg-white/80 p-3 sm:grid-cols-5"
            >
              <select className="input-field text-sm" {...register(`boardMembers.${index}.userId`)}>
                {members.map((m) => (
                  <option key={m.userId} value={m.userId}>
                    {m.user.firstName} {m.user.lastName}
                  </option>
                ))}
              </select>
              <select className="input-field text-sm" {...register(`boardMembers.${index}.boardType`)}>
                {(Object.keys(BOARD_TYPE_LABELS) as Array<keyof typeof BOARD_TYPE_LABELS>).map((k) => (
                  <option key={k} value={k}>
                    {BOARD_TYPE_LABELS[k]}
                  </option>
                ))}
              </select>
              <select className="input-field text-sm" {...register(`boardMembers.${index}.seatType`)}>
                {(Object.keys(BOARD_SEAT_TYPE_LABELS) as Array<keyof typeof BOARD_SEAT_TYPE_LABELS>).map(
                  (k) => (
                    <option key={k} value={k}>
                      {BOARD_SEAT_TYPE_LABELS[k]}
                    </option>
                  )
                )}
              </select>
              <select className="input-field text-sm" {...register(`boardMembers.${index}.title`)}>
                {(Object.keys(BOARD_TITLE_LABELS) as Array<keyof typeof BOARD_TITLE_LABELS>).map((k) => (
                  <option key={k} value={k}>
                    {BOARD_TITLE_LABELS[k]}
                  </option>
                ))}
              </select>
              <button type="button" className="btn-ghost text-xs text-red-600" onClick={() => remove(index)}>
                Kaldır
              </button>
            </div>
          ))}
        </section>
      </form>
    </Modal>
  );
}
