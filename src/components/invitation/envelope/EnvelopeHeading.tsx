/**
 * The ceremonial heading on the set, above the envelope:
 * សិរីសួស្តីអាពាហ៍ពិពាហ៍ in Moul, and a small script line under it.
 *
 * Both come from the record (`envelopeTitle`, `envelopeSubtitle`) so a couple
 * can reword or remove either; an empty value takes the line away. It leaves
 * with the address as the seal gives, so nothing on the set competes with the
 * flap for the guest's eye.
 *
 * Solid colour, not `background-clip: text`: a foil gradient clipped to text
 * renders Khmer subscripts (coeng) transparent in more than one engine, and a
 * heading with holes in it is worse than a heading without foil.
 */
export function EnvelopeHeading({
  title,
  subtitle,
  gone,
}: {
  title: string;
  subtitle: string;
  gone: boolean;
}) {
  if (!title.trim() && !subtitle.trim()) return null;
  return (
    <div className={`env-heading ${gone ? "env-heading-gone" : ""}`} aria-hidden={gone}>
      {title.trim() && <h1 className="env-heading-title khmer-wrap">{title}</h1>}
      {subtitle.trim() && <p className="env-heading-sub">{subtitle}</p>}
    </div>
  );
}
