import type { Wedding } from "@/lib/db/schema";
import { MonogramCrest } from "@/components/ui/MonogramCrest";
import { mediaSrc } from "@/lib/media";
import { NameLogoImage } from "./NameLogoImage";
import { WEDDING_TIMEZONE, toKhmerNumber } from "@/lib/khmer";

/** The wedding day as the crest prints it: ២៤ · ០៤ · ២០២៧ (in the wedding's time zone). */
function crestDate(value: Date | string | null | undefined): string {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  const parts = new Intl.DateTimeFormat("en-GB", { timeZone: WEDDING_TIMEZONE, day: "2-digit", month: "2-digit", year: "numeric" })
    .formatToParts(d)
    .reduce<Record<string, string>>((o, p) => ((o[p.type] = p.value), o), {});
  return [parts.day, parts.month, parts.year].map((v) => toKhmerNumber(v)).join(" · ");
}

/**
 * The face of the card: both families, the formal wording, the couple, and the
 * when and where — laid out the way a printed Khmer invitation sets them.
 */
export function InvitationMessage({ wedding }: { wedding: Wedding }) {
  return (
    <section id="invitation" className="msg section-pad relative text-center">
      <h2 className="gold-text text-[1.35rem] leading-[1.9] khmer-wrap">
        {wedding.title}
      </h2>

      {/* Both sets of parents, side by side as on a printed card */}
      <div className="mt-8 grid grid-cols-2 gap-x-5 gap-y-1 text-[0.95rem] title-face msg-ink khmer-wrap">
        <p>{wedding.groomFatherName}</p>
        <p>{wedding.brideFatherName}</p>
        <p>{wedding.groomMotherName}</p>
        <p>{wedding.brideMotherName}</p>
      </div>

      <p className="mt-9 text-sm title-face msg-ink khmer-wrap">{wedding.invitationLead}</p>

      {/*
        * One continuous sentence: the honorifics run straight into the
        * invitation itself, exactly as a printed Khmer invitation sets them.
        * It addresses the honorifics, never the individual guest — the guest is
        * greeted by name on the cover instead.
        */}
      <p className="msg-body mx-auto mt-3 text-[0.9rem] leading-loose msg-ink khmer-wrap">
        {`${wedding.invitationHonorific} ${wedding.invitationBody}`.replace(/\s+/g, " ").trim()}
      </p>

      {/* The couple, with their monogram between them: groom | mark | bride */}
      <div className={`msg-couple mt-10 ${wedding.nameLogoEnabled ? "" : "no-logo"}`}>
        <div className="min-w-0">
          <p className="text-xs title-face msg-ink khmer-wrap">កូនប្រុសនាម</p>
          <p className="mt-2 text-lg title-face msg-ink khmer-wrap">
            {wedding.groomFullName}
          </p>
        </div>
        {/* the couple's own name-logo image if they uploaded one; otherwise the drawn crest */}
        {!wedding.nameLogoEnabled ? null : wedding.nameLogoMediaId ? (
          <NameLogoImage
            src={mediaSrc(wedding.nameLogoMediaId, "")}
            mode={wedding.nameLogoMode}
            alt={`${wedding.groomName} & ${wedding.brideName}`}
            className="msg-monogram msg-name-logo"
          />
        ) : (
        <MonogramCrest
          text={wedding.monogram}
          groom={wedding.groomName}
          bride={wedding.brideName}
          font={wedding.monogramFont}
          date={crestDate(wedding.weddingDate)}
          className="msg-monogram"
        />
        )}
        <div className="min-w-0">
          <p className="text-xs title-face msg-ink khmer-wrap">កូនស្រីនាម</p>
          <p className="mt-2 text-lg title-face msg-ink khmer-wrap">
            {wedding.brideFullName}
          </p>
        </div>
      </div>

      {/* When and where: the couple's own wording, line by line, each falling
          back to the one built from the date, time and venue fields */}
      <p className="mt-10 text-[0.9rem] leading-loose msg-ink khmer-wrap">
        {wedding.invitationWhenIntro.trim() || `ដែលនឹងប្រព្រឹត្តទៅ ${wedding.weddingTimeKhmer}`}
      </p>
      {wedding.invitationLunarDate.trim() && (
        <p className="msg-venue mx-auto mt-2 text-[0.9rem] leading-loose msg-ink khmer-wrap">
          {wedding.invitationLunarDate.trim()}
        </p>
      )}
      <p className="mt-3 text-lg title-face msg-ink khmer-wrap">
        {wedding.invitationDateLine.trim() || wedding.weddingDateKhmer}
      </p>
      <p className="msg-venue mx-auto mt-3 text-[0.9rem] leading-loose msg-ink khmer-wrap">
        {wedding.invitationPlace.trim() ||
          `${wedding.venueName}${wedding.venueAddress ? ` ${wedding.venueAddress}` : ""}`}
      </p>


    </section>
  );
}
