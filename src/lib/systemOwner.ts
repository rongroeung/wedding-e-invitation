import type { SystemOwner } from "./db/schema";

export type OwnerContactKind = "instagram" | "telegram" | "facebook" | "tiktok" | "youtube" | "website" | "link";
export type OwnerContact = { kind: OwnerContactKind; label: string; href: string };

/** A username (with or without @) becomes the platform's link; a full link stays as it is. */
function profile(value: string, base: string): string {
  const v = value.trim().replace(/^@/, "");
  if (!v) return "";
  return /^https?:\/\//i.test(v) ? v : base + v;
}

/** TikTok and YouTube put the @ in the address: https://www.tiktok.com/@name */
function handlePath(value: string, base: string): string {
  const v = value.trim();
  if (!v) return "";
  return /^https?:\/\//i.test(v) ? v : base + v.replace(/^@/, "");
}

/** The owner's ways to be reached, in a fixed order, skipping any left empty. */
export function ownerContacts(o: SystemOwner): OwnerContact[] {
  const list: OwnerContact[] = [];
  const add = (kind: OwnerContactKind, label: string, href: string) => href && list.push({ kind, label, href });
  add("telegram", "Telegram", profile(o.telegram, "https://t.me/"));
  add("instagram", "Instagram", profile(o.instagram, "https://instagram.com/"));
  add("facebook", "Facebook", profile(o.facebook, "https://facebook.com/"));
  add("tiktok", "TikTok", handlePath(o.tiktok, "https://www.tiktok.com/@"));
  add("youtube", "YouTube", handlePath(o.youtube, "https://www.youtube.com/@"));
  if (o.website.trim()) add("website", "Website", /^https?:\/\//i.test(o.website.trim()) ? o.website.trim() : `https://${o.website.trim()}`);
  for (const l of o.links ?? []) if (l?.label && /^https?:\/\//i.test(l.url ?? "")) add("link", l.label, l.url);
  return list;
}

/** `tel:` address for a phone number as typed. */
export const telHref = (phone: string) => `tel:${phone.replace(/[^+\d]/g, "")}`;
