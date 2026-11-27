import { BRAND_NAME, BrandMark } from "@/components/admin/Brand";

/**
 * The maker's credit at the very end of the invitation: នាំសារ's mark and
 * name, a line inviting guests who would like an invitation of their own, and
 * how to reach us.
 *
 * The contact details are the site owner's, the same on every invitation, so
 * they are set once for the deployment rather than per wedding:
 *   NEXT_PUBLIC_CREDIT_PHONE      e.g. +855 12 345 678
 *   NEXT_PUBLIC_CREDIT_TELEGRAM   a username (without @) or a t.me link
 *   NEXT_PUBLIC_CREDIT_INSTAGRAM  a username or an instagram.com link
 * Any left unset is simply not shown — nothing is ever made up here.
 */
const phone = (process.env.NEXT_PUBLIC_CREDIT_PHONE ?? "").trim();
const telegram = link(process.env.NEXT_PUBLIC_CREDIT_TELEGRAM, "https://t.me/");
const instagram = link(process.env.NEXT_PUBLIC_CREDIT_INSTAGRAM, "https://instagram.com/");

function link(value: string | undefined, base: string): string {
  const v = (value ?? "").trim().replace(/^@/, "");
  if (!v) return "";
  return /^https?:\/\//.test(v) ? v : base + v;
}

export function SiteCredit() {
  const contacts = [
    instagram && { href: instagram, label: "Instagram", icon: <CameraIcon /> },
    telegram && { href: telegram, label: "Telegram", icon: <SendIcon /> },
  ].filter(Boolean) as { href: string; label: string; icon: React.ReactNode }[];

  return (
    <aside className="site-credit px-6 pb-10 pt-8 text-center" aria-label={BRAND_NAME}>
      <div className="mx-auto flex max-w-sm flex-col items-center">
        <BrandMark className="h-12 w-12 drop-shadow-sm" />
        <p className="site-credit-name mt-2">{BRAND_NAME}</p>
        <p className="site-credit-sub">សំបុត្រអញ្ជើញឌីជីថល</p>
        <p className="mt-5 text-[0.82rem] leading-loose msg-ink khmer-wrap">
          តើលោកអ្នកចាប់អារម្មណ៍នឹងប្រើប្រាស់សេវាកម្មសំបុត្រអញ្ជើញឌីជីថលរបស់ពួកយើង សម្រាប់កម្មវិធីរបស់លោកអ្នកដែរឬទេ?
          ទាក់ទងមកកាន់ពួកយើងតាមរយៈ
        </p>
        {phone && (
          <p className="mt-3 text-[0.78rem] msg-ink khmer-wrap">
            លេខទូរស័ព្ទ៖{" "}
            <a href={`tel:${phone.replace(/[^+\d]/g, "")}`} className="tabular-nums underline-offset-2 hover:underline">
              {phone}
            </a>
          </p>
        )}
        {contacts.length > 0 && (
          <div className="mt-5 flex items-start justify-center gap-7">
            {contacts.map((c) => (
              <a
                key={c.label}
                href={c.href}
                target="_blank"
                rel="noopener noreferrer"
                className="site-credit-link flex flex-col items-center gap-1.5"
              >
                <span className="site-credit-icon">{c.icon}</span>
                <span className="text-[0.7rem]">{c.label}</span>
              </a>
            ))}
          </div>
        )}
      </div>
    </aside>
  );
}

/* Plain, generic glyphs (a camera, a paper plane) rather than the platforms' logos. */
function CameraIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="M4 8.5h3l1.6-2.3h6.8L17 8.5h3v10H4z" strokeLinejoin="round" />
      <circle cx="12" cy="13.2" r="3.4" />
    </svg>
  );
}
function SendIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="M21 4 3 11.2l6.6 2.4L21 4l-8.8 11.9.1 4.1 2.6-3.1" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}
