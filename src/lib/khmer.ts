/**
 * Khmer language helpers — numerals, dates and countdown labels.
 *
 * Every date is formatted in an explicit time zone (Cambodia by default) so the
 * server-rendered HTML and the browser always agree, whatever device the guest
 * is using.
 */

const KHMER_DIGITS = ["០", "១", "២", "៣", "៤", "៥", "៦", "៧", "៨", "៩"];

export const WEDDING_TIMEZONE = process.env.NEXT_PUBLIC_TIMEZONE || "Asia/Phnom_Penh";

/** 25 → ២៥ */
export function toKhmerNumber(value: number | string): string {
  return String(value).replace(/\d/g, (d) => KHMER_DIGITS[Number(d)]);
}

/** Pads to two digits then converts: 7 → ០៧ */
export function toKhmerNumber2(value: number): string {
  return toKhmerNumber(String(value).padStart(2, "0"));
}

export const KHMER_MONTHS = [
  "មករា", "កុម្ភៈ", "មីនា", "មេសា", "ឧសភា", "មិថុនា",
  "កក្កដា", "សីហា", "កញ្ញា", "តុលា", "វិច្ឆិកា", "ធ្នូ",
];

export const KHMER_WEEKDAYS = [
  "ថ្ងៃអាទិត្យ", "ថ្ងៃចន្ទ", "ថ្ងៃអង្គារ", "ថ្ងៃពុធ",
  "ថ្ងៃព្រហស្បតិ៍", "ថ្ងៃសុក្រ", "ថ្ងៃសៅរ៍",
];

const WEEKDAY_INDEX: Record<string, number> = {
  Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6,
};

/** Calendar parts of a date as seen in the wedding’s time zone. */
export function zonedParts(date: Date) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: WEDDING_TIMEZONE,
    weekday: "short",
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    hour12: false,
  }).formatToParts(date);

  const get = (type: string) => parts.find((part) => part.type === type)?.value ?? "";

  return {
    weekday: WEEKDAY_INDEX[get("weekday")] ?? 0,
    year: Number(get("year")),
    month: Number(get("month")),
    day: Number(get("day")),
    hour: Number(get("hour")) % 24,
    minute: Number(get("minute")),
  };
}

/** “ថ្ងៃសៅរ៍ ទី ២៥ ខែ មេសា ឆ្នាំ ២០២៧” */
export function formatKhmerDate(date: Date): string {
  const { weekday, day, month, year } = zonedParts(date);
  return `${KHMER_WEEKDAYS[weekday]} ទី ${toKhmerNumber(day)} ខែ ${KHMER_MONTHS[month - 1]} ឆ្នាំ ${toKhmerNumber(year)}`;
}

const LATIN_WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const LATIN_MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

/**
 * Gregorian date in Latin script, e.g. “Saturday, 25 April 2027”.
 * Built by hand rather than with Intl.format so that the server HTML and the
 * browser always produce byte-identical text (ICU versions differ subtly).
 */
export function formatLatinDate(date: Date): string {
  const { weekday, day, month, year } = zonedParts(date);
  return `${LATIN_WEEKDAYS[weekday]}, ${day} ${LATIN_MONTHS[month - 1]} ${year}`;
}

/** Buddhist era year (Gregorian + 544). */
export function buddhistEra(date: Date): string {
  return `ព.ស. ${toKhmerNumber(zonedParts(date).year + 544)}`;
}

/** “វេលាម៉ោង ០៥:៣០ នាទីល្ងាច” */
export function formatKhmerTime(date: Date): string {
  const { hour, minute } = zonedParts(date);
  const suffix = hour < 12 ? "នាទីព្រឹក" : hour < 17 ? "នាទីរសៀល" : "នាទីល្ងាច";
  const hour12 = hour % 12 === 0 ? 12 : hour % 12;
  return `វេលាម៉ោង ${toKhmerNumber2(hour12)}:${toKhmerNumber2(minute)} ${suffix}`;
}

export const COUNTDOWN_LABELS = {
  days: "ថ្ងៃ",
  hours: "ម៉ោង",
  minutes: "នាទី",
  seconds: "វិនាទី",
} as const;
