export type DateFormatPreset =
  "date" | "datetime" | "time" | "medium" | "long" | "full" | "relative";

export interface FormatDateOptions {
  preset?: DateFormatPreset;
  pattern?: string;
  timezone?: string;
  locale?: string;
  fallback?: string;
}

export const DEFAULT_DATE_FORMAT = "DD/MM/YYYY";
export const DEFAULT_LOCALE = "pt-PT";

function toValidDate(
  value: Date | string | number | null | undefined,
): Date | null {
  if (value === undefined || value === null || value === "") return null;
  if (value instanceof Date) return isNaN(value.getTime()) ? null : value;

  if (typeof value === "string") {
    const isoOnly = value.trim().match(/^(\d{4})-(d{2})-(d{2})$/);
    if (isoOnly) {
      const d = new Date(
        Number(isoOnly[1]),
        Number(isoOnly[2]) - 1,
        Number(isoOnly[3]),
      );
      return isNaN(d.getTime()) ? null : d;
    }
  }

  const d = new Date(value);
  return isNaN(d.getTime()) ? null : d;
}

export function isValidCalendarDate(
  year: number,
  month: number,
  day: number,
): boolean {
  if (isNaN(year) || isNaN(month) || isNaN(day)) return false;
  if (year < 1000 || year > 9999) return false;
  if (month < 1 || month > 12) return false;
  return day >= 1 && day <= new Date(year, month, 0).getDate();
}

export function formatDate(
  value: Date | string | number | null | undefined,
  options?: DateFormatPreset | FormatDateOptions,
): string {
  const opts: FormatDateOptions =
    typeof options === "string"
      ? { preset: options }
      : (options ?? { preset: "date" });
  const fallback = opts.fallback ?? "-";

  const d = toValidDate(value);
  if (!d) return fallback;

  const locale = opts.locale ?? DEFAULT_LOCALE;
  const preset = opts.preset ?? "date";

  switch (preset) {
    case "relative":
      return formatRelativeTime(d, locale);
    case "medium":
    case "long":
    case "full": {
      const timeStyle = preset === "full" ? "short" : undefined;
      try {
        return new Intl.DateTimeFormat(locale, {
          timeZone: opts.timezone,
          dateStyle: preset,
          timeStyle,
        }).format(d);
      } catch {
        return new Intl.DateTimeFormat(locale, { dateStyle: preset }).format(d);
      }
    }
  }

  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: opts.timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(d);

  const map: Record<string, string> = {};
  for (const part of parts) map[part.type] = part.value;

  const year = map.year ?? "";
  const month = map.month ?? "";
  const day = map.day ?? "";
  const hour = (map.hour === "24" ? "00" : map.hour) ?? "00";
  const minute = map.minute ?? "00";
  const second = map.second ?? "00";

  if (preset === "time") return `${hour}:${minute}`;

  const basePattern = opts.pattern ?? DEFAULT_DATE_FORMAT;
  const mask =
    preset === "datetime" && !opts.pattern
      ? `${basePattern} ${hour}:${minute}`
      : basePattern;

  return mask
    .replace(/YYYY/g, year)
    .replace(/YY/g, year.slice(-2))
    .replace(/MM/g, month)
    .replace(/DD/g, day)
    .replace(/HH/g, hour)
    .replace(/mm/g, minute)
    .replace(/ss/g, second);
}

export function formatDateTime(
  value: Date | string | number | null | undefined,
  fallback = "-",
) {
  return formatDate(value, { preset: "datetime", fallback });
}

export function formatNumber(
  value: number | string | null | undefined,
  options?: Intl.NumberFormatOptions,
  locale = DEFAULT_LOCALE,
): string {
  if (value == null || value === "") return "-";
  const num = typeof value === "number" ? value : Number(value);
  if (isNaN(num)) return "-";
  return new Intl.NumberFormat(locale, options).format(num);
}

export function formatRelativeTime(
  value: Date | string | number | null | undefined,
  locale = DEFAULT_LOCALE,
): string {
  const d = toValidDate(value);
  if (!d) return "-";

  const diffSecs = Math.round((d.getTime() - Date.now()) / 1000);
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });

  const absSecs = Math.abs(diffSecs);
  if (absSecs < 60) return rtf.format(diffSecs, "seconds");
  const diffMins = Math.round(diffSecs / 60);
  if (Math.abs(diffMins) < 60) return rtf.format(diffMins, "minutes");
  const diffHours = Math.round(diffMins / 60);
  if (Math.abs(diffHours) < 24) return rtf.format(diffHours, "hours");
  const diffDays = Math.round(diffHours / 24);
  if (Math.abs(diffDays) < 30) return rtf.format(diffDays, "days");
  const diffMonths = Math.round(diffDays / 30);
  if (Math.abs(diffMonths) < 12) return rtf.format(diffMonths, "months");
  const diffYears = Math.round(diffMonths / 12);
  return rtf.format(diffYears, "years");
}

export function parseToIsoDate(
  input: string | null | undefined,
  pattern = DEFAULT_DATE_FORMAT,
): string | null {
  if (!input || typeof input !== "string") return null;
  const trimmed = input.trim();
  if (!trimmed) return null;

  const isoMatch = trimmed.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (isoMatch) {
    const y = Number(isoMatch[1]);
    const m = Number(isoMatch[2]);
    const d = Number(isoMatch[3]);
    if (isValidCalendarDate(y, m, d)) {
      return `${String(y).padStart(4, "0")}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    }
  }

  const parts = trimmed.split(/[/.-]/);
  if (parts.length !== 3) return null;
  let y = 0;
  let m = 0;
  let d = 0;

  const nums = parts.map(Number);
  const p0 = nums[0] ?? 0;
  const p1 = nums[1] ?? 0;
  const p2 = nums[2] ?? 0;

  if (pattern.startsWith("YYYY")) {
    [y, m, d] = [p0, p1, p2];
  } else if (pattern.startsWith("MM")) {
    [m, d, y] = [p0, p1, p2];
  } else {
    [d, m, y] = [p0, p1, p2];
  }

  if (!isValidCalendarDate(y, m, d)) return null;
  return `${String(y).padStart(4, "0")}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}
