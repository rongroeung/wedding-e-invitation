import type { Guest, Wedding } from "@/lib/db/schema";
import { coverName } from "../CoverContent";

/**
 * Who the envelope is addressed to, set on the envelope scene itself.
 *
 * This is the one piece of writing that belongs *outside* the paper rather than
 * on it. A real invitation envelope carries the address on its face, and it is
 * the first thing anybody reads: the honorific — ឯកឧត្តម លោកអ្នកឧកញ៉ា … — is not
 * decoration but the form of respect the invitation is issued in, and reading
 * it before the seal is broken is the whole courtesy of the thing.
 *
 * It is not printed onto the two front panels, tempting as that is. The panels
 * split down the middle and swing outward, so a line of type across the join
 * would be cut in half the moment the envelope opened and each half carried off
 * to a different side of the screen — which is exactly right for a wax seal and
 * completely wrong for someone's name.
 *
 * So it stands above the envelope, in the room, and it leaves as the panels
 * begin to move: by then the guest has been addressed and the envelope has
 * something better to show them. It goes on `opacity` and `transform` alone,
 * and it goes *before* the doors rather than with them, so the two movements
 * never compete.
 */
export function EnvelopeAddress({
  wedding,
  guest,
  gone,
}: {
  wedding: Wedding;
  guest: Guest | null;
  /** The seal has given; the address has done its job. */
  gone: boolean;
}) {
  const name = coverName(wedding, guest);

  return (
    <div className={`env-address ${gone ? "env-address-gone" : ""}`} aria-hidden="true">
      {wedding.subtitle && <p className="env-address-lead khmer-wrap">{wedding.subtitle}</p>}

      <p className={`env-address-name khmer-wrap ${name.latin ? "env-address-latin" : ""}`}>
        {name.text}
      </p>
    </div>
  );
}
