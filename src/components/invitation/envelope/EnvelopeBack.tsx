import { EnvelopeBotanical } from "./EnvelopeBotanical";

/**
 * The envelope's body — the sheet everything else is folded from.
 *
 * Two things live here that are easy to leave out and impossible to fake
 * afterwards: a sliver of the paper's own thickness showing past the front
 * panel, and the shadow the whole object casts on the surface below it.
 *
 * It sits at the back of the stack, so what actually shows of it is the two
 * shoulders either side of the closed flap — the side flaps, folded in behind
 * the top one. They are the same sheet as everything else, so they carry the
 * same die; two bare corners on an envelope covered in relief read as a fault
 * in the pressing rather than as restraint.
 */
export function EnvelopeBack({ dim }: { dim: boolean }) {
  return (
    <div
      className="env-layer env-fade"
      style={{ transform: "translateZ(0px)", opacity: dim ? 0 : 1 }}
      aria-hidden="true"
    >
      <span className="env-contact" />
      <span className="env-edge" />
      <span className="env-body env-grain absolute inset-0">
        <EnvelopeBotanical face="back" />
      </span>
    </div>
  );
}
