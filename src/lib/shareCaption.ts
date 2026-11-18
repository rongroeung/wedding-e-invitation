/**
 * The message that goes with a guest's invitation link.
 *
 * The couple writes it once; placeholders fill in for each guest. Kept free
 * of server imports so the dashboard can preview it as it is typed.
 */
export const CAPTION_TOKENS = [
  { token: "{title}", label: "ងារ (លោក/លោកស្រី…)" },
  { token: "{name}", label: "ឈ្មោះភ្ញៀវ" },
  { token: "{couple}", label: "ឈ្មោះកូនកំលោះ & កូនក្រមុំ" },
  { token: "{date}", label: "កាលបរិច្ឆេទ" },
  { token: "{venue}", label: "ទីតាំង" },
  { token: "{address}", label: "អាសយដ្ឋាន" },
  { token: "{link}", label: "តំណអញ្ជើញ" },
] as const;

/** Used when the couple has not written their own. Placeholders only, no invented details. */
export const DEFAULT_CAPTION =
  "សូមគោរពអញ្ជើញ {title} {name} ចូលរួមពិធីសិរីមង្គលអាពាហ៍ពិពាហ៍ {couple} នា{date} នៅ{venue}។\n" +
  "សូមចុចតំណខាងក្រោម ដើម្បីបើកលិខិតអញ្ជើញ៖\n{link}";

export type CaptionValues = { title: string; name: string; couple: string; date: string; venue: string; address: string; link: string };

/** The message for one guest. A template without {link} gets the link added at the end. */
export function renderCaption(template: string, v: CaptionValues): string {
  const tpl = template.trim() || DEFAULT_CAPTION;
  const text = tpl.replace(/\{(title|name|couple|date|venue|address|link)\}/g, (_, k: keyof CaptionValues) => v[k] ?? "");
  const withLink = tpl.includes("{link}") ? text : `${text}\n${v.link}`;
  // tidy what an empty value leaves behind (double spaces, a space before ។)
  return withLink.replace(/[ \t]{2,}/g, " ").replace(/ +([។,])/g, "$1").trim();
}

/** The same message without the link, for sharers that attach the link themselves (Telegram). */
export function captionWithoutLink(template: string, v: CaptionValues): string {
  return renderCaption(template, { ...v, link: "" });
}
