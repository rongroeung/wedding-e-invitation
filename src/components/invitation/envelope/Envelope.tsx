import { EnvelopeBack } from "./EnvelopeBack";
import { EnvelopeInnerLiner } from "./EnvelopeInnerLiner";
import { SlidingCover } from "./SlidingCover";

/**
 * The envelope: three layers standing at three distances from the camera
 * inside one `preserve-3d` stage.
 *
 *   contact (-1)  →  body (0)  →  liner (1)  →  glow (2)  →  cover (3)  →  seal (4)
 *
 * **There is no card in here any more.** There was, and it was wrong: the
 * envelope opened, the invitation came forward, the camera closed on it, and
 * the whole thing landed on the page's own card — a complete little reveal of
 * its own, finished, before the curtains had done anything at all. Two reveals
 * in a row is one too many, and the second one is the one that matters. The
 * envelope's job is to open; the invitation belongs behind the velvet, which is
 * the only place it is actually read.
 *
 * So the panels slide apart onto the lining and the warm light inside, and that
 * light is what the curtain scene arrives over. Everything that used to serve
 * the card — the flight pose, the measured morph onto `.card-stock`, the depth
 * it needed to clear the front — has gone with it.
 *
 * They are `z-index` and no longer `translateZ`, and that is not a tidy-up. A
 * child of a `preserve-3d` element cannot be promoted to its own compositor
 * layer, so every frame of the slide re-rasterised both panels — and a panel
 * carries a full blind-emboss drawing, five instanced passes over the same
 * geometry, at whatever size the envelope happens to be. Flattened, the slide
 * is the compositor moving two textures it already has. Nothing here rotates
 * any more, so there was never anything the third dimension was still buying.
 *
 * The order still matters exactly as much: the glow has to sit in front of the
 * lining and behind the cover, or it is either buried or laid over the paper
 * like a sticker.
 */
export function Envelope({
  envelope,
  phase,
}: {
  envelope: {
    showSeal: boolean;
    sealText: string;
    ornament: "corner" | "corner-rich";
  };
  phase: {
    /** The wax has given and the seal has lifted off the join. */
    unsealed: boolean;
    /** The two front panels are sliding apart. */
    doorsOpen: boolean;
  };
}) {
  return (
    <>
      <EnvelopeBack dim={false} />

      {/*
        * The lining, which is what the open panels actually disclose. It is the
        * inside of the envelope — a shade deeper than the outside, and darkest
        * at the middle where least light reaches.
        */}
      <EnvelopeInnerLiner dim={false} mouthOpen={phase.doorsOpen} />

      {/*
        * The warm light coming out as the panels part.
        *
        * With the card gone this is the whole of what is revealed, so it does
        * more work than it used to — but not much more. It arrives with the
        * doors and never before: a glow already burning inside a sealed
        * envelope is a lamp under a sheet of paper.
        */}
      <span className={`env-glow ${phase.doorsOpen ? "env-glow-on" : ""}`} aria-hidden="true" />

      <SlidingCover
        unsealed={phase.unsealed}
        open={phase.doorsOpen}
        gold={!phase.unsealed}
        seal={envelope.showSeal ? envelope.sealText : null}
        dense={envelope.ornament === "corner-rich"}
      />
    </>
  );
}
