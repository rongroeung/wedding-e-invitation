import type { Guest, Wedding } from "@/lib/db/schema";
import { NameLogo } from "@/components/ui/NameLogo";
import { Flourish } from "@/components/ui/Ornaments";
import { KHMER_MONTHS, KHMER_WEEKDAYS, toKhmerNumber, zonedParts } from "@/lib/khmer";

/**
 * What the closed invitation says: the monogram, the occasion, and who it is
 * addressed to.
 *
 * Pulled out of `Cover` so the card that rises from the 3D envelope can be the
 * real thing rather than a mock-up of it. Both render this, so the card the
 * guest lifts out is the cover they would otherwise have landed on, and the
 * two can never drift apart.
 */
export function coverName(wedding: Wedding, guest: Guest | null) {
  // Latin names carry small-caps letter-spacing well; Khmer clusters do not.
  const latin = guest?.nameLatin?.trim();
  return {
    latin: Boolean(latin),
    text: latin || (guest ? `${guest.title} ${guest.name}` : wedding.invitationHonorific),
  };
}

/**
 * The date as four cells — ថ្ងៃ | ទី | ខែ | ឆ្នាំ — read off the wedding's own
 * date in Cambodia's time zone, so the server's HTML and the guest's browser
 * always agree on it.
 */
function DateGrid({ date }: { date: Date }) {
  const { weekday, day, month, year } = zonedParts(date);
  const cells = [
    ["ថ្ងៃ", KHMER_WEEKDAYS[weekday].replace(/^ថ្ងៃ/, "")],
    ["ទី", toKhmerNumber(day)],
    ["ខែ", KHMER_MONTHS[month - 1]],
    ["ឆ្នាំ", toKhmerNumber(year)],
  ];
  return (
    <dl className="cv-date" aria-label="កាលបរិច្ឆេទ">
      {cells.map(([label, value]) => (
        <div key={label} className="cv-date-cell">
          <dt className="cv-date-label">{label}</dt>
          <dd className="cv-date-value khmer-wrap">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

export function CoverContent({
  wedding,
  guest,
  action,
  reveal = false,
}: {
  wedding: Wedding;
  guest: Guest | null;
  /** The open button, when this is the live cover. */
  action?: React.ReactNode;
  /**
   * The cover is about to be seen: play the name mark's reveal.
   *
   * Passed down rather than decided here, because "seen" is a fact about the
   * *page* — the velvet starting to part — and this component cannot know it.
   */
  reveal?: boolean;
}) {
  const name = coverName(wedding, guest);
  const date = new Date(wedding.weddingDate);

  return (
    <div className="cv">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <Flourish role="crest" className="cv-crest" />

      <h1 className="cv-title khmer-wrap">{wedding.title}</h1>

      <NameLogo
        groom={wedding.groomName}
        bride={wedding.brideName}
        font={wedding.monogramFont}
        state={reveal ? "play" : "wait"}
        className="cv-names"
      />

      {wedding.subtitle && <p className="cv-lead khmer-wrap">{wedding.subtitle}</p>}
      <p className={`cv-guest ${name.latin ? "cv-guest-latin" : "khmer-wrap"}`}>{name.text}</p>

      {!Number.isNaN(date.getTime()) && <DateGrid date={date} />}

      {(wedding.weddingTimeKhmer || wedding.buddhistYear) && (
        <p className="cv-time khmer-wrap">
          {[wedding.weddingTimeKhmer, wedding.buddhistYear].filter(Boolean).join(" · ")}
        </p>
      )}
      {wedding.venueName && <p className="cv-venue khmer-wrap">{wedding.venueName}</p>}

      {action}
    </div>
  );
}
