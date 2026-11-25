/**
 * Guests' honorifics (ងារ): the built-in ones, plus any the couple adds
 * (`wedding.guestTitles`).
 */
export const DEFAULT_GUEST_TITLES = ["លោក", "លោកស្រី", "កញ្ញា", "អ្នកនាង", "ឯកឧត្តម", "លោកជំទាវ", "លោកគ្រូ", "អ្នកគ្រូ"];
export const MAX_CUSTOM_TITLES = 30;

/** Built-in first, then the couple's own, without repeats or blanks. */
export function guestTitleList(custom: unknown): string[] {
  const extra = Array.isArray(custom) ? custom.filter((t): t is string => typeof t === "string") : [];
  const out: string[] = [];
  for (const t of [...DEFAULT_GUEST_TITLES, ...extra]) {
    const v = t.trim().replace(/\s+/g, " ");
    if (v && !out.includes(v)) out.push(v);
  }
  return out;
}

/** "លោក ដារ៉ា", or just "ដារ៉ា" when the guest has no title. */
export function guestDisplayName(g: { title?: string | null; name: string }): string {
  return [g.title?.trim(), g.name.trim()].filter(Boolean).join(" ");
}

/** The value a picker uses for "no title". */
export const NO_TITLE = "";

export type ParsedGuestLine = { title: string; name: string; seats: number };

/**
 * One guest per line: `[ងារ] ឈ្មោះ, ចំនួនកៅអី`. A line that starts with a known
 * title (followed by a space) uses it; any other line takes `fallback`. The
 * longest title wins, so "លោកស្រី ដារ៉ា" is លោកស្រី, not លោក.
 */
export function parseGuestLines(text: string, titles: string[], fallback: string): ParsedGuestLine[] {
  const byLength = [...titles].sort((a, b) => b.length - a.length);
  const out: ParsedGuestLine[] = [];
  for (const line of text.split("\n")) {
    const [rawName = "", seats] = line.split(/[,\t;]/).map((part) => part.trim());
    let name = rawName.replace(/\s+/g, " ");
    if (!name) continue;
    let title = fallback;
    const hit = byLength.find((t) => name.startsWith(t + " "));
    if (hit) {
      title = hit;
      name = name.slice(hit.length).trim();
      if (!name) continue;
    }
    out.push({ title, name: name.slice(0, 160), seats: Math.min(20, Math.max(1, Number(seats) || 1)) });
  }
  return out;
}
