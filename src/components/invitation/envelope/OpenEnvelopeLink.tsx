"use client";

/**
 * The envelope's tap target — and it is an `<a href>`, not a `<button>`.
 *
 * This is the sixth attempt at one bug, and the first that does not need the
 * page's JavaScript to be working. The three reports that decided it all said
 * the same thing in different words: *it always works if I record my screen,
 * swipe the notification panel down, or leave the browser and come back.* Those
 * are not three faults. They are one — the page is put away and brought back —
 * and what they have in common is that iOS gets a chance to finish, or redo,
 * everything it had outstanding. A workaround of that shape says the tap is
 * arriving somewhere that is not ready to answer it, and every fix so far has
 * been a different guess at which layer that is: the cursor, the element, the
 * transform, the hydration, the hit-test map. Each was reasonable. None of them
 * could be tested here, because there is no WebKit in this container, and none
 * of them worked.
 *
 * So this stops guessing at the layer and removes the requirement instead.
 * A link is the one thing on a web page that a phone opens without asking the
 * page's JavaScript for permission — no bundle, no hydration, no event
 * dispatch, no React root, no hit-test map that anything else has to agree
 * with. It is the same reasoning that made the skip control an `<a>`, and the
 * skip control has never been reported stuck.
 *
 * With JavaScript alive the click is intercepted and the full opening plays, so
 * nothing about the intended experience changes and no navigation happens. When
 * it is not — a bundle still downloading, a main thread buried in rasterising
 * the scene, a webview that has decided to stop running scripts — the tap is a
 * navigation, the server answers `?envelope=open` with the invitation itself,
 * and the guest gets to the wedding details. They lose an animation. They do
 * not lose the invitation, which is the only thing that actually matters.
 *
 * `-webkit-touch-callout: none` is on `.env-anywhere`: a full-screen link would
 * otherwise offer to copy its own address on a long press.
 */
export function OpenEnvelopeLink({ label, onOpen }: { label: string; onOpen: () => void }) {
  return (
    <a
      href="?envelope=open"
      className="env-anywhere tappable"
      aria-label={label}
      onClick={(event) => {
        /* JavaScript is running, so play the thing rather than navigate. */
        event.preventDefault();
        onOpen();
      }}
    />
  );
}
