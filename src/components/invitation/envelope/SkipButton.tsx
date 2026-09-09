"use client";

/**
 * A quiet way past the animation. Present, findable, never competing.
 *
 * It is an `<a>` and not a `<button>`, and that is the whole point of it.
 *
 * The envelope has now been reported stuck on a phone across four rounds of
 * fixes, and whatever the cause turns out to be, the shape of the risk is
 * clear: this invitation goes to a wedding's guest list, and a guest who
 * cannot get past the envelope cannot read the invitation, cannot see the
 * venue and cannot reply. Every control on this overlay has so far needed
 * JavaScript to work, so a single fault takes all of them at once.
 *
 * A link does not. `?envelope=skip` is honoured by the server, so this works
 * with a dead bundle, a failed hydration, an old browser, or a click that a
 * particular WebKit refuses to dispatch — anything at all. When JavaScript
 * *is* running, the click handler takes over and plays the graceful exit
 * instead, and the guest never navigates. Progressive enhancement, for the one
 * control that has to be the last thing standing.
 */
export function SkipButton({
  label,
  onSkip,
  hidden,
}: {
  label: string;
  onSkip: () => void;
  hidden: boolean;
}) {
  return (
    <a
      href="?envelope=skip"
      onClick={(event) => {
        /* With JavaScript, no navigation: dissolve out where we stand. */
        event.preventDefault();
        onSkip();
      }}
      className={`env-skip tappable absolute bottom-[max(1rem,env(safe-area-inset-bottom))] right-4 rounded-full px-4 py-2 text-xs underline-offset-4 transition-opacity duration-500 hover:underline khmer-wrap sm:bottom-6 sm:right-6 ${
        hidden ? "pointer-events-none opacity-0" : "opacity-100"
      }`}
    >
      {label}
    </a>
  );
}
