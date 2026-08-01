/**
 * Tenant yerel duvar saati yardımcıları (zamanlanmış yayın sözleşmesi).
 *
 * `scheduledPublishAtLocal` = `YYYY-MM-DDTHH:mm` — offset/Z YOK.
 * Backend bu değeri kurumun IANA `timezone` alanıyla UTC'ye çevirir.
 *
 * ⚠️ Burada toISOString(), Date offset dönüşümü veya tarayıcı TZ'sine
 * kaydırma YAPMAYIN. Kullanıcının datetime-local'da gördüğü rakamları
 * olduğu gibi gönderin; "eksik" sanıp UTC'ye çevirmek yayın saatini bozar.
 */

const LOCAL_DATETIME_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/;

export function isValidScheduledPublishLocal(value: string): boolean {
  return LOCAL_DATETIME_RE.test(value);
}

interface ZonedParts {
  year: string;
  month: string;
  day: string;
  hour: string;
  minute: string;
}

function zonedParts(date: Date, timezone: string): ZonedParts {
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const map = Object.fromEntries(
    fmt.formatToParts(date).filter((p) => p.type !== "literal").map((p) => [p.type, p.value])
  );
  return {
    year: map.year,
    month: map.month,
    day: map.day,
    hour: map.hour,
    minute: map.minute,
  };
}

/** datetime-local `min` için — kurum saat diliminde "şimdi" (YYYY-MM-DDTHH:mm). */
export function tenantNowLocalDatetime(timezone: string): string {
  const p = zonedParts(new Date(), timezone);
  return `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}`;
}

/** UTC `scheduledPublishAt` yanıtını düzenleme formuna (tenant yerel) çevirir. */
export function scheduledUtcToTenantLocal(isoUtc: string, timezone: string): string {
  const p = zonedParts(new Date(isoUtc), timezone);
  return `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}`;
}

/** İstemci tarafı geçmiş kontrolü — tenant duvar saatine göre (sunucu yine doğrular). */
export function isTenantLocalDatetimeInPast(localValue: string, timezone: string): boolean {
  if (!isValidScheduledPublishLocal(localValue)) return true;
  return localValue < tenantNowLocalDatetime(timezone);
}

/**
 * datetime-local değerini ISO 8601'e çevirir (akademik dönem API — offset'li UTC).
 * Tenant timezone varsa duvar saati orada yorumlanır; yoksa tarayıcı TZ'si.
 */
export function localDatetimeToIsoOffset(localValue: string, timezone?: string | null): string {
  if (!isValidScheduledPublishLocal(localValue)) {
    throw new Error("Geçersiz tarih/saat");
  }
  if (!timezone) {
    return new Date(localValue).toISOString();
  }

  const [datePart, timePart] = localValue.split("T");
  const [y, mo, d] = datePart.split("-").map(Number);
  const [h, mi] = timePart.split(":").map(Number);
  const base = Date.UTC(y, mo - 1, d, h, mi);

  for (let offsetMin = -16 * 60; offsetMin <= 16 * 60; offsetMin += 1) {
    const candidate = new Date(base + offsetMin * 60_000);
    const p = zonedParts(candidate, timezone);
    const formatted = `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}`;
    if (formatted === localValue) {
      return candidate.toISOString();
    }
  }

  return new Date(localValue).toISOString();
}

/** Kısa saat dilimi etiketi — örn. "GMT+3", "TRT". */
export function formatTimezoneShortLabel(timezone: string, locale = "tr-TR"): string {
  try {
    const part = new Intl.DateTimeFormat(locale, {
      timeZone: timezone,
      timeZoneName: "short",
    })
      .formatToParts(new Date())
      .find((p) => p.type === "timeZoneName");
    return part?.value ?? timezone;
  } catch {
    return timezone;
  }
}
