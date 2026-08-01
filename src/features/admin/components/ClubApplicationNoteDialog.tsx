import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Modal from "@/shared/ui/Modal";
import { getErrorMessage } from "@/shared/api/client";

const noteSchema = z.object({
  note: z
    .string()
    .trim()
    .min(10, "Gerekçe en az 10 karakter olmalıdır.")
    .max(1000, "En fazla 1000 karakter."),
});

type NoteFormValues = z.infer<typeof noteSchema>;

type NoteDialogVariant = "reject" | "revision";

const COPY: Record<
  NoteDialogVariant,
  { title: (name: string) => string; description: string; label: string; placeholder: string; confirm: string; tone: string }
> = {
  reject: {
    title: (name) => `"${name}" reddedilsin mi?`,
    description:
      "Kulüp oluşturulmaz; başvuran daha sonra yeniden başvurabilir. Ret gerekçesi zorunludur.",
    label: "Ret gerekçesi",
    placeholder: "Başvuranın neyi düzeltmesi gerektiğini açıklayın…",
    confirm: "Reddet",
    tone: "btn-secondary border-red-200 text-red-600 hover:bg-red-50",
  },
  revision: {
    title: (name) => `"${name}" için revizyon istensin mi?`,
    description:
      "Başvuru reddedilmez; öğrenci aynı kaydı düzenleyip yeniden gönderir. Düzeltme talebini ayrıntılı yazın — öğrenci bu metni okuyacak.",
    label: "Revizyon talebi / düzeltme notu",
    placeholder:
      "Eksik evrak, isim uyumu, tüzük maddesi gibi somut düzeltmeleri madde madde yazın…",
    confirm: "Revizyon İste",
    tone: "btn-secondary border-violet-200 text-violet-700 hover:bg-violet-50",
  },
};

interface ClubApplicationNoteDialogProps {
  variant: NoteDialogVariant;
  open: boolean;
  clubName: string;
  loading: boolean;
  error: unknown;
  onConfirm: (note: string) => void;
  onClose: () => void;
}

export default function ClubApplicationNoteDialog({
  variant,
  open,
  clubName,
  loading,
  error,
  onConfirm,
  onClose,
}: ClubApplicationNoteDialogProps) {
  const copy = COPY[variant];
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<NoteFormValues>({
    resolver: zodResolver(noteSchema),
    defaultValues: { note: "" },
  });

  useEffect(() => {
    if (!open) reset({ note: "" });
  }, [open, reset]);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={copy.title(clubName)}
      description={copy.description}
      size="lg"
      footer={
        <>
          <button type="button" className="btn-ghost" onClick={onClose} disabled={loading}>
            Vazgeç
          </button>
          <button
            type="submit"
            form="application-note-form"
            className={copy.tone}
            disabled={loading}
          >
            {loading ? "Kaydediliyor…" : copy.confirm}
          </button>
        </>
      }
    >
      <form
        id="application-note-form"
        onSubmit={handleSubmit((values) => onConfirm(values.note))}
        className="space-y-3"
      >
        <div>
          <label htmlFor="application-note" className="input-label">
            {copy.label}
          </label>
          <textarea
            id="application-note"
            rows={6}
            className="input-field min-h-[9rem] resize-y"
            placeholder={copy.placeholder}
            {...register("note")}
          />
          {errors.note && <p className="input-error">{errors.note.message}</p>}
          <p className="mt-1 text-[11px] text-slate-400">En az 10 karakter. Öğrenci bu metni başvuru ekranında görür.</p>
        </div>
        {error ? (
          <div className="alert-error text-sm">{getErrorMessage(error, "Karar kaydedilemedi.")}</div>
        ) : null}
      </form>
    </Modal>
  );
}
