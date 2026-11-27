import { BRAND_NAME, BrandMark } from "@/components/admin/Brand";
import type { SystemOwner as Owner } from "@/lib/db/schema";
import { ownerContacts, telHref, type OwnerContactKind } from "@/lib/systemOwner";

/**
 * The system owner, at the very end of every invitation: នាំសារ's mark and
 * name, their message, and how to reach them — phone, Telegram, Instagram and
 * any other links. Set once for the whole site by the owner, from the main
 * workspace (admin → ម្ចាស់ប្រព័ន្ធ). Anything left empty is not shown.
 */
export function SystemOwner({ owner }: { owner: Owner }) {
  const contacts = ownerContacts(owner);
  const phone = owner.phone.trim();
  return (
    <aside className="system-owner px-6 pb-10 pt-8 text-center" aria-label={BRAND_NAME}>
      <div className="mx-auto flex max-w-sm flex-col items-center">
        <BrandMark className="h-12 w-12 drop-shadow-sm" />
        <p className="system-owner-name mt-2">{BRAND_NAME}</p>
        <p className="system-owner-sub">សំបុត្រអញ្ជើញឌីជីថល</p>
        {owner.message.trim() && (
          <p className="mt-5 text-[0.82rem] leading-loose msg-ink khmer-wrap">{owner.message}</p>
        )}
        {phone && (
          <p className="mt-3 text-[0.78rem] msg-ink khmer-wrap">
            លេខទូរស័ព្ទ៖{" "}
            <a href={telHref(phone)} className="tabular-nums underline-offset-2 hover:underline">
              {phone}
            </a>
          </p>
        )}
        {contacts.length > 0 && (
          <div className="mt-5 flex flex-wrap items-start justify-center gap-x-6 gap-y-4">
            {contacts.map((c) => (
              <a
                key={`${c.kind}:${c.href}`}
                href={c.href}
                target="_blank"
                rel="noopener noreferrer"
                className="system-owner-link flex w-16 flex-col items-center gap-1.5"
              >
                <span className="system-owner-icon">
                  <ContactIcon kind={c.kind} />
                </span>
                <span className="max-w-full truncate text-[0.7rem]">{c.label}</span>
              </a>
            ))}
          </div>
        )}
      </div>
    </aside>
  );
}

/* Plain, generic glyphs, not the platforms' own logos. */
function ContactIcon({ kind }: { kind: OwnerContactKind }) {
  const p = { viewBox: "0 0 24 24", className: "h-5 w-5", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true };
  switch (kind) {
    case "instagram": // a camera
      return (<svg {...p}><path d="M4 8.5h3l1.6-2.3h6.8L17 8.5h3v10H4z" /><circle cx="12" cy="13.2" r="3.4" /></svg>);
    case "telegram": // a paper plane
      return (<svg {...p}><path d="M21 4 3 11.2l6.6 2.4L21 4l-8.8 11.9.1 4.1 2.6-3.1" /></svg>);
    case "facebook": // two people
      return (<svg {...p}><circle cx="9" cy="9" r="3" /><path d="M3.5 19c.6-3 2.8-4.6 5.5-4.6s4.9 1.6 5.5 4.6" /><circle cx="16.5" cy="10" r="2.4" /><path d="M15.5 14.6c2.6-.3 4.5 1.1 5 4.4" /></svg>);
    case "tiktok": // a music note
      return (<svg {...p}><path d="M14 4v10.5a3 3 0 1 1-3-3" /><path d="M14 4c.4 2.4 2 3.8 4.5 4" /></svg>);
    case "youtube": // a play button
      return (<svg {...p}><rect x="3" y="6" width="18" height="12" rx="3.5" /><path d="m10.5 9.5 4 2.5-4 2.5z" /></svg>);
    case "website": // a globe
      return (<svg {...p}><circle cx="12" cy="12" r="8.5" /><path d="M3.5 12h17M12 3.5c2.4 2.6 2.4 14.4 0 17M12 3.5c-2.4 2.6-2.4 14.4 0 17" /></svg>);
    default: // a link
      return (<svg {...p}><path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1" /><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1" /></svg>);
  }
}
