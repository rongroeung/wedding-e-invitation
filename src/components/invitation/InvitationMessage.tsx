import type { Wedding } from "@/lib/db/schema";
import { Fit } from "@/components/ui/FitLine";

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
      {/* each name on one line: on a narrow phone all four shrink together */}
      <div className="mt-8 grid grid-cols-2 gap-x-3 gap-y-1 text-[0.95rem] title-face msg-ink sm:gap-x-5">
        <Fit>{wedding.groomFatherName}</Fit>
        <Fit>{wedding.brideFatherName}</Fit>
        <Fit>{wedding.groomMotherName}</Fit>
        <Fit>{wedding.brideMotherName}</Fit>
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

      {/* The couple: groom | ជាគូនឹង | bride */}
      <div className="msg-couple mt-10">
        <div className="min-w-0">
          <p className="text-xs title-face msg-ink khmer-wrap">កូនប្រុសនាម</p>
          <Fit className="mt-2 text-lg title-face msg-ink">{wedding.groomFullName}</Fit>
        </div>
        {/* between the two names, the words that join them */}
        <p className="msg-join self-center text-lg title-face msg-ink khmer-wrap">ជាគូនឹង</p>
        <div className="min-w-0">
          <p className="text-xs title-face msg-ink khmer-wrap">កូនស្រីនាម</p>
          <Fit className="mt-2 text-lg title-face msg-ink">{wedding.brideFullName}</Fit>
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
      <div className="mt-3 text-lg title-face msg-ink">
        <Fit>{wedding.invitationDateLine.trim() || wedding.weddingDateKhmer}</Fit>
      </div>
      <p className="msg-venue mx-auto mt-3 text-[0.9rem] leading-loose msg-ink khmer-wrap">
        {wedding.invitationPlace.trim() ||
          `${wedding.venueName}${wedding.venueAddress ? ` ${wedding.venueAddress}` : ""}`}
      </p>


    </section>
  );
}
