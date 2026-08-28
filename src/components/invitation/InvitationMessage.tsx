import type { Wedding } from "@/lib/db/schema";

/**
 * The face of the card: both families, the formal wording, the couple, and the
 * when and where — laid out the way a printed Khmer invitation sets them.
 */
export function InvitationMessage({ wedding }: { wedding: Wedding }) {
  return (
    <section id="invitation" className="section-pad relative text-center">
      <h2 className="gold-text text-[1.35rem] leading-[1.9] khmer-wrap">
        {wedding.title}
      </h2>

      {/* Both sets of parents, side by side as on a printed card */}
      <div className="mt-8 grid grid-cols-2 gap-x-5 gap-y-1 text-[0.95rem] leading-loose text-heading khmer-wrap">
        <p>{wedding.groomFatherName}</p>
        <p>{wedding.brideFatherName}</p>
        <p>{wedding.groomMotherName}</p>
        <p>{wedding.brideMotherName}</p>
      </div>

      <p className="mt-9 text-sm text-gold-1 khmer-wrap">{wedding.subtitle}</p>

      {/*
        * One continuous sentence: the honorifics run straight into the
        * invitation itself, exactly as a printed Khmer invitation sets them.
        * It addresses the honorifics, never the individual guest — the guest is
        * greeted by name on the cover instead.
        */}
      <p className="mx-auto mt-3 max-w-[32rem] text-[0.9rem] leading-loose text-ink/90 khmer-wrap">
        {`${wedding.invitationHonorific} ${wedding.invitationBody}`.replace(/\s+/g, " ").trim()}
      </p>

      {/* The couple */}
      <div className="mt-10 grid grid-cols-2 gap-x-5">
        <div>
          <p className="text-xs text-ink/75 khmer-wrap">កូនប្រុសនាម</p>
          <p className="mt-2 text-lg font-semibold leading-loose text-heading khmer-wrap">
            {wedding.groomFullName}
          </p>
        </div>
        <div>
          <p className="text-xs text-ink/75 khmer-wrap">កូនស្រីនាម</p>
          <p className="mt-2 text-lg font-semibold leading-loose text-heading khmer-wrap">
            {wedding.brideFullName}
          </p>
        </div>
      </div>

      {/* When and where */}
      <p className="mt-10 text-[0.9rem] leading-loose text-ink/90 khmer-wrap">
        ដែលនឹងប្រព្រឹត្តទៅ {wedding.weddingTimeKhmer}
      </p>
      <p className="mt-3 text-lg font-semibold leading-loose text-heading khmer-wrap">
        {wedding.weddingDateKhmer}
      </p>
      <p className="mx-auto mt-3 max-w-[26rem] text-[0.9rem] leading-loose text-ink/85 khmer-wrap">
        {wedding.venueName}
        {wedding.venueAddress ? ` ${wedding.venueAddress}` : ""}
      </p>

      {wedding.mapUrl && (
        <a
          href={wedding.mapUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-outline mt-8 khmer-wrap"
        >
          បើកផែនទី <span aria-hidden="true">📍</span>
        </a>
      )}

    </section>
  );
}
